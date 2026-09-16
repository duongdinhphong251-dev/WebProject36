export interface Spa {
  id: string;
  name: string;
  slug: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  address: string;
  distance?: number;
  services: string[];
  isPromoted?: boolean;
}

export interface SpaCardProps extends Spa {
  locale: string;
}
