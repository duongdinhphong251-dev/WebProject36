/**
 * Types generated from swagger.json (openapi 3.0.0)
 * Deals API — API cho trang săn deals spa & làm đẹp
 */

// ─── Locations ──────────────────────────────────────────────────────────────

export interface CityResponseDto {
  id: number;
  slug: string;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  priority: number;
  /** SEO URL pattern trả về từ BE, ví dụ: 'massage-tai-ha-noi' */
  targetUrl?: string;
}

export interface DistrictResponseDto {
  id: number;
  slug: string;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  cityId: number;
  /** SEO URL pattern trả về từ BE, ví dụ: 'massage-tai-cau-giay-ha-noi' */
  targetUrl?: string;
}

export interface WardResponseDto {
  id: number;
  slug: string;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  districtId: number;
  cityId: number;
}

export interface PlaceResponseDto {
  id: number;
  slug: string;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  cityId?: number | null;
  districtId?: number | null;
  wardId?: number | null;
  /** WGS84 — BE có thể trả khi cần geo (vd. hub place) */
  lat?: number | null;
  lng?: number | null;
}

// ─── Services ────────────────────────────────────────────────────────────────

export interface ServiceResponseDto {
  id: number;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  slugVi?: string | null;
  slugEn?: string | null;
  slugKo?: string | null;
  slugGlobal: string;
  sortOrder: number;
  categoryId?: number | null;
  /** SEO URL pattern trả về từ BE, ví dụ: 'massage-tai-ha-noi' */
  targetUrl?: string;
}

// ─── Spa ─────────────────────────────────────────────────────────────────────

export interface SpaBasicDto {
  id: string;
  slug: string;
  name: string;
  ratingValue: number;
  reviewCount: number;
  cityName?: string | null;
  distanceKm?: number | null;
  /** Vĩ độ spa */
  lat?: number | null;
  /** Kinh độ spa */
  lng?: number | null;
  photoName?: string | null;
  /** Ảnh đại diện spa (URL trực tiếp, ví dụ GCS) */
  spaAvatarUrl?: string | null;
  /** Tổng lượt xem (view + click) từ tracking, BE trả về khi available */
  viewCount?: number | null;
  /** Giờ mở cửa từ DB */
  openingHours?: OpeningPeriodDto[] | null;
}

export interface SpaLocationDto {
  addressLine?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface SpaContactDto {
  phone?: string | null;
  zalo?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  messenger?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  kakaotalk?: string | null;
}

export interface OpeningPeriodDto {
  /** 0=Sun, 1=Mon, ..., 6=Sat */
  day: number;
  openTime: string; // e.g. "09:00"
  closeTime: string; // e.g. "22:00"
}

export interface SpaDealDto {
  id: number;
  slug: string;
  /** Slug chuẩn cho URL (không `#`); ưu tiên khi build link */
  canonicalSlug?: string;
  title: string;
  discountPercent?: number | null;
  salePrice?: number | null;
  originalPrice?: number | null;
  currency: string;
  startAt?: string | null;
  endAt?: string | null;
  isFlashSale: boolean;
  /** Giờ áp dụng bắt đầu trong ngày, VD: "10:00" */
  applicableStartTime?: string | null;
  /** Giờ áp dụng kết thúc trong ngày, VD: "15:00" */
  applicableEndTime?: string | null;
  /** Khoảng giờ áp dụng dạng HH:mm-HH:mm, VD: "10:00-15:00" */
  applicableTimeLabel?: string | null;
  durationMin?: number | null;
  shortDescriptionVi?: string | null;
  shortDescriptionEn?: string | null;
  shortDescriptionKo?: string | null;
  categoryId?: number | null;
}

export interface SpaReviewOwnerReplyDto {
  content: string;
  repliedAt?: string | null;
}

export interface SpaReviewDto {
  id: string | number;
  authorName: string;
  authorAvatarUrl?: string | null;
  rating: number;
  content?: string | null;
  reviewedAt?: string | null;
  /** Ảnh kèm review (Google / nguồn khác), từ raw_payload khi BE parse */
  photoUrls?: string[];
  ownerReply?: SpaReviewOwnerReplyDto | null;
  /** Link trực tiếp tới review trên Google Maps */
  googleMapsUri?: string | null;
  /** Mã ngôn ngữ (vi, en, ko, ...) */
  languageCode?: string | null;
  /** Nguồn review (ví dụ: reddit) */
  source?: string | null;
  /** URL bài viết (nếu có, vd từ Reddit) */
  postUrl?: string | null;
}

export interface SpaServiceItemDto {
  id?: string;
  serviceName: string;
  originalPrice?: number | null;
  discountPrice?: number | null;
  durationMinutes?: number | null;
  packageInfo?: string | null;
}

export interface SpaDetailDto {
  id: string;
  slug: string;
  /** Map locale → slug cho trang này, dùng để switch language đúng URL */
  localizedSlugs?: Record<string, string> | null;
  name: string;
  spaAvatarUrl?: string | null;
  description?: string | null;
  address?: string | null;
  ratingValue: number;
  reviewCount: number;
  googleMapsUri?: string | null;
  /**
   * Google Place ID dạng "ChIJ...", lấy từ Places API resource name.
   * Dùng để build deeplink: https://search.google.com/local/writereview?placeid={googlePlaceId}
   */
  googlePlaceId?: string | null;
  amenities?: string[] | null;
  amenities_en?: string[] | null;
  amenities_ko?: string[] | null;
  /** Google Maps deep links từ Places API */
  googleMapsLinks?: {
    placeUri?: string | null;
    directionsUri?: string | null;
    writeAReviewUri?: string | null;
    reviewsUri?: string | null;
    photosUri?: string | null;
  } | null;
  /** Link chính thức từ Google Places để mở thẳng tab reviews trên web */
  googleMapsReviewsUri?: string | null;
  location: SpaLocationDto;
  contact: SpaContactDto;
  openingHours: OpeningPeriodDto[];
  deals: SpaDealDto[];
  /** Danh sách dịch vụ trích xuất từ bảng giá OCR */
  serviceItems?: SpaServiceItemDto[];
  services: ServiceResponseDto[];
  /** Top 10 reviews gần nhất */
  reviews: SpaReviewDto[];
  /** Gallery image URLs hoặc Google photo names */
  photos: string[];
  breadcrumbs?: BreadcrumbItemDto[] | null;
  distanceKm?: number | null;
}

export interface RecommendedSpaDto {
  /** UUID của spa */
  id: string;
  slug: string;
  name: string;
  ratingValue: number;
  reviewCount: number;
  /** Google Places photo reference (name field) */
  photoName?: string | null;
  /** Ảnh đại diện spa (URL trực tiếp) — ưu tiên hơn photoName khi hiển thị */
  spaAvatarUrl?: string | null;
  cityName?: string | null;
  /** Số deal đang active của spa */
  activeDealCount: number;
  /** Khoảng cách tới user (km), chỉ có khi truyền lat/lng */
  distanceKm?: number | null;
  /** Lượt xem thực tế */
  viewCount?: number | null;
  /** Giờ mở cửa từ DB */
  openingHours?: OpeningPeriodDto[] | null;
  /** Ưu đãi tốt nhất thực trong DB */
  bestDeal?: {
    id: number;
    title: string;
    slug: string;
    canonicalSlug?: string;
    salePrice?: number | null;
    originalPrice?: number | null;
    discountPercent?: string | number | null;
    currency?: string;
  } | null;
}


// ─── Deals ───────────────────────────────────────────────────────────────────

export interface DealCardDto {
  id: number;
  slug: string;
  /** Slug chuẩn cho URL (không `#`); ưu tiên khi build link */
  canonicalSlug?: string;
  title: string;
  coverImageUrl?: string | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  /** BE trả dạng chuỗi, ví dụ "30" hoặc "30%" */
  discountPercent?: string | number | null;
  currency: string;
  startAt?: string | null;
  endAt?: string | null;
  /** Deal đang trong khung giờ flash sale */
  isFlashSale: boolean;
  spa: SpaBasicDto;
}

export interface SpaDealsGroupDto {
  spa: SpaBasicDto;
  deals: DealCardDto[];
}

export interface FlashSaleDto {
  deals: DealCardDto[];
  /** Bắt đầu khung flash (ISO) */
  startsAt?: string | null;
  /** Kết thúc khung flash — countdown đến đây */
  endsAt?: string | null;
  /** Ví dụ 21:00–22:00 */
  windowLabel?: string | null;
  /** Độ dài khung (phút), thường 60–120 */
  applicableDurationMinutes?: number | null;
  /** Có đang trong khung giờ flash sale không */
  isActive: boolean;
  /** Số giây còn lại đến khi flash sale kết thúc, null nếu không active */
  countdownSeconds?: number | null;
}

export interface DealVariantPriceDto {
  id: number;
  priceType: string;
  listPrice?: number | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  currency: string;
}

export interface DealVariantDto {
  id: number;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  durationMin?: number | null;
  pax?: number | null;
  descriptionVi?: string | null;
  sortOrder: number;
  prices: DealVariantPriceDto[];
}

export interface DealMediaDto {
  id: number;
  mediaUrl: string;
  mediaType: string;
  sortOrder: number;
}

export interface DealDetailDto {
  id: number;
  slug: string;
  canonicalSlug?: string;
  titleVi: string;
  titleEn?: string | null;
  titleKo?: string | null;
  shortDescriptionVi?: string | null;
  shortDescriptionEn?: string | null;
  contentVi?: string | null;
  coverImageUrl?: string | null;
  originalPrice: number;
  salePrice: number;
  discountPercent?: number | null;
  currency: string;
  startAt?: string | null;
  endAt?: string | null;
  isFlashSale: boolean;
  /** Đã hết slot đặt chỗ (BE gửi) */
  isSoldOut?: boolean;
  /** Deal hết hạn (BE gửi); FE fallback: endAt < now */
  isExpired?: boolean;
  /** Tổng mở trang + click deal (tracking_events) */
  viewCount?: number;
  spa: SpaBasicDto;
  variants: DealVariantDto[];
  media: DealMediaDto[];
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export interface BreadcrumbItemDto {
  label: string;
  url: string;
}

export interface SeoMetaDto {
  h1: string;
  title: string;
  metaDescription: string;
  breadcrumbs: BreadcrumbItemDto[];
  /** Có nên index trang này không */
  indexable: boolean;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PageDealsDto {
  data: SpaDealsGroupDto[];
  meta: PaginationMetaDto;
}

export interface PageFiltersDto {
  services: ServiceResponseDto[];
  currentService?: ServiceResponseDto | null;
  subServices?: ServiceResponseDto[];
  parentGroupId?: number | null;
  cities: CityResponseDto[];
  currentCity?: CityResponseDto | null;
  districts?: DistrictResponseDto[];
  currentDistrict?: DistrictResponseDto | null;
  places?: PlaceResponseDto[];
  /** Slug của toà nhà / đường — từ URL path (do page resolver điền) */
  place?: string | null;
  /** Full place object — populated by resolver khi URL chứa place slug */
  currentPlace?: PlaceResponseDto | null;
}

export type PageType = 'category' | 'city' | 'district' | 'not_found';

export interface PagePayloadDto {
  pageType: PageType;
  flashSaleHub?: boolean;
  seoMeta: SeoMetaDto;
  deals: PageDealsDto;
  flashSale: FlashSaleDto;
  filters: PageFiltersDto;
}

// ─── Home ────────────────────────────────────────────────────────────────────

/** GET /api/v1/home/banners */
export interface HeroBannerResponseDto {
  id: number;
  slotKey: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  dealId?: number | null;
  linkUrl?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

/** GET /api/v1/home/promo-banners */
export interface PromoBannerResponseDto {
  id: number;
  slotKey: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  dealId?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  position?: string | null;
}

export type BannerPlacement = 'home_slot' | 'breadcrumb';
export type BannerLocale = 'vi' | 'en' | 'ko';

export interface BannerResponseDto {
  id: number;
  name: string;
  nameVi: string;
  nameEn?: string | null;
  nameKo?: string | null;
  placement: BannerPlacement;
  slotNumber?: number | null;
  spaId?: string | null;
  imageUrl: string;
  imageUrlVi: string;
  imageUrlEn?: string | null;
  imageUrlKo?: string | null;
  targetUrl: string;
  gaClickTag?: string | null;
  isEnabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface GetDealsParams {
  page?: number;
  limit?: number;
  city_slug?: string;
  district_slug?: string;
  place_slug?: string;
  service_slug?: string;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'distance';
  lat?: number;
  lng?: number;
  minRating?: number;
  gender?: string;
  priceSort?: string;
  isOpenNow?: boolean;
}

export interface ResolvePageParams {
  url: string;
  locale?: 'vi' | 'en' | 'ko';
  lat?: number;
  lng?: number;
  page?: number;
  limit?: number;
  priceSort?: string;
  sortBy?: string;
  minRating?: number;
  /** Tên toà nhà / đường do user nhập */
  place?: string;
  isOpenNow?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
