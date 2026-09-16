/**
 * Derive UI fields from `spa_external_reviews.raw_payload` (Google Places / other JSON).
 */

export interface ParsedExternalReviewExtras {
  photoUrls: string[];
  ownerReply: { content: string; repliedAt: string | null } | null;
  googleMapsUri: string | null;
  likeCount: number;
  googlePlaceId: string | null;
  languageCode: string | null;
  url?: string | null;
}

/** `places/{placeId}/reviews/{reviewId}` hoặc `places/{placeId}` (Places API resource name). */
export function extractGooglePlaceIdFromResourceName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^places\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function localizedText(value: unknown): string | null {
  const o = asRecord(value);
  if (!o) return null;
  const t = o['text'];
  return typeof t === 'string' ? t : null;
}

function extractOwnerReply(parsed: unknown): ParsedExternalReviewExtras['ownerReply'] {
  const root = asRecord(parsed);
  if (!root) return null;
  const rr = asRecord(root['reviewReply'] ?? root['review_reply']);
  if (!rr) return null;

  const content =
    localizedText(rr['text']) ??
    (typeof rr['text'] === 'string' ? rr['text'] : null) ??
    (typeof rr['comment'] === 'string' ? rr['comment'] : null);

  if (!content) return null;

  const rawTime =
    (typeof rr['updateTime'] === 'string' && rr['updateTime']) ||
    (typeof rr['publishTime'] === 'string' && rr['publishTime']) ||
    null;

  let repliedAt: string | null = null;
  if (rawTime) {
    const d = new Date(rawTime);
    repliedAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  return { content, repliedAt };
}

function extractPhotoUrls(parsed: unknown): string[] {
  const root = asRecord(parsed);
  if (!root) return [];

  const media = root['media'];
  if (!Array.isArray(media)) return [];

  const urls: string[] = [];
  for (const item of media) {
    const m = asRecord(item);
    if (!m) continue;
    const url =
      (typeof m['googleMapsUri'] === 'string' && m['googleMapsUri']) ||
      (typeof m['uri'] === 'string' && m['uri']) ||
      (typeof m['url'] === 'string' && m['url']) ||
      null;
    if (url && /^https?:\/\//i.test(url)) {
      urls.push(url);
    }
    if (urls.length >= 4) break;
  }
  return urls;
}

function extractLikeCount(parsed: unknown): number {
  const root = asRecord(parsed);
  if (!root) return 0;

  const candidates = [
    root['reviewLikeCount'],
    root['review_like_count'],
    root['likeCount'],
    root['like_count'],
  ];

  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue) && parsedValue >= 0) {
        return Math.floor(parsedValue);
      }
    }
  }

  return 0;
}

function extractLanguageCode(parsed: unknown): string | null {
  const root = asRecord(parsed);
  if (!root) return null;

  // 1. Ưu tiên originalText.languageCode (ngôn ngữ gốc do tác giả viết)
  const orig = asRecord(root['originalText'] ?? root['original_text']);
  if (orig) {
    const code =
      (typeof orig['languageCode'] === 'string' && orig['languageCode']) ||
      (typeof orig['language_code'] === 'string' && orig['language_code']) ||
      null;
    if (code && code.trim()) return code.trim().toLowerCase();
  }

  // 2. Fallback: text.languageCode
  const textObj = asRecord(root['text']);
  if (textObj) {
    const code =
      (typeof textObj['languageCode'] === 'string' && textObj['languageCode']) ||
      (typeof textObj['language_code'] === 'string' && textObj['language_code']) ||
      null;
    if (code && code.trim()) return code.trim().toLowerCase();
  }

  // 3. Root-level languageCode / language nếu có
  const rootCode =
    (typeof root['languageCode'] === 'string' && root['languageCode']) ||
    (typeof root['language_code'] === 'string' && root['language_code']) ||
    (typeof root['language'] === 'string' && root['language']) ||
    null;
  if (rootCode && rootCode.trim()) return rootCode.trim().toLowerCase();

  return null;
}

const EMPTY_EXTRAS: ParsedExternalReviewExtras = {
  photoUrls: [],
  ownerReply: null,
  likeCount: 0,
  googleMapsUri: null,
  googlePlaceId: null,
  languageCode: null,
  url: null,
};

export function parseExternalReviewPayload(raw: string | null | undefined): ParsedExternalReviewExtras {
  if (!raw || typeof raw !== 'string') {
    return EMPTY_EXTRAS;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return EMPTY_EXTRAS;
  }

  const root = asRecord(parsed);
  const rawUri = root ? root['googleMapsUri'] : null;
  const googleMapsUri =
    typeof rawUri === 'string' && /^https?:\/\//i.test(rawUri) ? rawUri : null;
  const googlePlaceId = root ? extractGooglePlaceIdFromResourceName(root['name']) : null;

  return {
    photoUrls: extractPhotoUrls(parsed),
    ownerReply: extractOwnerReply(parsed),
    likeCount: extractLikeCount(parsed),
    googleMapsUri,
    googlePlaceId,
    languageCode: extractLanguageCode(parsed),
    url: typeof root?.['url'] === 'string' ? root['url'] : null,
  };
}
