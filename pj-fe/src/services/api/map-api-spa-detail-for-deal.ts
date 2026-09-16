import type { SpaDetailDto as ApiSpaDetailDto, SpaReviewDto as ApiSpaReviewDto } from '@/types/api';
import type {
  SpaContactDto,
  SpaDetailDto,
  SpaOpeningHourDto,
  SpaRatingBreakdownDto,
  SpaReviewDto,
} from '@/types/deal-detail';

const DAY_OF_WEEK: SpaOpeningHourDto['dayOfWeek'][] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function mapOpeningHour(api: { day: number; openTime: string; closeTime: string }): SpaOpeningHourDto {
  const dayOfWeek = DAY_OF_WEEK[api.day] ?? 'monday';
  return {
    dayOfWeek,
    openTime: api.openTime,
    closeTime: api.closeTime,
    isClosed: false,
  };
}

function buildRatingBreakdownFromReviews(reviews: ApiSpaReviewDto[]): SpaRatingBreakdownDto {
  const b: SpaRatingBreakdownDto = {
    star5: 0,
    star4: 0,
    star3: 0,
    star2: 0,
    star1: 0,
  };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
    if (!Number.isFinite(star)) continue;
    if (star === 5) b.star5 += 1;
    else if (star === 4) b.star4 += 1;
    else if (star === 3) b.star3 += 1;
    else if (star === 2) b.star2 += 1;
    else b.star1 += 1;
  }
  return b;
}

function parseIsoSafe(value: string | null | undefined): string | null {
  if (value == null || String(value).trim() === '') return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function mapApiReviewToDealReview(r: ApiSpaReviewDto): SpaReviewDto {
  const rawRating = Number(r.rating);
  const ratingValue = Number.isFinite(rawRating)
    ? Math.min(5, Math.max(0, Math.round(rawRating)))
    : 0;

  const createdAt = parseIsoSafe(r.reviewedAt ?? null) ?? new Date().toISOString();

  const photoUrls = Array.isArray(r.photoUrls) ? r.photoUrls : [];
  const photos = photoUrls
    .filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url))
    .map((url, idx) => ({ id: `p-${String(r.id)}-${idx}`, url }));

  const ownerReply = r.ownerReply;
  const ownerResponse =
    ownerReply?.content != null && String(ownerReply.content).trim() !== ''
      ? {
          content: ownerReply.content,
          createdAt:
            parseIsoSafe(ownerReply.repliedAt ?? null) ?? createdAt,
        }
      : null;

  return {
    id: String(r.id),
    authorName: r.authorName ?? '',
    authorAvatarUrl: r.authorAvatarUrl ?? null,
    ratingValue,
    content: r.content?.trim() ?? '',
    createdAt,
    photos,
    ownerResponse,
    source: r.source ?? null,
    postUrl: r.postUrl ?? null,
  };
}

function mapContact(api: ApiSpaDetailDto['contact']): SpaContactDto {
  return {
    phone: api.phone ?? null,
    zaloUrl: api.zalo ?? null,
    facebookUrl: api.facebook ?? null,
    telegramUrl: api.telegram ?? null,
    reportUrl: null,
  };
}

/**
 * GET /api/v1/spas/:id trả {@link ApiSpaDetailDto}; trang deal cần {@link SpaDetailDto} (deal-detail).
 */
export function mapApiSpaDetailForDeal(api: ApiSpaDetailDto): SpaDetailDto {
  const raw = api as ApiSpaDetailDto & { spaAvatarUrl?: string | null };
  const reviews = (api.reviews ?? []).map(mapApiReviewToDealReview);
  const ratingBreakdown = buildRatingBreakdownFromReviews(api.reviews ?? []);

  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    ratingValue: api.ratingValue,
    reviewCount: api.reviewCount,
    address: api.address ?? api.location?.addressLine ?? '',
    cityName: api.location?.cityName ?? '',
    distanceKm: null,
    logoUrl: raw.spaAvatarUrl ?? api.photos?.[0] ?? null,
    googleMapsUri: api.googleMapsUri ?? null,
    googleMapsLinks: api.googleMapsLinks
      ? {
          placeUri: api.googleMapsLinks.placeUri ?? null,
          directionsUri: api.googleMapsLinks.directionsUri ?? null,
          writeAReviewUri: api.googleMapsLinks.writeAReviewUri ?? null,
          reviewsUri:
            api.googleMapsLinks.reviewsUri ??
            api.googleMapsReviewsUri ??
            null,
          photosUri: api.googleMapsLinks.photosUri ?? null,
        }
      : api.googleMapsReviewsUri
        ? {
            reviewsUri: api.googleMapsReviewsUri,
          }
        : null,
    openingHours: (api.openingHours ?? []).map(mapOpeningHour),
    reviews,
    contact: mapContact(api.contact),
    ratingBreakdown,
  };
}
