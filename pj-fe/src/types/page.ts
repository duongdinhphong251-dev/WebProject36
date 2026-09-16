import type { Spa } from './spa';
import type { Deal } from './deal';

export type GeoLevel = 'national' | 'city' | 'district' | 'building' | 'street';

export interface Breadcrumb {
  label: string;
  url: string;
}

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  locale: string;
  geoLevel: GeoLevel;
  breadcrumbs: Breadcrumb[];
}

export interface SortOption {
  value: string;
  label: string;
}

export interface PageData {
  metadata: PageMetadata;
  heroContent: {
    heading: string;
    subheading: string;
    imageUrl?: string;
  };
  filters?: {
    services: string[];
    sortOptions: SortOption[];
  };
  spas: Spa[];
  deals: Deal[];
}
