import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../db/db.provider';
import * as schema from '../../db/schema';
import { canonicalDealSlug } from '../../common/utils/canonical-deal-slug.util';
import {
  buildTimeRangeLabel,
  parseTimeRangeFromText,
  pickDealDisplayTitle,
  pickLocalizedText,
} from '../../common/utils/deal-localization.util';
import { buildDealScheduleFields } from '../../common/utils/deal-schedule.util';
import { dealWithinPublicationWindow } from '../../common/utils/deal-publication-window.util';
import { extractFirstPhotoName, haversineKm, parseDiscountPercent } from '../../common/utils/geo.util';
import { FLASH_APPLICABLE_MAX_MINUTES } from '../deals/flash-sale-window.util';
import { PhotoCacheService } from '../../common/photo-cache/photo-cache.service';
import {
  OpeningPeriodDto,
  SpaBreadcrumbItemDto,
  SpaDealDto,
  SpaDetailDto,
  SpaReviewDto,
  SpaServiceItemDto,
} from './dto/spa-detail.dto';

import { parseExternalReviewPayload } from './utils/parse-external-review-payload.util';
import { RecommendedSpaDto } from './dto/recommended-spa.dto';
import { TrackingService } from '../tracking/tracking.service';

// ─── Google Maps jsonb types ──────────────────────────────────────────────────


interface GooglePeriod {
  open: { day: number; hour: number; minute: number };
  close: { day: number; hour: number; minute: number };
}

interface GoogleOpeningHours {
  periods?: GooglePeriod[];
}

interface GoogleReview {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  time?: number; // unix timestamp
  relative_time_description?: string;
  reviewLikeCount?: number;
  review_like_count?: number;
  likeCount?: number;
  like_count?: number;
  photos?: Array<{ photo_url?: string; url?: string }>;
  media?: Array<{ googleMapsUri?: string; uri?: string; url?: string }>;
  languageCode?: string;
  language?: string;
  originalText?: { languageCode?: string; text?: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function padTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function isMidnight(hour: number, minute: number): boolean {
  return hour === 0 && minute === 0;
}

function compareTime(hourA: number, minuteA: number, hourB: number, minuteB: number): number {
  return hourA * 60 + minuteA - (hourB * 60 + minuteB);
}

function isValidGoogleDay(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

function fullWeekOpen24h(): OpeningPeriodDto[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    openTime: '00:00',
    closeTime: '23:59',
  }));
}

export function parseOpeningHours(raw: unknown): OpeningPeriodDto[] {
  if (!raw || typeof raw !== 'object') return [];
  const hours = raw as GoogleOpeningHours;
  const periods = hours.periods ?? [];

  if (
    periods.length === 1 &&
    periods[0]?.open &&
    periods[0].open.day === 0 &&
    isMidnight(periods[0].open.hour, periods[0].open.minute) &&
    (
      // Variant A: explicit close at Sunday 00:00
      (periods[0]?.close &&
        periods[0].close.day === 0 &&
        isMidnight(periods[0].close.hour, periods[0].close.minute)) ||
      // Variant B: Google marks 24/7 with only open boundary.
      !periods[0]?.close
    )
  ) {
    return fullWeekOpen24h();
  }

  const mapped = periods
    .flatMap((p): OpeningPeriodDto[] => {
      if (!p?.open || typeof p.open.day !== 'number') return [];

      const openDay = p.open.day;
      const openHour = p.open.hour;
      const openMinute = p.open.minute;
      if (!isValidGoogleDay(openDay)) return [];

      // Missing close: assume until end of day.
      if (!p.close || typeof p.close.day !== 'number') {
        return [
          {
            day: openDay,
            openTime: padTime(openHour, openMinute),
            closeTime: '23:59',
          },
        ];
      }

      const closeDay = p.close.day;
      const closeHour = p.close.hour;
      const closeMinute = p.close.minute;
      if (!isValidGoogleDay(closeDay)) {
        return [
          {
            day: openDay,
            openTime: padTime(openHour, openMinute),
            closeTime: '23:59',
          },
        ];
      }

      if (openDay === closeDay) {
        // Google often uses 00:00 -> 00:00 for "open 24 hours" in a day slot.
        if (
          isMidnight(openHour, openMinute) &&
          isMidnight(closeHour, closeMinute) &&
          compareTime(openHour, openMinute, closeHour, closeMinute) === 0
        ) {
          return [{ day: openDay, openTime: '00:00', closeTime: '23:59' }];
        }

        return [
          {
            day: openDay,
            openTime: padTime(openHour, openMinute),
            closeTime: padTime(closeHour, closeMinute),
          },
        ];
      }

      // Split cross-day periods into per-day windows for FE.
      const result: OpeningPeriodDto[] = [];
      result.push({
        day: openDay,
        openTime: padTime(openHour, openMinute),
        closeTime: '23:59',
      });

      let day = (openDay + 1) % 7;
      let guard = 0;
      while (day !== closeDay && guard < 7) {
        result.push({ day, openTime: '00:00', closeTime: '23:59' });
        day = (day + 1) % 7;
        guard += 1;
      }

      result.push({
        day: closeDay,
        openTime: '00:00',
        closeTime: padTime(closeHour, closeMinute),
      });

      return result;
    })
    .filter((x) => x.day >= 0 && x.day <= 6);

  return [...mapped].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.openTime.localeCompare(b.openTime);
  });
}

function parseReviewLikeCount(review: GoogleReview): number {
  const candidates = [
    review.reviewLikeCount,
    review.review_like_count,
    review.likeCount,
    review.like_count,
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return Math.floor(value);
    }
  }

  return 0;
}

function parseReviewPhotoUrls(review: GoogleReview): string[] {
  const urls: string[] = [];
  const pushIfValid = (value: unknown) => {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      urls.push(value);
    }
  };

  if (Array.isArray(review.photos)) {
    for (const photo of review.photos) {
      pushIfValid(photo?.photo_url);
      pushIfValid(photo?.url);
      if (urls.length >= 4) break;
    }
  }

  if (urls.length < 4 && Array.isArray(review.media)) {
    for (const media of review.media) {
      pushIfValid(media?.googleMapsUri);
      pushIfValid(media?.uri);
      pushIfValid(media?.url);
      if (urls.length >= 4) break;
    }
  }

  return urls.slice(0, 4);
}

function isFiveStarRating(rating: unknown): boolean {
  return Number(rating) === 5;
}

function parseReviews(raw: unknown, googlePlaceId?: string | null): SpaReviewDto[] {
  if (!Array.isArray(raw)) return [];
  const placeId = googlePlaceId?.trim() || null;
  return (raw as GoogleReview[])
    .filter((review) => isFiveStarRating(review.rating))
    .slice(0, 10)
    .map((r, idx) => ({
      id: idx,
      authorName: r.author_name ?? 'Anonymous',
      authorAvatarUrl: r.profile_photo_url ?? null,
      rating: r.rating ?? 0,
      content: r.text ?? null,
      reviewedAt: r.time ? new Date(r.time * 1000).toISOString() : null,
      photoUrls: parseReviewPhotoUrls(r),
      likeCount: parseReviewLikeCount(r),
      googlePlaceId: placeId,
      languageCode: r.originalText?.languageCode?.toLowerCase() ?? r.languageCode?.toLowerCase() ?? r.language?.toLowerCase() ?? null,
    }));
}

function extractPhotoNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[])
    .map((p) => (typeof p?.name === 'string' ? p.name : null))
    .filter(Boolean) as string[];
}

/**
 * Flash sale = đang active VÀ duration của campaign ≤ FLASH_APPLICABLE_MAX_MINUTES (120 phút).
 * Đồng bộ với logic resolveFlashSaleWindow trong deals.service.ts.
 */
function isFlashSaleActive(startAt: Date | null, endAt: Date | null): boolean {
  if (!startAt || !endAt) return false;
  const now = new Date();
  if (now < startAt || now > endAt) return false;
  const durationMin = (endAt.getTime() - startAt.getTime()) / 60_000;
  return durationMin <= FLASH_APPLICABLE_MAX_MINUTES;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SpasService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly photoCache: PhotoCacheService,
    private readonly tracking: TrackingService,
  ) { }

  /** Không có `spa_galleries` → Places/GCS qua PhotoCache (đồng bộ deal detail). */
  private async resolveSpaDetailPhotosViaCache(
    spaId: string,
    spaAvatar: string | null | undefined,
    spaPhotosJson: unknown,
    googlePlaceId: string | null | undefined,
  ): Promise<string[]> {
    const signedAvatar = await this.photoCache.toDisplayUrl(spaAvatar ?? null);
    const resolved = await this.photoCache.resolvePhotos(spaId, spaPhotosJson, googlePlaceId);

    const photos: string[] = [];
    const seen = new Set<string>();
    const push = (url: string | null | undefined) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      photos.push(url);
    };

    push(signedAvatar);
    for (const url of resolved) push(url);

    return photos;
  }

  private async resolveStoredSpaDetailPhotos(
    spaAvatar: string | null | undefined,
    galleryRows: { imageUrl: string | null }[],
  ): Promise<string[]> {
    const photos: string[] = [];
    const seen = new Set<string>();
    const push = async (raw: string | null | undefined) => {
      const displayUrl = await this.photoCache.toDisplayUrl(raw ?? null);
      if (!displayUrl || seen.has(displayUrl)) return;
      seen.add(displayUrl);
      photos.push(displayUrl);
    };

    await push(spaAvatar);
    for (const row of galleryRows) {
      await push(row.imageUrl);
    }

    return photos;
  }

  async getSpaBySlug(
    slug: string,
    opts: { lat?: number; lng?: number; locale?: 'vi' | 'en' | 'ko' } = {},
  ): Promise<SpaDetailDto> {
    // ── 1. Spa core ────────────────────────────────────────────────────────
    // UUID → id. Còn lại: khớp slug canonical (`spas.slug`) hoặc slug_vi/en/ko (link listing dùng `slug`).
    const normalized = slug.trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized);

    const byAnySlug = eq(schema.spas.slug, normalized);
    /** Đuôi `-13598` trong URL thường là num_id khi slug canonical có hậu tố. */
    const tailNumMatch = normalized.match(/-(\d{4,})$/);
    const tailNum = tailNumMatch ? parseInt(tailNumMatch[1]!, 10) : NaN;
    const byNumId = Number.isFinite(tailNum) && tailNum > 0 ? eq(schema.spas.numId, tailNum) : null;

    const [spa] = await this.db
      .select({
        id: schema.spas.id,
        numId: schema.spas.numId,
        googlePlaceId: schema.spas.googlePlaceId,
        name: schema.spas.name,
        slug: schema.spas.slug,
        address: schema.spas.address,
        phone: schema.spas.phone,
        website: schema.spas.website,
        description: schema.spas.description,
        province: schema.spas.province,
        googleMapsUri: schema.spas.googleMapsUri,
        latitude: schema.spas.latitude,
        longitude: schema.spas.longitude,
        ratingValue: schema.spas.ratingValue,
        reviewCount: schema.spas.reviewCount,
        messagingLinkZalo: schema.spas.messagingLinkZalo,
        messagingLinkWhatsapp: schema.spas.messagingLinkWhatsapp,
        messagingLinkTelegram: schema.spas.messagingLinkTelegram,
        messagingLinkMessenger: schema.spas.messagingLinkMessenger,
        facebookLink: schema.spas.facebookLink,
        instagramLink: schema.spas.instagramLink,
        twitterLink: schema.spas.twitterLink,
        messagingLinkKakaotalk: schema.spas.messagingLinkKakaotalk,
        openingHours: schema.spas.openingHours,
        photos: schema.spas.photos,
        reviews: schema.spas.reviews,
        spaAvatar: schema.spas.spaAvatar,
        amenities: schema.spas.amenities,
        amenitiesEn: schema.spas.amenitiesEn,
        amenitiesKo: schema.spas.amenitiesKo,
        extraAttributes: schema.spas.extraAttributes,
      })
      .from(schema.spas)
      .where(
        isUuid
          ? eq(schema.spas.id, normalized)
          : byNumId
            ? or(byAnySlug, byNumId)
            : byAnySlug,
      )
      .limit(1);

    if (!spa) throw new NotFoundException(`Spa "${slug}" not found`);
    const id = spa.id;

    // ── Wave 1: 5 queries độc lập chạy song song (chỉ cần spa.id) ───────────
    const [locRows, galleryRows, dealRows, externalReviews, serviceItemRows] = await Promise.all([
      // Query 2: primary location
      this.db
        .select({
          addressLine: schema.spaLocations.addressLine,
          lat: schema.spaLocations.lat,
          lng: schema.spaLocations.lng,
          cityName: schema.cities.nameVi,
          cityNameEn: schema.cities.nameEn,
          cityNameKo: schema.cities.nameKo,
          citySlug: schema.cities.slug,
          districtName: schema.districts.nameVi,
          districtNameEn: schema.districts.nameEn,
          districtNameKo: schema.districts.nameKo,
          districtSlug: schema.districts.slug,
        })
        .from(schema.spaLocations)
        .leftJoin(schema.cities, eq(schema.spaLocations.cityId, schema.cities.id))
        .leftJoin(schema.districts, eq(schema.spaLocations.districtId, schema.districts.id))
        .where(
          and(
            eq(schema.spaLocations.spaId, id),
            eq(schema.spaLocations.isPrimary, true),
            eq(schema.spaLocations.isActive, true),
          ),
        )
        .limit(1),

      // Query 3: gallery images
      this.db
        .select({ imageUrl: schema.spaGalleries.imageUrl })
        .from(schema.spaGalleries)
        .where(eq(schema.spaGalleries.spaId, id))
        .orderBy(schema.spaGalleries.sortOrder),

      // Query 4: active deals (+ join cities/services cho display title)
      this.db
        .select({
          id: schema.deals.id,
          categoryId: schema.deals.categoryId,
          slugVi: schema.deals.slugVi,
          slugEn: schema.deals.slugEn,
          slugKo: schema.deals.slugKo,
          titleVi: schema.deals.titleVi,
          titleEn: schema.deals.titleEn,
          titleKo: schema.deals.titleKo,
          shortDescriptionVi: schema.deals.shortDescriptionVi,
          shortDescriptionEn: schema.deals.shortDescriptionEn,
          shortDescriptionKo: schema.deals.shortDescriptionKo,
          discountPercent: schema.deals.discountPercent,
          priorityScore: schema.deals.priorityScore,
          currency: schema.deals.currency,
          startAt: schema.deals.startAt,
          endAt: schema.deals.endAt,
          coverImageUrl: schema.deals.coverImageUrl,
          contentVi: schema.deals.contentVi,
          cityName: schema.cities.nameVi,
          cityNameEn: schema.cities.nameEn,
          cityNameKo: schema.cities.nameKo,
          serviceNameVi: schema.services.nameVi,
          serviceNameEn: schema.services.nameEn,
          serviceNameKo: schema.services.nameKo,
        })
        .from(schema.deals)
        .leftJoin(schema.cities, eq(schema.deals.cityId, schema.cities.id))
        .leftJoin(schema.services, eq(schema.deals.categoryId, schema.services.id))
        .where(
          and(
            eq(schema.deals.spaId, id),
            eq(schema.deals.status, 'active'),
            dealWithinPublicationWindow(),
          ),
        )
        .orderBy(desc(schema.deals.priorityScore)),

      // Query 5: external reviews
      this.db
        .select()
        .from(schema.spaExternalReviews)
        .where(
          and(
            eq(schema.spaExternalReviews.spaId, id),
            or(
              sql`${schema.spaExternalReviews.rating}::numeric = 5`,
              eq(schema.spaExternalReviews.source, 'reddit'),
              eq(schema.spaExternalReviews.source, 'Tripadvisor'),
            ),
          ),
        )
        .orderBy(desc(schema.spaExternalReviews.reviewedAt))
        .limit(10),

      // Query 6: spa_service_items từ OCR bảng giá
      this.db
        .select({
          id: schema.spaServiceItems.id,
          serviceName: schema.spaServiceItems.serviceName,
          originalPrice: schema.spaServiceItems.originalPrice,
          discountPrice: schema.spaServiceItems.discountPrice,
          durationMinutes: schema.spaServiceItems.durationMinutes,
          packageInfo: schema.spaServiceItems.packageInfo,
        })
        .from(schema.spaServiceItems)
        .where(eq(schema.spaServiceItems.spaId, id))
        .orderBy(asc(schema.spaServiceItems.id)),
    ]);


    const spaServices = await this.db
      .select({
        id: schema.services.id,
        code: schema.services.code,
        nameVi: schema.services.nameVi,
        nameEn: schema.services.nameEn,
        nameKo: schema.services.nameKo,
        slugVi: schema.services.slugVi,
        slugEn: schema.services.slugEn,
        slugKo: schema.services.slugKo,
        slugGlobal: schema.services.slugGlobal,
        sortOrder: schema.services.sortOrder,
        categoryId: schema.services.categoryId,
      })
      .from(schema.spaServices)
      .innerJoin(schema.services, eq(schema.services.id, schema.spaServices.serviceId))
      .where(eq(schema.spaServices.spaId, id))
      .orderBy(schema.services.sortOrder, schema.services.nameVi);

    const loc = locRows[0];
    const dealIds = dealRows.map((d) => d.id);

    // Có gallery → URL trực tiếp; không có → PhotoCache (Places/GCS từ spas.photos).
    const photos =
      galleryRows.length === 0
        ? await this.resolveSpaDetailPhotosViaCache(
          id,
          spa.spaAvatar,
          spa.photos,
          spa.googlePlaceId,
        )
        : await this.resolveStoredSpaDetailPhotos(spa.spaAvatar, galleryRows);

    // ── Wave 2: deal variant prices & duration ────────────────────────────────
    const priceCandidates =
      dealIds.length > 0
        ? await this.db
          .select({
            dealId: schema.dealVariants.dealId,
            durationMin: schema.dealVariants.durationMin,
            salePrice: schema.dealVariantPrices.salePrice,
            originalPrice: schema.dealVariantPrices.originalPrice,
          })
          .from(schema.dealVariants)
          .innerJoin(
            schema.dealVariantPrices,
            and(
              eq(schema.dealVariantPrices.variantId, schema.dealVariants.id),
              eq(schema.dealVariantPrices.isActive, true),
            ),
          )
          .where(inArray(schema.dealVariants.dealId, dealIds))
          .orderBy(schema.dealVariants.dealId, asc(schema.dealVariantPrices.salePrice))
        : [];

    // Build priceMap từ kết quả wave 2 (ưu tiên variant có giá sale rẻ nhất làm đại diện)
    const priceMap = new Map<number, { sale: number | null; original: number | null; durationMin: number | null }>();
    for (const pr of priceCandidates) {
      const did = pr.dealId;
      if (did == null) continue;
      if (priceMap.has(did)) continue;
      priceMap.set(did, {
        sale: pr.salePrice ? parseFloat(String(pr.salePrice)) : null,
        original: pr.originalPrice ? parseFloat(String(pr.originalPrice)) : null,
        durationMin: pr.durationMin != null ? Number(pr.durationMin) : null,
      });
    }

    // ── Assemble deals ──────────────────────────────────────────────────────
    const deals: SpaDealDto[] = dealRows
      .sort((a, b) => {
        const priorityA = a.priorityScore && a.priorityScore > 0 ? a.priorityScore : Number.MAX_SAFE_INTEGER;
        const priorityB = b.priorityScore && b.priorityScore > 0 ? b.priorityScore : Number.MAX_SAFE_INTEGER;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return parseDiscountPercent(b.discountPercent) - parseDiscountPercent(a.discountPercent);
      })
      .map((d) => {
        const price = priceMap.get(d.id);
        const localizedDealSlug =
          opts.locale === 'en' ? (d.slugEn ?? canonicalDealSlug(d.slugVi, d.id))
            : opts.locale === 'ko' ? (d.slugKo ?? canonicalDealSlug(d.slugVi, d.id))
              : canonicalDealSlug(d.slugVi, d.id);
        const parsed = parseTimeRangeFromText(d.contentVi ?? null);
        const applicableStartTime = parsed?.startTime ?? null;
        const applicableEndTime = parsed?.endTime ?? null;
        return {
          id: d.id,
          slug: localizedDealSlug,
          canonicalSlug: localizedDealSlug,
          title: pickDealDisplayTitle(
            {
              titleVi: d.titleVi,
              titleEn: d.titleEn,
              titleKo: d.titleKo,
              serviceNameVi: d.serviceNameVi,
              serviceNameEn: d.serviceNameEn,
              serviceNameKo: d.serviceNameKo,
              cityName: d.cityName ?? loc?.cityName ?? null,
              cityNameEn: d.cityNameEn ?? loc?.cityNameEn ?? null,
              cityNameKo: d.cityNameKo ?? loc?.cityNameKo ?? null,
            },
            opts.locale,
          ),
          discountPercent: d.discountPercent ?? null,
          salePrice: price?.sale ?? null,
          originalPrice: price?.original ?? null,
          currency: d.currency ?? 'VND',
          ...buildDealScheduleFields(d.startAt, d.endAt),
          isFlashSale: isFlashSaleActive(d.startAt, d.endAt),
          applicableStartTime,
          applicableEndTime,
          applicableTimeLabel: buildTimeRangeLabel(applicableStartTime, applicableEndTime),
          durationMin: price?.durationMin ?? null,
          shortDescriptionVi: d.shortDescriptionVi ?? null,
          shortDescriptionEn: d.shortDescriptionEn ?? null,
          shortDescriptionKo: d.shortDescriptionKo ?? null,
          categoryId: d.categoryId != null ? Number(d.categoryId) : null,
        };
      });

    // ── Assemble reviews ────────────────────────────────────────────────────
    // Priority: spa_external_reviews table → spas.reviews jsonb
    const spaGooglePlaceId = spa.googlePlaceId?.trim() || null;
    const reviews: SpaReviewDto[] =
      externalReviews.length > 0
        ? externalReviews.map((r) => {
          const extras = parseExternalReviewPayload(r.rawPayload ?? null);
          return {
            id: r.id,
            authorName: r.authorName ?? 'Anonymous',
            authorAvatarUrl: r.authorAvatarUrl ?? null,
            rating: r.rating ? parseFloat(String(r.rating)) : 0,
            content: r.content ?? null,
            reviewedAt: r.reviewedAt?.toISOString() ?? null,
            photoUrls: extras.photoUrls,
            likeCount: extras.likeCount,
            ownerReply: extras.ownerReply,
            googleMapsUri: extras.googleMapsUri ?? null,
            googlePlaceId: extras.googlePlaceId ?? spaGooglePlaceId,
            languageCode: extras.languageCode ?? null,
            source: r.source,
            postUrl: extras.url ?? null,
          };
        })
        : parseReviews(spa.reviews, spaGooglePlaceId);

    // ── 6. Breadcrumbs (tên spa / link provider: slug + name gốc) ─────────────
    const locationCityLabel =
      loc?.cityName != null && String(loc.cityName).trim()
        ? pickLocalizedText({ vi: loc.cityName, en: loc.cityNameEn, ko: loc.cityNameKo }, opts.locale) ||
        loc.cityName
        : null;
    const locationDistrictLabel =
      loc?.districtName != null && String(loc.districtName).trim()
        ? pickLocalizedText(
          { vi: loc.districtName, en: loc.districtNameEn, ko: loc.districtNameKo },
          opts.locale,
        ) || loc.districtName
        : null;
    const spaSlugOut = spa.slug ?? spa.id;
    const spaNameOut = spa.name ?? '';
    let localizedSpaDescription = spa.description || null;

    if (!localizedSpaDescription || !localizedSpaDescription.trim()) {
      const locStr = [locationDistrictLabel, locationCityLabel].filter(Boolean).join(', ');
      const spaName = spaNameOut || spa.name || 'Spa';
      if (opts.locale === 'ko') {
        localizedSpaDescription = `${spaName} - ${locStr ? locStr + ' ' : ''}최고의 스파 및 마사지 샵 추천. 실제 고객 리뷰를 확인하고, Glow Explore에서 특별한 혜택으로 간편하게 예약하세요!`;
      } else if (opts.locale === 'en') {
        localizedSpaDescription = `Discover premium spa and massage treatments at ${spaName}${locStr ? ' in ' + locStr : ''}. Read reviews, explore exclusive deals, and book online easily on Glow Explore!`;
      } else {
        localizedSpaDescription = `Khám phá dịch vụ massage, làm đẹp chất lượng tại ${spaName}${locStr ? ' (' + locStr + ')' : ''}. Xem review, khám phá các ưu đãi hấp dẫn và đặt lịch hẹn trực tuyến nhanh chóng trên Glow Explore!`;
      }
    };

    const localePrefix = opts.locale ?? 'vi';

    const breadcrumbs: SpaBreadcrumbItemDto[] = [{ label: 'Trang chủ', url: `/${localePrefix}` }];
    if (loc?.citySlug && locationCityLabel) {
      breadcrumbs.push({ label: locationCityLabel, url: `/${localePrefix}/${loc.citySlug}` });
    }
    if (loc?.citySlug && loc.districtSlug && locationDistrictLabel) {
      breadcrumbs.push({
        label: locationDistrictLabel,
        url: `/${localePrefix}/${loc.citySlug}/${loc.districtSlug}`,
      });
    }
    breadcrumbs.push({ label: spaNameOut || spaSlugOut, url: `/${localePrefix}/provider/${spaSlugOut}` });

    // ── 7. Distance ────────────────────────────────────────────────────────
    const spaLat = loc?.lat ? parseFloat(String(loc.lat)) : (spa.latitude ? parseFloat(String(spa.latitude)) : null);
    const spaLng = loc?.lng ? parseFloat(String(loc.lng)) : (spa.longitude ? parseFloat(String(spa.longitude)) : null);
    const hasGeo =
      typeof opts.lat === 'number' &&
      Number.isFinite(opts.lat) &&
      typeof opts.lng === 'number' &&
      Number.isFinite(opts.lng);
    const distanceKm =
      hasGeo && spaLat !== null && spaLng !== null
        ? Math.round(haversineKm(opts.lat!, opts.lng!, spaLat, spaLng) * 10) / 10
        : null;

    // ── 8. Assemble ────────────────────────────────────────────────────────
    return {
      id: spa.id,
      slug: spaSlugOut,
      localizedSlugs: {
        vi: spaSlugOut,
        en: spaSlugOut,
        ko: spaSlugOut,
      },
      name: spaNameOut,
      spaAvatarUrl: spa.spaAvatar ?? null,
      description: localizedSpaDescription,
      address: spa.address ?? null,
      ratingValue: spa.ratingValue ? parseFloat(String(spa.ratingValue)) : 0,
      reviewCount: spa.reviewCount ?? 0,
      googleMapsUri: spa.googleMapsUri ?? null,
      googlePlaceId: spaGooglePlaceId,
      amenities: spa.amenities ?? null,
      amenities_en: spa.amenitiesEn ?? null,
      amenities_ko: spa.amenitiesKo ?? null,
      location: {
        addressLine: loc?.addressLine ?? spa.address ?? null,
        cityName: locationCityLabel ?? spa.province ?? null,
        districtName: locationDistrictLabel ?? null,
        lat: spaLat,
        lng: spaLng,
      },
      contact: {
        phone: spa.phone ?? null,
        zalo: spa.messagingLinkZalo ?? null,
        facebook: spa.facebookLink ?? null,
        instagram: spa.instagramLink ?? null,
        messenger: spa.messagingLinkMessenger ?? null,
        telegram: spa.messagingLinkTelegram ?? null,
        whatsapp: spa.messagingLinkWhatsapp ?? null,
        kakaotalk: spa.messagingLinkKakaotalk ?? null,
      },
      openingHours: parseOpeningHours(spa.openingHours),
      deals,
      serviceItems: serviceItemRows.map((item) => ({
        id: item.id,
        serviceName: item.serviceName,
        originalPrice: item.originalPrice ? parseFloat(String(item.originalPrice)) : null,
        discountPrice: item.discountPrice ? parseFloat(String(item.discountPrice)) : null,
        durationMinutes: item.durationMinutes ?? null,
        packageInfo: item.packageInfo ?? null,
      })),
      services: spaServices.map((service) => ({
        id: service.id,
        code: service.code ?? '',
        nameVi: service.nameVi ?? '',
        nameEn: service.nameEn ?? null,
        nameKo: service.nameKo ?? null,
        slugVi: service.slugVi ?? null,
        slugEn: service.slugEn ?? null,
        slugKo: service.slugKo ?? null,
        slugGlobal: service.slugGlobal ?? '',
        sortOrder: service.sortOrder ?? 0,
        categoryId: service.categoryId ?? null,
        targetUrl: null,
      })),
      reviews,
      photos,
      breadcrumbs,
      distanceKm,
    };
  }

  async getRecommendedSpas(opts: {
    lat?: number;
    lng?: number;
    limit?: number;
    radiusKm?: number;
    locale?: 'vi' | 'en' | 'ko';
  }): Promise<RecommendedSpaDto[]> {
    const limit = Math.min(opts.limit ?? 10, 50);
    const hasGeo =
      typeof opts.lat === 'number' &&
      Number.isFinite(opts.lat) &&
      typeof opts.lng === 'number' &&
      Number.isFinite(opts.lng);

    /**
     * Không lat/lng: sao cao → thấp (tie-break: review nhiều hơn).
     * Có lat/lng: lấy spa có tọa độ trong bbox quanh user (bán kính lớn để phủ VN), sort gần → xa.
     */
    const roughRadiusKm = Math.min(Math.max(opts.radiusKm ?? 1200, 100), 3000);
    const DEG_PER_KM = 1 / 111;
    const latDelta = hasGeo ? roughRadiusKm * DEG_PER_KM : 0;
    const lngDelta =
      hasGeo && opts.lat != null ? roughRadiusKm * DEG_PER_KM / Math.cos((opts.lat * Math.PI) / 180) : 0;

    const poolLimit = hasGeo ? 400 : limit;

    const rows = await this.db
      .select({
        id: schema.spas.id,
        slug: schema.spas.slug,
        googlePlaceId: schema.spas.googlePlaceId,
        name: schema.spas.name,
        ratingValue: schema.spas.ratingValue,
        reviewCount: schema.spas.reviewCount,
        photos: schema.spas.photos,
        spaAvatar: schema.spas.spaAvatar,
        latitude: schema.spas.latitude,
        longitude: schema.spas.longitude,
        locLatitude: schema.spaLocations.lat,
        locLongitude: schema.spaLocations.lng,
        cityNameVi: schema.cities.nameVi,
        cityNameEn: schema.cities.nameEn,
        cityNameKo: schema.cities.nameKo,
        activeDealCount: count(schema.deals.id),
        openingHours: schema.spas.openingHours,
      })
      .from(schema.spas)
      .leftJoin(
        schema.spaLocations,
        and(eq(schema.spaLocations.spaId, schema.spas.id), eq(schema.spaLocations.isPrimary, true)),
      )
      .leftJoin(schema.cities, eq(schema.cities.id, schema.spaLocations.cityId))
      .innerJoin(
        schema.deals,
        and(
          eq(schema.deals.spaId, schema.spas.id),
          eq(schema.deals.status, 'active'),
          dealWithinPublicationWindow(),
        ),
      )
      .where(
        hasGeo
          ? and(
            sql`COALESCE(${schema.spaLocations.lat}, ${schema.spas.latitude}) IS NOT NULL`,
            sql`COALESCE(${schema.spaLocations.lng}, ${schema.spas.longitude}) IS NOT NULL`,
            sql`COALESCE(${schema.spaLocations.lat}, ${schema.spas.latitude})::numeric BETWEEN ${opts.lat! - latDelta} AND ${opts.lat! + latDelta}`,
            sql`COALESCE(${schema.spaLocations.lng}, ${schema.spas.longitude})::numeric BETWEEN ${opts.lng! - lngDelta} AND ${opts.lng! + lngDelta}`,
          )
          : undefined,
      )
      .groupBy(schema.spas.id, schema.cities.id, schema.spaLocations.lat, schema.spaLocations.lng)
      .orderBy(desc(schema.spas.ratingValue), desc(schema.spas.reviewCount))
      .limit(poolLimit);

    const userLat = hasGeo ? opts.lat! : undefined;
    const userLng = hasGeo ? opts.lng! : undefined;

    const items = await Promise.all(rows.map(async (r) => {
      const lat = r.locLatitude != null ? parseFloat(String(r.locLatitude)) : (r.latitude != null ? parseFloat(String(r.latitude)) : null);
      const lng = r.locLongitude != null ? parseFloat(String(r.locLongitude)) : (r.longitude != null ? parseFloat(String(r.longitude)) : null);
      const distanceKm =
        userLat != null && userLng != null && lat != null && lng != null
          ? Math.round(haversineKm(userLat, userLng, lat, lng) * 10) / 10
          : null;
      const signedAvatar = await this.photoCache.toDisplayUrl(r.spaAvatar ?? null);
      let fallbackPhotoUrl: string | null = null;
      if (!signedAvatar) {
        const [gallery] = await this.db
          .select({ imageUrl: schema.spaGalleries.imageUrl })
          .from(schema.spaGalleries)
          .where(eq(schema.spaGalleries.spaId, r.id))
          .orderBy(schema.spaGalleries.sortOrder, schema.spaGalleries.id)
          .limit(1);
        fallbackPhotoUrl = gallery?.imageUrl
          ? await this.photoCache.toDisplayUrl(String(gallery.imageUrl))
          : await this.photoCache.resolvePrimaryPhotoUrl(r.id, r.photos, r.googlePlaceId);
      }

      const canonicalSlug = r.slug ?? '';
      const canonicalName = r.name ?? '';

      const cityName =
        pickLocalizedText(
          { vi: r.cityNameVi ?? null, en: r.cityNameEn ?? null, ko: r.cityNameKo ?? null },
          opts.locale,
        ) || r.cityNameVi || null;

      return {
        id: r.id,
        slug: canonicalSlug,
        name: canonicalName,
        ratingValue: r.ratingValue ? parseFloat(String(r.ratingValue)) : 0,
        reviewCount: r.reviewCount ?? 0,
        photoName: extractFirstPhotoName(r.photos),
        spaAvatarUrl: signedAvatar ?? fallbackPhotoUrl,
        cityName,
        activeDealCount: Number(r.activeDealCount),
        distanceKm,
        openingHoursRaw: r.openingHours,
      };
    }));

    let slicedItems = items;
    if (hasGeo) {
      slicedItems = items
        .filter((s) => s.distanceKm !== null)
        .sort((a, b) => {
          // Ưu tiên gần người dùng nhất; nếu bằng nhau, ưu tiên spa chất lượng tốt hơn.
          const d = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
          if (d !== 0) return d;
          if (b.ratingValue !== a.ratingValue) return b.ratingValue - a.ratingValue;
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, limit);
    } else {
      slicedItems = [...items]
        .sort((a, b) => {
          if (b.ratingValue !== a.ratingValue) return b.ratingValue - a.ratingValue;
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, limit);
    }

    if (slicedItems.length === 0) return [];

    const spaIds = slicedItems.map((s) => s.id);
    const engagementEntries = slicedItems.map((s) => ({ spaId: s.id, slug: s.slug }));

    const [viewMap, activeDeals] = await Promise.all([
      this.tracking.batchSpaDisplayEngagement(engagementEntries),
      this.db
        .select({
          id: schema.deals.id,
          slugVi: schema.deals.slugVi,
          slugEn: schema.deals.slugEn,
          slugKo: schema.deals.slugKo,
          titleVi: schema.deals.titleVi,
          titleEn: schema.deals.titleEn,
          titleKo: schema.deals.titleKo,
          discountPercent: schema.deals.discountPercent,
          currency: schema.deals.currency,
          spaId: schema.deals.spaId,
          salePrice: sql<string>`(
            SELECT dvp.sale_price::text
            FROM deal_variants dv
            JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
            WHERE dv.deal_id = deals.id
            ORDER BY dvp.sale_price ASC NULLS LAST
            LIMIT 1
          )`,
          originalPrice: sql<string>`(
            SELECT dvp.original_price::text
            FROM deal_variants dv
            JOIN deal_variant_prices dvp ON dvp.variant_id = dv.id AND dvp.is_active = true
            WHERE dv.deal_id = deals.id
            ORDER BY dvp.sale_price ASC NULLS LAST
            LIMIT 1
          )`,

        })
        .from(schema.deals)
        .where(
          and(
            inArray(schema.deals.spaId, spaIds),
            eq(schema.deals.status, 'active'),
            dealWithinPublicationWindow(),
          ),
        ),
    ]);

    const dealsBySpa = new Map<string, typeof activeDeals>();
    for (const d of activeDeals) {
      if (!d.spaId) continue;
      if (!dealsBySpa.has(d.spaId)) dealsBySpa.set(d.spaId, []);
      dealsBySpa.get(d.spaId)!.push(d);
    }

    return slicedItems
      .map((item) => {
        const vc = viewMap.get(item.slug) ?? 0;
        const parsedOpening = parseOpeningHours(item.openingHoursRaw);
        const spaDeals = dealsBySpa.get(item.id) ?? [];
        let bestDeal: RecommendedSpaDto['bestDeal'] = null;

        if (spaDeals.length > 0) {
          spaDeals.sort((a, b) => parseDiscountPercent(b.discountPercent) - parseDiscountPercent(a.discountPercent));
          const topDeal = spaDeals[0]!;
          const title = pickDealDisplayTitle({ titleVi: topDeal.titleVi, titleEn: topDeal.titleEn, titleKo: topDeal.titleKo }, opts.locale) || topDeal.titleVi || '';
          const slug = pickLocalizedText({ vi: topDeal.slugVi, en: topDeal.slugEn, ko: topDeal.slugKo }, opts.locale) || topDeal.slugVi || String(topDeal.id);
          const salePrice = topDeal.salePrice ? parseFloat(topDeal.salePrice) : null;
          const originalPrice = topDeal.originalPrice ? parseFloat(topDeal.originalPrice) : null;
          bestDeal = {
            id: topDeal.id,
            title,
            slug,
            canonicalSlug: canonicalDealSlug(slug, topDeal.id),
            salePrice: (salePrice != null && !isNaN(salePrice) && salePrice > 0) ? salePrice : null,
            originalPrice: (originalPrice != null && !isNaN(originalPrice) && originalPrice > 0) ? originalPrice : null,
            discountPercent: topDeal.discountPercent ?? null,
            currency: topDeal.currency || 'VND',
          };
        }

        const { openingHoursRaw, ...rest } = item;
        return {
          ...rest,
          viewCount: vc > 0 ? vc : null,
          openingHours: parsedOpening.length > 0 ? parsedOpening : null,
          bestDeal,
        };
      })
      .filter((s) => s.bestDeal != null);
  }
}
