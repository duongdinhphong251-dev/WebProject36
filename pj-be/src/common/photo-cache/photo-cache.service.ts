import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { createHash } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shape of a single entry inside the `spas.photos` JSONB array. */
export interface PhotoEntry {
  /** Google Places photo resource name, e.g. "places/ChIJ.../photos/AXCi..." */
  name?: string;
  /** GCS public URL — populated after first fetch+upload cycle. */
  url?: string;
  widthPx?: number;
  heightPx?: number;
  [key: string]: unknown;
}

interface FetchResult {
  url: string | null;
  resolvedName: string;
  reason?: 'ok' | 'missing_config' | 'invalid_resource_missing_place_id' | 'unresolved';
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Reusable service: resolves Google Places photo names to GCS-hosted URLs.
 *
 * Flow per photo:
 *   1. If `entry.url` exists → return it directly (already cached).
 *   2. Call Google Places Photos API (v1) to get a temporary `photoUri`.
 *   3. Download raw image bytes from `photoUri`.
 *   4. Upload to GCS at `spa-photos/{entityId}/{stableHash}.jpg`.
 *   5. Persist the GCS URL back into `spas.photos` JSONB so step 1 hits next time.
 *   6. Return the public GCS URL.
 *
 * Errors are caught per-photo and logged; failing photos are silently skipped.
 */
@Injectable()
export class PhotoCacheService {
  private readonly logger = new Logger(PhotoCacheService.name);

  /** Tránh log dài (Places name, signed URL) làm tràn token khi copy log. */
  private logTail(s: string | null | undefined, max = 52): string {
    if (s == null || s === '') return '∅';
    const t = s.trim();
    if (t.length <= max) return t;
    return `…${t.slice(-(max - 1))}`;
  }

  private logSpa(spaId: string): string {
    return spaId.length <= 10 ? spaId : `${spaId.slice(0, 8)}…`;
  }
  private readonly gcsStorage: Storage | null;
  private readonly bucketName: string | null;
  /** Ảnh crawl lưu bucket riêng (vd. spa_images). `null` = không ký bucket legacy. */
  private readonly legacySpaImagesBucket: string | null;
  private readonly mapsApiKey: string | null;
  private readonly signedUrlTtlSeconds: number;
  private readonly localAssetBaseUrl: string;

  /** Tránh gọi `getSignedUrl` lặp lại cho cùng object (list API hay gọi ~20×/request). */
  private readonly signedUrlMemCache = new Map<string, { url: string; expiresAt: number }>();
  private readonly signedUrlMemMaxEntries = 800;

  constructor(
    private readonly config: ConfigService,
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.mapsApiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY') ?? null;
    this.bucketName = this.config.get<string>('GCS_BUCKET_NAME') ?? null;
    const legacyRaw = this.config.get<string | undefined>('GCS_LEGACY_SPA_IMAGES_BUCKET');
    this.legacySpaImagesBucket =
      legacyRaw === '' ? null : legacyRaw === undefined ? 'spa_images' : legacyRaw;
    this.signedUrlTtlSeconds = this.config.get<number>('SIGNED_URL_TTL_SECONDS') ?? 259_200;
    const configuredBaseUrl =
      this.config.get<string>('PUBLIC_API_BASE_URL')
      ?? this.config.get<string>('APP_URL')
      ?? this.config.get<string>('API_URL')
      ?? null;
    const port = this.config.get<string>('PORT') ?? '8081';
    this.localAssetBaseUrl = (configuredBaseUrl?.trim() || `http://localhost:${port}`).replace(/\/+$/, '');

    const keyFile = this.config.get<string>('GCS_KEY_FILE');
    const needGcsClient = Boolean(this.bucketName) || Boolean(this.legacySpaImagesBucket);
    if (needGcsClient) {
      this.gcsStorage = keyFile
        ? new Storage({ keyFilename: keyFile })
        : new Storage(); // falls back to Application Default Credentials
    } else {
      this.gcsStorage = null;
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Resolve all photos for a spa to direct URLs.
   * - Entries that already have a `url` are returned as-is.
   * - Entries with only a `name` are fetched from Google, uploaded to GCS, and
   *   the JSONB in DB is updated so the URL is cached for future calls.
   *
   * @param spaId  UUID of the spa (used as GCS path prefix and DB key)
   * @param photos Raw JSONB array from `spas.photos`
   * @returns      Array of resolved image URLs (skipping unresolvable entries)
   */
  async resolvePhotos(spaId: string, photos: unknown, googlePlaceId?: string | null): Promise<string[]> {
    const entries = Array.isArray(photos) ? (photos as PhotoEntry[]) : [];
    const dbNames = entries
      .map((e) => (typeof e?.name === 'string' ? e.name.trim() : null))
      .filter((x): x is string => !!x);

    const candidateNames =
      dbNames.length > 0
        ? dbNames
        : googlePlaceId
          ? await this.getLatestPhotoNamesByPlaceId(googlePlaceId)
          : [];

    if (candidateNames.length === 0) return [];

    const urlByName = new Map(
      entries
        .filter((e) => typeof e?.name === 'string' && typeof e?.url === 'string')
        .map((e) => [String(e.name).trim(), String(e.url).trim()]),
    );
    const resolved: string[] = [];
    const updates: { originalName: string; resolvedName: string; url: string }[] = [];
    let skipped = 0;
    const usedResolvedNames = new Set<string>();
    const usedResolvedUrls = new Set<string>();
    const src = dbNames.length > 0 ? 'db' : googlePlaceId ? 'place' : 'none';
    this.logger.verbose(
      `resolvePhotos spa=${this.logSpa(spaId)} n=${candidateNames.length} src=${src} place=${this.logTail(googlePlaceId ?? '', 24)}`,
    );

    // Resolve sequentially to avoid remapping multiple stale names to one fresh image.
    for (const name of candidateNames) {
      const cachedUrl = urlByName.get(name) ?? null;
      if (cachedUrl) {
        const signed = await this.toSignedUrlIfGcs(cachedUrl);
        const displayUrl = signed ?? cachedUrl;
        if (displayUrl && !usedResolvedUrls.has(displayUrl)) {
          resolved.push(displayUrl);
          usedResolvedUrls.add(displayUrl);
        }
        continue;
      }
      const normalizedName = this.normalizePhotoName(name);
      if (!normalizedName) continue;

      try {
        const result = await this.fetchAndUpload(
          normalizedName,
          spaId,
          googlePlaceId,
          usedResolvedNames,
        );
        if (result.url) {
          usedResolvedNames.add(result.resolvedName);
          const signed = await this.toSignedUrlIfGcs(result.url);
          const displayUrl = signed ?? result.url;
          if (!usedResolvedUrls.has(displayUrl)) {
            resolved.push(displayUrl);
            usedResolvedUrls.add(displayUrl);
          }
          updates.push({ originalName: normalizedName, resolvedName: result.resolvedName, url: result.url });
        } else {
          skipped += 1;
        }
      } catch (err) {
        skipped += 1;
        this.logger.warn(
          `resolvePhotos fail spa=${this.logSpa(spaId)} name=${this.logTail(normalizedName)}: ${err}`,
        );
      }
    }

    // Persist new URLs back to DB (non-blocking relative to caller)
    if (updates.length > 0) {
      const fromPlaceApiOnly = dbNames.length === 0 && !!googlePlaceId;
      if (fromPlaceApiOnly) {
        this.persistResolvedPhotos(
          spaId,
          updates.map((u) => ({ name: u.resolvedName, url: u.url })),
        ).catch((err) =>
          this.logger.error(`Failed to persist resolved photos [spaId=${spaId}]: ${err}`),
        );
      } else {
        this.persistUrlsToDb(spaId, updates).catch((err) =>
          this.logger.error(`Failed to persist photo URLs [spaId=${spaId}]: ${err}`),
        );
      }
    }

    this.logger.verbose(
      `resolvePhotos done spa=${this.logSpa(spaId)} resolved=${resolved.length}/${entries.length} writes=${updates.length} skip=${skipped}`,
    );

    return resolved;
  }

  /**
   * Resolve a single representative photo URL for list pages.
   * Priority:
   *  - existing cached `entry.url` (signed if bucket is private)
   *  - fetch+upload first valid `entry.name`, then return signed/direct GCS URL
   */
  async resolvePrimaryPhotoUrl(
    spaId: string,
    photos: unknown,
    googlePlaceId?: string | null,
  ): Promise<string | null> {
    const entries = Array.isArray(photos) ? (photos as PhotoEntry[]) : [];
    const dbNames = entries
      .map((e) => (typeof e?.name === 'string' ? e.name.trim() : null))
      .filter((x): x is string => !!x);

    const candidateNames =
      dbNames.length > 0
        ? dbNames
        : googlePlaceId
          ? await this.getLatestPhotoNamesByPlaceId(googlePlaceId)
          : [];

    if (candidateNames.length === 0) return null;

    const urlByName = new Map(
      entries
        .filter((e) => typeof e?.name === 'string' && typeof e?.url === 'string')
        .map((e) => [String(e.name).trim(), String(e.url).trim()]),
    );

    for (const name of candidateNames) {
      const cachedUrl = urlByName.get(name) ?? null;
      if (cachedUrl) {
        const signed = await this.toSignedUrlIfGcs(cachedUrl);
        return signed ?? cachedUrl;
      }
    }

    this.logger.verbose(
      `primaryPhoto willFetch spa=${this.logSpa(spaId)} nCand=${candidateNames.length} src=${dbNames.length > 0 ? 'db' : 'place'} place=${this.logTail(googlePlaceId ?? '', 24)}`,
    );

    const firstName = candidateNames[0]!;
    const normalizedName = this.normalizePhotoName(firstName);
    if (!normalizedName) return null;

    try {
      const result = await this.fetchAndUpload(normalizedName, spaId, googlePlaceId);
      if (!result.url) return null;
      const usedDbCandidates = dbNames.length > 0;
      if (!usedDbCandidates && googlePlaceId) {
        await this.persistResolvedPhotos(spaId, [{ name: result.resolvedName, url: result.url }]);
      } else {
        await this.persistUrlsToDb(spaId, [
          { originalName: normalizedName, resolvedName: result.resolvedName, url: result.url },
        ]);
      }
      const signed = await this.toSignedUrlIfGcs(result.url);
      return signed ?? result.url;
    } catch (err) {
      this.logger.warn(
        `primaryPhoto fail spa=${this.logSpa(spaId)} name=${this.logTail(firstName)}: ${err}`,
      );
      return null;
    }
  }

  async toDisplayUrl(url: string | null | undefined): Promise<string | null> {
    if (!url) return null;
    if (url.startsWith('/')) return `${this.localAssetBaseUrl}${url}`;
    const signed = await this.toSignedUrlIfGcs(url);
    return signed ?? url;
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  /** Fetch from Google Places API, upload to GCS, return public URL. */
  private async fetchAndUpload(
    photoName: string,
    spaId: string,
    googlePlaceId?: string | null,
    usedResolvedNames?: Set<string>,
  ): Promise<FetchResult> {
    this.logger.verbose(
      `fetchUpload spa=${this.logSpa(spaId)} ref=${this.logTail(photoName)} place=${this.logTail(googlePlaceId ?? '', 24)}`,
    );
    if (!this.mapsApiKey || !this.gcsStorage || !this.bucketName) {
      this.logger.warn('PhotoCacheService: GOOGLE_MAPS_API_KEY or GCS_BUCKET_NAME not configured — skipping photo fetch');
      return { url: null, resolvedName: photoName, reason: 'missing_config' };
    }

    // 1. Get temporary photo URI from Google Places Photos API (v1)
    const firstTry = await this.getGooglePhotoUri(photoName);
    let finalPhotoName = photoName;
    let photoUri = firstTry.photoUri;

    // Resource name cũ trong DB có thể stale; refresh từ Place Details và retry.
    if (!photoUri && firstTry.invalidResource && googlePlaceId) {
      const freshNames = await this.getLatestPhotoNamesByPlaceId(googlePlaceId);
      this.logger.verbose(`fetchUpload stale→refresh spa=${this.logSpa(spaId)} freshN=${freshNames.length}`);
      for (const freshName of freshNames) {
        if (usedResolvedNames?.has(freshName)) continue;
        const retry = await this.getGooglePhotoUri(freshName);
        if (retry.photoUri) {
          photoUri = retry.photoUri;
          finalPhotoName = freshName;
          this.logger.warn(
            `photo stale refresh spa=${this.logSpa(spaId)} ${this.logTail(photoName)}→${this.logTail(freshName)}`,
          );
          break;
        }
      }
    } else if (!photoUri && firstTry.invalidResource && !googlePlaceId) {
      this.logger.warn(`photo stale skip no_place spa=${this.logSpa(spaId)} ref=${this.logTail(photoName)}`);
      return { url: null, resolvedName: finalPhotoName, reason: 'invalid_resource_missing_place_id' };
    }

    if (!photoUri) return { url: null, resolvedName: finalPhotoName, reason: 'unresolved' };

    // 2. Download image bytes
    const imageBuffer = await this.downloadImage(photoUri);
    if (!imageBuffer) return { url: null, resolvedName: finalPhotoName, reason: 'unresolved' };

    // 3. Upload to GCS
    const gcsPath = `spa-photos/${spaId}/${this.stableKey(finalPhotoName)}.jpg`;
    const gcsUrl = await this.uploadToGcs(gcsPath, imageBuffer);
    this.logger.verbose(`fetchUpload done spa=${this.logSpa(spaId)} ok=${!!gcsUrl} ref=${this.logTail(finalPhotoName)}`);
    return { url: gcsUrl, resolvedName: finalPhotoName, reason: 'ok' };
  }

  /** Call Places API v1 photos endpoint, return `photoUri`. */
  private async getGooglePhotoUri(photoName: string): Promise<{ photoUri: string | null; invalidResource: boolean }> {
    const encodedName = photoName
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const url =
      `https://places.googleapis.com/v1/${encodedName}/media` +
      `?maxWidthPx=1600&skipHttpRedirect=true`;

    const res = await fetch(url, {
      headers: { 'X-Goog-Api-Key': this.mapsApiKey! },
    });

    if (res.ok) {
      const body = (await res.json()) as { photoUri?: string };
      this.logger.verbose(`placesPhoto ok ref=${this.logTail(photoName)} uri=${!!body.photoUri}`);
      return { photoUri: body.photoUri ?? null, invalidResource: false };
    }

    let invalidResource = false;
    try {
      const errBody = await res.json() as { error?: { message?: string } };
      invalidResource = (errBody.error?.message ?? '').toLowerCase().includes('photo resource in the request is invalid');
      const msg = (errBody.error?.message ?? 'n/a').slice(0, 120);
      this.logger.warn(`placesPhoto ${res.status} ref=${this.logTail(photoName)} ${msg}`);
    } catch {
      this.logger.warn(`placesPhoto ${res.status} ref=${this.logTail(photoName)}`);
    }
    return { photoUri: null, invalidResource };
  }

  /** Download raw bytes from a URL. */
  private async downloadImage(uri: string): Promise<Buffer | null> {
    const res = await fetch(uri);
    if (!res.ok) {
      this.logger.warn(`img dl ${res.status} ${this.logTail(uri, 72)}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /** Upload buffer to GCS and return the public URL. */
  private async uploadToGcs(gcsPath: string, buffer: Buffer): Promise<string | null> {
    try {
      const bucket = this.gcsStorage!.bucket(this.bucketName!);
      const file = bucket.file(gcsPath);
      await file.save(buffer, { contentType: 'image/jpeg', resumable: false });
      // UBLA buckets do not allow per-object ACL changes (makePublic).
      // Public access should be configured at bucket IAM level instead.
      return `https://storage.googleapis.com/${this.bucketName}/${gcsPath}`;
    } catch (err) {
      this.logger.error(`GCS upload failed [path=${gcsPath}]: ${err}`);
      return null;
    }
  }

  /**
   * Patch each updated photo entry in the `spas.photos` JSONB by merging
   * `{ url }` into the matching object (matched by `name`).
   */
  private async persistUrlsToDb(
    spaId: string,
    updates: { originalName: string; resolvedName: string; url: string }[],
  ): Promise<void> {
    // Build a JSONB update expression that iterates array elements and patches
    // the matching entry with the resolved URL.
    // We do one round-trip per update to keep the SQL readable.
    for (const { originalName, resolvedName, url } of updates) {
      await this.db
        .update(schema.spas)
        .set({
          photos: sql`(
            SELECT jsonb_agg(
              CASE WHEN elem->>'name' = ${originalName}
                THEN elem || jsonb_build_object('name', ${resolvedName}::text, 'url', ${url}::text)
                ELSE elem
              END
            )
            FROM jsonb_array_elements(${schema.spas.photos}) AS elem
          )`,
        })
        .where(eq(schema.spas.id, spaId));
    }
  }

  private async persistResolvedPhotos(
    spaId: string,
    entries: Array<{ name: string; url: string }>,
  ): Promise<void> {
    const unique = [...new Map(entries.map((e) => [e.name, e])).values()];
    if (unique.length === 0) return;

    await this.db
      .update(schema.spas)
      .set({
        photos: sql`${JSON.stringify(unique)}::jsonb`,
      })
      .where(eq(schema.spas.id, spaId));
  }

  /** Stable 16-char hex key derived from the photo resource name. */
  private stableKey(photoName: string): string {
    return createHash('sha256').update(photoName).digest('hex').slice(0, 16);
  }

  /** If URL points to a configured GCS bucket, return V4 signed URL; otherwise return original URL. */
  private async toSignedUrlIfGcs(url: string): Promise<string | null> {
    if (!this.gcsStorage) return url;
    const parsed = this.parseGcsPublicUrl(url);
    if (!parsed) return url;
    if (!this.isSignableGcsBucket(parsed.bucket)) return url;

    const { bucket, objectPath } = parsed;
    const cacheKey = `${bucket}/${objectPath}`;
    const now = Date.now();
    const hit = this.signedUrlMemCache.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      return hit.url;
    }

    try {
      const [signedUrl] = await this.gcsStorage
        .bucket(bucket)
        .file(objectPath)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: now + this.signedUrlTtlSeconds * 1000,
        });
      const urlTtlMs = this.signedUrlTtlSeconds * 1000;
      const memTtlMs = Math.min(180_000, Math.max(45_000, urlTtlMs - 120_000));
      if (this.signedUrlMemCache.size >= this.signedUrlMemMaxEntries) {
        const firstKey = this.signedUrlMemCache.keys().next().value;
        if (firstKey !== undefined) this.signedUrlMemCache.delete(firstKey);
      }
      this.signedUrlMemCache.set(cacheKey, { url: signedUrl, expiresAt: now + memTtlMs });
      return signedUrl;
    } catch (err) {
      this.logger.warn(`signUrl fail ${this.logTail(cacheKey, 64)}: ${err}`);
      return url;
    }
  }

  private isSignableGcsBucket(bucket: string): boolean {
    if (this.bucketName && bucket === this.bucketName) return true;
    if (this.legacySpaImagesBucket && bucket === this.legacySpaImagesBucket) return true;
    return false;
  }

  /** Parse bucket + object path from common GCS URL forms (any bucket name). */
  private parseGcsPublicUrl(url: string): { bucket: string; objectPath: string } | null {
    const clean = url.trim();

    // gs://bucket/path/to/object
    if (clean.startsWith('gs://')) {
      const withoutScheme = clean.slice('gs://'.length);
      const slash = withoutScheme.indexOf('/');
      if (slash <= 0 || slash === withoutScheme.length - 1) return null;
      const bucket = withoutScheme.slice(0, slash);
      const objectPath = withoutScheme.slice(slash + 1);
      return bucket && objectPath ? { bucket, objectPath } : null;
    }

    // https://storage.googleapis.com/bucket/path/to/object
    const directHost = 'https://storage.googleapis.com/';
    if (clean.startsWith(directHost)) {
      const rest = clean.slice(directHost.length);
      const slash = rest.indexOf('/');
      if (slash <= 0 || slash === rest.length - 1) return null;
      const bucket = rest.slice(0, slash);
      const objectPath = rest.slice(slash + 1);
      return bucket && objectPath ? { bucket, objectPath } : null;
    }

    // https://<bucket>.storage.googleapis.com/path/to/object
    const vhMatch = /^https:\/\/([^/]+)\.storage\.googleapis\.com\/(.+)$/i.exec(clean);
    if (vhMatch?.[1] && vhMatch[2]) {
      return { bucket: vhMatch[1], objectPath: vhMatch[2] };
    }

    return null;
  }

  /** Trim and sanitize photo name from JSONB before building API URL. */
  private normalizePhotoName(rawName: string): string | null {
    const name = rawName.trim();
    if (!name) return null;
    return name;
  }

  /** Extract trailing photo reference for legacy Places Photo endpoint. */
  /** Fetch latest photo resource names from Places Details (New) by placeId. */
  private async getLatestPhotoNamesByPlaceId(placeId: string): Promise<string[]> {
    if (!this.mapsApiKey) return [];
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': this.mapsApiKey,
        'X-Goog-FieldMask': 'photos.name',
      },
    });
    if (!res.ok) {
      this.logger.warn(`placesDetails ${res.status} place=${this.logTail(placeId, 36)}`);
      return [];
    }
    const body = (await res.json()) as { photos?: Array<{ name?: string }> };
    return (body.photos ?? [])
      .map((p) => p.name?.trim())
      .filter((n): n is string => !!n);
  }
}
