export interface Deal {
  id: string;
  title: string;
  slug: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  imageUrl: string;
  spaName: string;
  spaSlug: string;
  expiresAt: string;
  tags: string[];
  category: string;
}

export interface DealCardProps extends Deal {
  locale: string;
}

export interface DealListResponse {
  deals: Deal[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
