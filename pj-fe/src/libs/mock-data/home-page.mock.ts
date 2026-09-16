/**
 * Home page mock data
 * Replace async functions với real API calls khi backend sẵn sàng.
 * Tất cả getters wrap bằng React.cache() để dedup per-request.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  bgColor: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SpaListing {
  id: number;
  name: string;
  location: string;
  spaSlug?: string;
  discount?: number; // percentage, e.g. 14 → "-14%"
  originalPrice?: number;
  salePrice?: number;
  imageUrl?: string;
  rating?: number;
}

export interface PromoBannerItem {
  id: number;
  title: string;
  bgColor: string;
  imageUrl?: string;
  href?: string;
}

// ─── Hero Banners ─────────────────────────────────────────────────────────────

const HERO_BANNERS_DATA: HeroBanner[] = [
  {
    id: 1,
    title: 'Ưu đãi mùa hè 2025',
    subtitle: 'Giảm đến 50% dịch vụ spa cao cấp',
    bgColor: '#5B7A4F',
    ctaLabel: 'Khám phá ngay',
    ctaHref: '/spa',
  },
  {
    id: 2,
    title: 'Flash Sales',
    subtitle: 'Booking ngay hôm nay — số lượng có hạn',
    bgColor: '#5fb3a1',
    ctaLabel: 'Xem ưu đãi',
    ctaHref: '/organization_services',
  },
  {
    id: 3,
    title: 'Chăm sóc da chuyên sâu',
    subtitle: 'Liệu trình skincare từ chuyên gia',
    bgColor: '#5B7A4F',
    ctaLabel: 'Đặt lịch',
    ctaHref: '/skincare',
  },
  {
    id: 4,
    title: 'Massage thư giãn',
    subtitle: 'Giảm stress — tăng năng lượng',
    bgColor: '#5fb3a1',
    ctaLabel: 'Đặt lịch',
    ctaHref: '/massage',
  },
];

// ─── Flash Sale Spas ──────────────────────────────────────────────────────────

const FLASH_SALE_SPAS_DATA: SpaListing[] = [
  {
    id: 1,
    name: 'Zen Spa & Beauty',
    location: 'Ho Chi Minh City',
    spaSlug: 'zen-garden-spa-and-massage',
    discount: 14,
    originalPrice: 350000,
    salePrice: 300750,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=80',
  },
  {
    id: 2,
    name: 'Lotus Wellness Center',
    location: 'Ho Chi Minh City',
    spaSlug: 'lotus-beauty-and-wellness',
    discount: 20,
    originalPrice: 500000,
    salePrice: 400000,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=300&q=80',
  },
  {
    id: 3,
    name: 'Blossom Nail & Spa',
    location: 'Hà Nội',
    spaSlug: 'an-lac-spa',
    discount: 14,
    originalPrice: 280000,
    salePrice: 240800,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=300&q=80',
  },
  {
    id: 4,
    name: 'Jade Beauty Lounge',
    location: 'Đà Nẵng',
    spaSlug: 'saigon-thai-massage',
    discount: 25,
    originalPrice: 450000,
    salePrice: 337500,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&q=80',
  },
  {
    id: 5,
    name: 'Harmony Spa',
    location: 'Ho Chi Minh City',
    spaSlug: 'zen-garden-spa-and-massage',
    discount: 18,
    originalPrice: 600000,
    salePrice: 492000,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  },
];

export const FLASH_SALE_END_DATE = new Date(
  new Date().getTime() + 19 * 3600 * 1000 + 30 * 60 * 1000 + 48 * 1000,
);

// ─── Recommended Spas ─────────────────────────────────────────────────────────

const RECOMMENDED_SPAS_DATA: SpaListing[] = [
  {
    id: 101,
    name: 'Saigon Beauty Hub',
    location: 'Ho Chi Minh City',
    spaSlug: 'saigon-thai-massage',
    discount: 10,
    originalPrice: 400000,
    salePrice: 360000,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&q=80',
  },
  {
    id: 102,
    name: 'Herbal Spa Hanoi',
    location: 'Hà Nội',
    spaSlug: 'an-lac-spa',
    discount: 15,
    originalPrice: 320000,
    salePrice: 272000,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&q=80',
  },
  {
    id: 103,
    name: 'Pearl Nail Studio',
    location: 'Ho Chi Minh City',
    spaSlug: 'lotus-beauty-and-wellness',
    discount: 5,
    originalPrice: 250000,
    salePrice: 237500,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80',
  },
  {
    id: 104,
    name: 'Green Leaf Wellness',
    location: 'Đà Nẵng',
    spaSlug: 'zen-garden-spa-and-massage',
    discount: 12,
    originalPrice: 480000,
    salePrice: 422400,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1621091527396-7c41e93b7367?w=300&q=80',
  },
  {
    id: 105,
    name: 'Aura Beauty Clinic',
    location: 'Ho Chi Minh City',
    spaSlug: 'lotus-beauty-and-wellness',
    discount: 20,
    originalPrice: 700000,
    salePrice: 560000,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
  },
];

// ─── Promo Banners ────────────────────────────────────────────────────────────

const PROMO_BANNER_SINGLE_DATA: PromoBannerItem[] = [
  {
    id: 1,
    title: 'Ưu đãi đặc biệt tháng 4',
    bgColor: '#5B7A4F',
    href: '/organization_services',
  },
];

const PROMO_BANNER_DOUBLE_DATA: PromoBannerItem[] = [
  {
    id: 2,
    title: 'Khuyến mãi cuối tuần',
    bgColor: '#5B7A4F',
    href: '/organization_services',
  },
  {
    id: 3,
    title: 'Mua 1 tặng 1 dịch vụ nail',
    bgColor: '#5fb3a1',
    href: '/organization_services/nail',
  },
];

// ─── Exported getters (simulate async — swap với fetch khi có API) ─────────────

export async function getHeroBanners(): Promise<HeroBanner[]> {
  return HERO_BANNERS_DATA;
}

export async function getFlashSaleSpas(): Promise<SpaListing[]> {
  return FLASH_SALE_SPAS_DATA;
}

export async function getRecommendedSpas(): Promise<SpaListing[]> {
  return RECOMMENDED_SPAS_DATA;
}

export async function getPromoBannerSingle(): Promise<PromoBannerItem[]> {
  return PROMO_BANNER_SINGLE_DATA;
}

export async function getPromoBannerDouble(): Promise<PromoBannerItem[]> {
  return PROMO_BANNER_DOUBLE_DATA;
}
