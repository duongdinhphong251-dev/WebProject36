/**
 * Home page API service layer
 * Endpoints: /api/v1/home/*, /api/v1/spas/recommended
 *
 * Đổi USE_FAKE_API = false khi BE đã sẵn sàng.
 */

import type {
  HeroBannerResponseDto,
  PromoBannerResponseDto,
  RecommendedSpaDto,
} from '@/types/api';
import { cache } from 'react';

import http from '@/services/http';
import { API_V1_PREFIX } from '@/constants/api';

/** Đổi thành false khi BE đã sẵn sàng */
const USE_FAKE_API = true;

const API_V1 = API_V1_PREFIX;

type ApiEnvelope<T> = { data: T };

// ─── Fake data ────────────────────────────────────────────────────────────────

function getFakeHeroBanners(locale?: string): HeroBannerResponseDto[] {
  if (locale === 'ko') {
    return [
      { id: 1, slotKey: 'hero_1', title: '광고 문의', subtitle: 'Zalo 0896895500 문의\n우선 업종: 스파, 마사지, 여행, 호텔/리조트, 레스토랑, 피트니스, 스포츠, 골프, 패션, 향수, 시가', imageUrl: null, dealId: null, linkUrl: 'https://zalo.me/0896895500' },
    ];
  }
  if (locale === 'en') {
    return [
      { id: 1, slotKey: 'hero_1', title: 'Advertising Inquiry', subtitle: 'Contact Zalo 0896895500\nPriority: Spa, Massage, Travel, Hotel/Resort, Restaurant, Fitness, Sports, Golf, Fashion, Perfume, Cigar', imageUrl: null, dealId: null, linkUrl: 'https://zalo.me/0896895500' },
    ];
  }
  // default: vi
  return [
    { id: 1, slotKey: 'hero_1', title: 'Liên hệ quảng cáo', subtitle: 'Liên hệ Zalo 0896895500\nNhóm ngành ưu tiên: Spa, Massage, Du lịch, Khách sạn/Resort, Nhà hàng, Fitness, Thể thao, Golf, Thời trang, Nước hoa, Xì gà', imageUrl: null, dealId: null, linkUrl: 'https://zalo.me/0896895500' },
  ];
}

// ─── Hero Banners ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/home/banners
 * Hero banners cho slider đầu trang
 */
export const getHeroBanners = cache(async (locale?: string): Promise<HeroBannerResponseDto[]> => {
  if (USE_FAKE_API) return getFakeHeroBanners(locale);

  const query = locale ? `?locale=${locale}` : '';
  const res = await http.get<HeroBannerResponseDto[] | ApiEnvelope<HeroBannerResponseDto[]>>(
    `${API_V1}/home/banners${query}`,
    { next: { revalidate: 60 } }
  );
  const raw = res.data;
  return Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [];
});

// ─── Promo Banners ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/home/promo-banners
 * Promo banners đặt giữa các section.
 * Field `position` cho biết đặt sau section nào.
 */
export const getPromoBanners = cache(async (locale?: string): Promise<PromoBannerResponseDto[]> => {
  const query = locale ? `?locale=${locale}` : '';
  try {
    const res = await http.get<PromoBannerResponseDto[] | ApiEnvelope<PromoBannerResponseDto[]>>(
      `${API_V1}/home/promo-banners${query}`,
      { next: { revalidate: 60, tags: ['banners'] } },
    );
    const raw = res.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [];
  } catch (error) {
    console.warn('Promo banners fetch failed:', error);
    return [];
  }
});

// ─── Recommended Spas ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/spas/recommended
 * Không lat/lng: rating sao cao → thấp. Có lat/lng: gần người dùng → xa (BE).
 */
export const getRecommendedSpas = cache(async (opts?: {
  lat?: number;
  lng?: number;
  limit?: number;
  radiusKm?: number;
  locale?: string;
}): Promise<RecommendedSpaDto[]> => {
  const searchParams = new URLSearchParams();
  if (opts?.lat !== undefined) searchParams.set('lat', String(opts.lat));
  if (opts?.lng !== undefined) searchParams.set('lng', String(opts.lng));
  if (opts?.limit !== undefined) searchParams.set('limit', String(opts.limit));
  if (opts?.radiusKm !== undefined) searchParams.set('radiusKm', String(opts.radiusKm));
  if (opts?.locale !== undefined) searchParams.set('locale', String(opts.locale));
  const query = searchParams.toString();
  const res = await http.get<RecommendedSpaDto[] | ApiEnvelope<RecommendedSpaDto[]>>(
    `${API_V1}/spas/recommended${query ? `?${query}` : ''}`,
    { next: { revalidate: 60 } }
  );

  const raw = res.data;
  return Array.isArray(raw) ? raw : Array.isArray(raw.data) ? raw.data : [];
});
