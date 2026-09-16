import type { FilterState, FilterParams, PriceSort, SortBy } from '@/types/filter';

const DEFAULT_MIN_RATING = 0;

export function filterStateToParams(filters: FilterState): FilterParams {
  const params: FilterParams = {
    ...(filters.gender.length > 0 && { gender: filters.gender.join(',') }),
    ...(filters.minRating !== DEFAULT_MIN_RATING && { minRating: filters.minRating.toString() }),
    ...(filters.priceSort && { priceSort: filters.priceSort }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.place && filters.place.trim() && { place: filters.place.trim() }),
    ...(filters.isOpenNow && { isOpenNow: 'true' }),
    ...(filters.minPrice !== undefined && { minPrice: filters.minPrice.toString() }),
    ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice.toString() }),
  };

  if (filters.extraFilters) {
    Object.entries(filters.extraFilters).forEach(([key, val]) => {
      if (val) {
        params[`ex_${key}`] = 'true';
      }
    });
  }

  return params;
}

export function paramsToFilterState(params: FilterParams): FilterState {
  let minRating = DEFAULT_MIN_RATING;

  if (params.minRating) {
    const parsed = parseFloat(params.minRating);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 5) {
      minRating = parsed;
    }
  }

  const priceSort =
    params.priceSort === 'asc' || params.priceSort === 'desc'
      ? (params.priceSort as PriceSort)
      : undefined;

  const VALID_SORT_BY: SortBy[] = ['rating', 'distance', 'discount_desc'];
  const sortBy = VALID_SORT_BY.includes(params.sortBy as SortBy)
    ? (params.sortBy as SortBy)
    : undefined;

  let minPrice: number | undefined;
  if (params.minPrice) {
    const parsed = parseFloat(params.minPrice);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      minPrice = parsed;
    }
  }

  let maxPrice: number | undefined;
  if (params.maxPrice) {
    const parsed = parseFloat(params.maxPrice);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      maxPrice = parsed;
    }
  }

  const extraFilters: Record<string, boolean> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (key.startsWith('ex_') && val === 'true') {
      const cleanKey = key.slice(3);
      extraFilters[cleanKey] = true;
    }
  });

  return {
    gender: params.gender ? params.gender.split(',').filter(Boolean) : [],
    minRating,
    priceSort,
    sortBy,
    place: params.place ?? undefined,
    isOpenNow: params.isOpenNow === 'true',
    minPrice,
    maxPrice,
    ...(Object.keys(extraFilters).length > 0 && { extraFilters }),
  };
}

/**
 * BE `targetUrl` thường đã là path đầy đủ (`/vi/massage-ho-chi-minh`).
 * Nếu chỉ là segment slug thì ghép thêm `/{locale}/`.
 */
export function resolveFilterTargetPath(
  locale: string,
  targetUrl: string,
): string {
  const t = targetUrl.trim();
  if (t.startsWith("/")) return t;
  return `/${locale}/${t}`;
}

/**
 * Builds an SEO-friendly URL path based on selected node types.
 * According to plan.md, the pattern is:
 * /{lang}/{service-slug}-{district-slug}-{city-slug}
 */
export function buildSeoUrl(
  locale: string,
  serviceSlug?: string | null,
  citySlug?: string | null,
  districtSlug?: string | null,
  placeSlug?: string | null,
): string {
  const parts: string[] = [];
  if (serviceSlug) {
    parts.push(serviceSlug);
  }

  if (placeSlug) parts.push(placeSlug);
  if (districtSlug) parts.push(districtSlug);
  if (citySlug) parts.push(citySlug);

  if (parts.length === 0) return `/${locale}`;

  return `/${locale}/${parts.join('-')}`;
}

/**
 * Check if any filters are active (not in default state)
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    (filters.gender && filters.gender.length > 0) ||
    filters.minRating !== DEFAULT_MIN_RATING ||
    !!filters.priceSort ||
    !!filters.sortBy ||
    !!filters.isOpenNow ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined
  );
}
