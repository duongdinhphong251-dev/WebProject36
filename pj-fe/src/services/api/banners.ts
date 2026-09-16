import http from '@/services/http';
import type { BannerLocale, BannerPlacement, BannerResponseDto } from '@/types/api';
import { API_V1_PREFIX } from '@/constants/api';

type ApiEnvelope<T> = { data: T };

function resolveImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  const apiBase = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';
  return `${apiBase}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
}

async function getBannersByPlacement(
  placement: BannerPlacement,
  locale: BannerLocale = 'vi',
  lat?: number,
  lng?: number,
): Promise<BannerResponseDto[]> {
  const query = new URLSearchParams({ placement });
  query.set('locale', locale);
  if (lat != null) query.set('lat', lat.toString());
  if (lng != null) query.set('lng', lng.toString());

  const response = await http.get<BannerResponseDto[] | ApiEnvelope<BannerResponseDto[]>>(
    `${API_V1_PREFIX}/banners?${query.toString()}`,
    { next: { revalidate: 60, tags: ['banners'] } },
  );
  const payload = response.data;
  const items = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : [];
  return items.map((item) => ({ ...item, imageUrl: resolveImageUrl(item.imageUrl) }));
}

export async function getHomeSlotBanners(locale: BannerLocale = 'vi', lat?: number, lng?: number) {
  return getBannersByPlacement('home_slot', locale, lat, lng);
}

export async function getBreadcrumbBanner(locale: BannerLocale = 'vi') {
  const items = await getBannersByPlacement('breadcrumb', locale);
  return items[0] ?? null;
}
