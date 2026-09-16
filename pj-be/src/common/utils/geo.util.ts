const EARTH_RADIUS_KM = 6371;

/** Tính khoảng cách (km) giữa 2 tọa độ theo công thức Haversine */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Parse chuỗi discount_percent ("30%", "0%", null) → number */
export function parseDiscountPercent(value: string | null): number {
  if (!value) return 0;
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

/** Lấy URL ảnh đầu tiên từ jsonb photos của spa (Google Places format) */
export function extractFirstPhotoName(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const first = photos[0] as Record<string, unknown>;
  return typeof first?.name === 'string' ? first.name : null;
}

/** Ưu tiên URL đã cache (GCS/direct) trong từng entry; không trả Places photo resource `name`. */
export function extractFirstCachedPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  for (const entry of photos) {
    const u = (entry as Record<string, unknown>)?.url;
    if (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) return u.trim();
  }
  return null;
}
