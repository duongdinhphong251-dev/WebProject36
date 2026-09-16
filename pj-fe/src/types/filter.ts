/**
 * User gender filter for spa service providers.
 * Controls which gender services to display.
 * Can be an array of selected genders (male, female, other) or empty array for no filter.
 */
export type Gender = 'all' | 'male' | 'female' | 'other';

export type PriceSort = 'asc' | 'desc';
export type SortBy = 'rating' | 'distance' | 'discount_desc';

export interface FilterState {
  gender: string[];
  minRating: number;
  priceSort?: PriceSort;
  sortBy?: SortBy;
  place?: string;
  isOpenNow?: boolean;
  minPrice?: number;
  maxPrice?: number;
  extraFilters?: Record<string, boolean>;
}

export interface FilterParams {
  gender?: string;
  minRating?: string;
  priceSort?: string;
  sortBy?: string;
  place?: string;
  isOpenNow?: string;
  minPrice?: string;
  maxPrice?: string;
  [key: string]: string | undefined;
}
