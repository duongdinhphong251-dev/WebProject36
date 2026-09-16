import type { DealCardDto } from "@/types/api";

// ─── Deal Detail DTO ──────────────────────────────────────────────────────────

export interface DealDetailDto {
  id: number;
  slug: string;
  /** Slug chuẩn cho URL path (BE); redirect nếu path khác */
  canonicalSlug?: string;
  /** Slug theo từng locale — dùng cho LocalizedSlugSync / hreflang */
  localizedSlugs?: Record<string, string> | null;
  /** Title đã pick theo locale từ BE */
  title: string;
  /** Short description đã pick theo locale từ BE */
  shortDescription?: string | null;
  /** Full content đã pick theo locale từ BE */
  content?: string | null;
  coverImageUrl: string | null;
  photos?: string[];
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  currency: string;
  startAt: string;
  endAt: string;
  isFlashSale: boolean;
  /** Đã hết slot đặt chỗ (BE gửi) */
  isSoldOut?: boolean;
  /** Deal hết hạn (BE gửi); FE fallback: endAt < now */
  isExpired?: boolean;
  /** ISO — kết thúc khung flash (slot / window), khác endAt campaign khi có */
  flashSaleEndsAt?: string | null;
  /** Khoảng giờ trong ngày từ BE (VD 09:00-11:00) */
  applicableTimeLabel?: string | null;
  applicableStartTime?: string | null;
  applicableEndTime?: string | null;
  serviceSlug?: string | null;
  breadcrumbs?: { label: string; url: string }[];
  /** Từ BE tracking (view + click deal) */
  viewCount?: number;
  spa: DealSpaBasicDto;
  variants: DealVariantDto[];
  media: DealMediaDto[];
  /** Danh sách deal khác tại cùng spa */
  otherDealsAtSpa?: DealCardDto[];
}

export interface DealSpaBasicDto {
  id: string;
  slug: string;
  name: string;
  ratingValue: number;
  reviewCount: number;
  cityName?: string | null;
  distanceKm?: number | null;
  photoName?: string | null;
  /** Latitude — returned by backend when available */
  lat?: number | null;
  /** Longitude — returned by backend when available */
  lng?: number | null;
  /** Direct avatar/logo URL */
  spaAvatarUrl?: string | null;

  // ── Enriched fields (from BE deal detail endpoint) ──────────────────────
  /** District name (locale-aware) */
  districtName?: string | null;
  /** Street address */
  address?: string | null;
  /** Description / Intro of spa */
  description?: string | null;
  /** Contact info — phone, Zalo, Facebook, Telegram, report */
  contact?: SpaContactDto | null;
  /** Top 5 gallery photo URLs (signed) */
  photos?: string[];
  /** Top 5 reviews for JSON-LD schema */
  reviews?: DealSpaReviewDto[];
}

/** Lightweight review DTO embedded in deal.spa — subset of SpaReviewDto */
export interface DealSpaReviewDto {
  id: string | number;
  authorName: string;
  ratingValue?: number | null;
  /** BE field name is `rating`, FE normalizes to `ratingValue` */
  rating?: number | null;
  content?: string | null;
  createdAt?: string | null;
  /** BE field name is `reviewedAt` */
  reviewedAt?: string | null;
  source?: string | null;
  postUrl?: string | null;
}

export interface DealVariantDto {
  id: number;
  name: string;
  nameVi?: string | null;
  nameEn?: string | null;
  nameKo?: string | null;
  description: string | null;
  durationMin?: number | null;
  pax?: number | null;
  prices: DealVariantPriceDto[];
}

export interface DealVariantPriceDto {
  currency: string;
  originalPrice: number;
  salePrice: number;
}

export interface DealMediaDto {
  id: number;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  sortOrder: number;
}

// ─── Spa Detail DTO ───────────────────────────────────────────────────────────

export interface SpaDetailDto {
  id: string;
  name: string;
  slug: string;
  ratingValue: number;
  reviewCount: number;
  address: string;
  cityName: string;
  districtName?: string | null;
  distanceKm: number | null;
  logoUrl: string | null;
  googleMapsUri: string | null;
  /** Google Maps deep links từ Places API */
  googleMapsLinks?: {
    placeUri?: string | null;
    directionsUri?: string | null;
    writeAReviewUri?: string | null;
    /** Mở tab đánh giá — dùng cho nút Thích / Like */
    reviewsUri?: string | null;
    photosUri?: string | null;
  } | null;
  /** Gallery photo URLs — may not be returned by all endpoints */
  photos?: string[];
  openingHours: SpaOpeningHourDto[];
  reviews: SpaReviewDto[];
  contact: SpaContactDto;
  ratingBreakdown: SpaRatingBreakdownDto;
}

export interface SpaOpeningHourDto {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  openTime: string;   // "09:00"
  closeTime: string;  // "21:00"
  isClosed: boolean;
}

export interface SpaReviewDto {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  ratingValue: number;
  content: string;
  createdAt: string;
  photos: SpaReviewPhotoDto[];
  ownerResponse: SpaOwnerResponseDto | null;
  /** Direct link tới review trên Google Maps */
  googleMapsUri?: string | null;
  /** Nguồn review (ví dụ: reddit) */
  source?: string | null;
  /** Link bài viết gốc (vd Reddit) */
  postUrl?: string | null;
}

export interface SpaReviewPhotoDto {
  id: string;
  url: string;
}

export interface SpaOwnerResponseDto {
  content: string;
  createdAt: string;
}

export interface SpaContactDto {
  phone: string | null;
  zaloUrl: string | null;
  facebookUrl: string | null;
  telegramUrl: string | null;
  reportUrl: string | null;
  whatsappUrl?: string | null;
  whatsapp?: string | null;
}

export interface SpaRatingBreakdownDto {
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
}
