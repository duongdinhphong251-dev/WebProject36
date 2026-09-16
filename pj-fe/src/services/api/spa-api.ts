import type {
  CityResponseDto,
  DistrictResponseDto,
  PlaceResponseDto,
  ServiceResponseDto,
  SpaDealsGroupDto,
  FlashSaleDto,
  DealDetailDto,
  SpaDetailDto,
  PagePayloadDto,
  GetDealsParams,
  ResolvePageParams,
} from '@/types/api';

import { cache } from 'react';
import http, { HttpError } from '@/services/http';
import { API_V1_PREFIX } from '@/constants/api';
import type { SpaDetailDto as ApiSpaDetailDto } from '@/types/api';
import type { SpaDetailDto as DealSpaDetailDto } from '@/types/deal-detail';
import { mapApiSpaDetailForDeal } from '@/services/api/map-api-spa-detail-for-deal';

type ApiEnvelope<T> = {
  data: T;
};

type PaginatedApiEnvelope<T> = {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ─── Locations ───────────────────────────────────────────────────────────────

const CITIES_CACHE_KEY = 'glowexplore_cities_cache';
const CITIES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getCities(): Promise<CityResponseDto[]> {
  if (typeof window !== 'undefined') {
    try {
      const cachedStr = localStorage.getItem(CITIES_CACHE_KEY);
      if (cachedStr) {
        const cachedData = JSON.parse(cachedStr);
        if (cachedData && cachedData.expiry > Date.now() && Array.isArray(cachedData.data)) {
          return cachedData.data;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  const { data } = await http.get<CityResponseDto[] | PaginatedApiEnvelope<CityResponseDto[]>>(
    `${API_V1_PREFIX}/locations/cities?limit=100`,
  );
  
  let result: CityResponseDto[] = [];
  if (Array.isArray(data)) result = data;
  else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
    result = data.data;
  }

  if (typeof window !== 'undefined' && result.length > 0) {
    try {
      localStorage.setItem(CITIES_CACHE_KEY, JSON.stringify({
        expiry: Date.now() + CITIES_CACHE_TTL,
        data: result
      }));
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  return result;
}

/**
 * GET /api/v1/locations/cities/{slug}/districts
 * Danh sách quận/huyện theo tỉnh/thành
 */
export async function getDistrictsByCitySlug(citySlug: string): Promise<DistrictResponseDto[]> {
  const { data } = await http.get<DistrictResponseDto[]>(
    `${API_V1_PREFIX}/locations/cities/${citySlug}/districts`,
  );
  return data;
}

/**
 * GET /api/v1/locations/districts/{slug}/places
 * Danh sách địa điểm (tòa nhà, đường) theo quận/huyện
 */
export async function getPlacesByDistrictSlug(districtSlug: string): Promise<PlaceResponseDto[]> {
  const { data } = await http.get<PaginatedApiEnvelope<PlaceResponseDto[]>>(
    `${API_V1_PREFIX}/locations/districts/${districtSlug}/places`,
  );
  return Array.isArray(data.data) ? data.data : [];
}

// ─── Services ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/services
 * Danh sách danh mục dịch vụ (massage, nails, v.v.)
 */
export async function getServices(): Promise<ServiceResponseDto[]> {
  const { data } = await http.get<ApiEnvelope<ServiceResponseDto[]> | ServiceResponseDto[]>(
    `${API_V1_PREFIX}/services`,
  );
  return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
}

// ─── Deals ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/deals
 * Danh sách deals nhóm theo spa
 */
export async function getDeals(params?: GetDealsParams): Promise<SpaDealsGroupDto[]> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const { data } = await http.get<PaginatedApiEnvelope<SpaDealsGroupDto[]>>(
    `${API_V1_PREFIX}/deals${query ? `?${query}` : ''}`,
  );
  return Array.isArray(data.data) ? data.data : [];
}

/**
 * GET /api/v1/deals/flash-sale
 * Top 10 deals có discount cao nhất đang active
 */
export const getFlashSale = cache(async (locale?: string): Promise<FlashSaleDto> => {
  const q = locale && ['vi', 'en', 'ko'].includes(locale) ? `?locale=${locale}` : '';
  const { data } = await http.get<FlashSaleDto | ApiEnvelope<FlashSaleDto>>(`${API_V1_PREFIX}/deals/flash-sale${q}`);


  // BE may return direct object or { data: FlashSaleDto }
  const result = (data as ApiEnvelope<FlashSaleDto>).data ?? data;
  return result as FlashSaleDto;
});

/**
 * GET /api/v1/deals/{id}
 * Chi tiết deal
 */
export async function getDealById(id: number): Promise<DealDetailDto | null> {

  const { data } = await http.get<ApiEnvelope<DealDetailDto>>(`${API_V1_PREFIX}/deals/${id}`);
  return data.data;
}

// ─── Spas ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/spas/{id}
 * Chi tiết spa
 */
export async function getSpaBySlug(
  id: string,
  options?: { lat?: number; lng?: number; locale?: string },
): Promise<SpaDetailDto | null> {
  const params = new URLSearchParams();
  if (options?.lat != null && isFinite(options.lat)) params.set('lat', String(options.lat));
  if (options?.lng != null && isFinite(options.lng)) params.set('lng', String(options.lng));
  if (options?.locale) params.set('locale', options.locale);
  const qs = params.size ? `?${params.toString()}` : '';
  try {
    const { data } = await http.get<ApiEnvelope<SpaDetailDto>>(`${API_V1_PREFIX}/spas/${id}${qs}`, {
      next: { revalidate: 30 },
    });
    return data.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// ─── Pages ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/pages/resolve — một request / bộ tham số (kể cả khi generateMetadata + page cùng gọi).
 * React cache() so khóa theo primitive → tránh gọi API trùng trong một navigation.
 */
const fetchResolvePagePayload = cache(
  async (
    cleanUrl: string,
    locale: string | undefined,
    page: number,
    limit: number,
    latStr: string | null,
    lngStr: string | null,
    sort: string | null,
    minRating: number | null,
    isOpenNow: boolean | null,
    minPrice: number | null,
    maxPrice: number | null,
  ): Promise<PagePayloadDto> => {
    const searchParams = new URLSearchParams({ url: cleanUrl });
    if (locale) searchParams.set('locale', locale);
    if (latStr !== null && lngStr !== null) {
      searchParams.set('lat', latStr);
      searchParams.set('lng', lngStr);
    }
    searchParams.set('page', String(page));
    searchParams.set('limit', String(limit));
    if (sort) searchParams.set('sort', sort);
    if (minRating !== null && minRating > 0) searchParams.set('minRating', String(minRating));
    if (isOpenNow) searchParams.set('isOpenNow', 'true');
    if (minPrice !== null && minPrice >= 0) searchParams.set('minPrice', String(minPrice));
    if (maxPrice !== null && maxPrice >= 0) searchParams.set('maxPrice', String(maxPrice));

    const { data } = await http.get<ApiEnvelope<PagePayloadDto> | PagePayloadDto>(
      `${API_V1_PREFIX}/pages/resolve?${searchParams.toString()}`,
      { next: { revalidate: 10 } },
    );
    const body = data as ApiEnvelope<PagePayloadDto> | PagePayloadDto;
    const inner = (body as ApiEnvelope<PagePayloadDto>).data;
    const result: PagePayloadDto = (
      inner &&
      typeof inner === 'object' &&
      'pageType' in inner &&
      'seoMeta' in inner
    ) ? inner : (body as PagePayloadDto);

    return result;
  },
);

/**
 * GET /api/v1/pages/resolve
 * Page Resolver — 1 API cho mọi public page
 *
 * FE truyền URL hiện tại, backend trả full payload:
 * SEO meta, breadcrumbs, danh sách deals, flash sale, và filter options.
 */
export async function resolvePage(params: ResolvePageParams): Promise<PagePayloadDto> {
  const cleanUrl = params.url.replace(/^\//, '');
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const isGlobalDealsListing = cleanUrl.replace(/\/+$/, '') === 'deals';

  let latStr: string | null;
  let lngStr: string | null;
  // Trang /deals: không gửi lat/lng mặc định → BE sort theo rating (toàn quốc), giống “xem tất cả”.
  if (isGlobalDealsListing) {
    if (params.lat != null && params.lng != null) {
      latStr = String(params.lat);
      lngStr = String(params.lng);
    } else {
      latStr = null;
      lngStr = null;
    }
  } else {
    // Hub dịch vụ (không /deals): chỉ gửi lat/lng khi FE truyền rõ (vị trí người dùng) → BE sort theo khoảng cách.
    if (params.lat != null && params.lng != null) {
      latStr = String(params.lat);
      lngStr = String(params.lng);
    } else {
      latStr = null;
      lngStr = null;
    }
  }

  const sortStr = params.priceSort === 'asc'
    ? 'price_asc'
    : params.priceSort === 'desc'
      ? 'price_desc'
      : (params.sortBy ?? null);

  const minRating = params.minRating != null && params.minRating > 0 ? params.minRating : null;
  const isOpenNow = params.isOpenNow === true ? true : null;
  const minPrice = params.minPrice != null && params.minPrice >= 0 ? params.minPrice : null;
  const maxPrice = params.maxPrice != null && params.maxPrice >= 0 ? params.maxPrice : null;

  const primary = await fetchResolvePagePayload(
    cleanUrl,
    params.locale,
    page,
    limit,
    latStr,
    lngStr,
    sortStr,
    minRating,
    isOpenNow,
    minPrice,
    maxPrice,
  );

  return primary;
}


export const getSpaById = cache(async function getSpaById(
  id: string,
  locale: string,
): Promise<DealSpaDetailDto | null> {
  try {
    const res = await http.get<{ data: ApiSpaDetailDto }>(`${API_V1_PREFIX}/spas/${id}?lang=${locale}`);
    return mapApiSpaDetailForDeal(res.data.data);
  } catch (error) {
    if ((error as any).status === 404) return null;
    console.error(`Failed to fetch spa by id: ${id}`, error);
    return null;
  }
});

// ─── SEO URLs ─────────────────────────────────────────────────────────────────

export interface SeoUrlItem {
  /** URL slug for this locale, e.g. "massage" or "massage-ha-noi" */
  url: string;
  /** Locale this record belongs to: "vi" | "en" | "ko" */
  locale: string;
  nodeType: string;
  categoryId?: number | null;
  cityId?: number | null;
  districtId?: number | null;
  wardId?: number | null;
  placeId?: number | null;
  updatedAt?: string | null;
}

interface SeoUrlsParams {
  nodeType?: string;   // comma-separated, e.g. "category,city"
  locale?: string;     // comma-separated, e.g. "vi,en,ko"
  page?: number;
  limit?: number;
}

/**
 * GET /api/v1/seo/urls
 * Returns SEO-optimised URL paths grouped by node type, with per-locale paths.
 * Used by sitemap.ts to include category×city pages.
 */
export async function getSeoUrls(params: SeoUrlsParams = {}): Promise<SeoUrlItem[]> {
  const qs = new URLSearchParams();
  if (params.nodeType) qs.set('nodeType', params.nodeType);
  if (params.locale) qs.set('locale', params.locale);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  try {
    const res = await http.get<unknown>(
      `${API_V1_PREFIX}/seo/urls?${qs.toString()}`,
      { next: { revalidate: 3600 } } as any,
    );

    // Handle all BE response shapes:
    //   1. Paginated: { data: { data: [...], meta: {...} } }
    //   2. Flat envelope: { data: [...] }
    //   3. Bare array: [...]
    const raw = res as any;
    let items: unknown = raw;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const inner = raw.data;
      if (Array.isArray(inner)) {
        items = inner;
      } else if (inner && typeof inner === 'object' && Array.isArray(inner.data)) {
        items = inner.data;
      }
    }
    return Array.isArray(items) ? (items as SeoUrlItem[]) : [];
  } catch (error) {
    console.error('[getSeoUrls] Failed to fetch SEO URLs', error);
    return [];
  }
}
