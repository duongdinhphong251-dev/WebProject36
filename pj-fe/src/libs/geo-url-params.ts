const GEO_KEYS = ["lat", "lng"] as const;

function firstString(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/** Đọc lat/lng từ searchParams (App Router). */
export function parseLonLatFromSearch(
  sp: Record<string, string | string[] | undefined> | undefined,
): { lat: number; lng: number } | null {
  if (!sp) return null;
  const latStr = firstString(sp.lat);
  const lngStr = firstString(sp.lng);
  if (latStr == null || lngStr == null) return null;
  const lat = Number.parseFloat(latStr);
  const lng = Number.parseFloat(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/** Giữ ?lat=&lng= khi đổi bộ lọc query (khoảng cách từ vị trí người dùng). */
export function appendPreservedGeoParams(
  target: URLSearchParams,
  source: URLSearchParams | { get(name: string): string | null },
): void {
  for (const key of GEO_KEYS) {
    const v = source.get(key);
    if (v != null && v !== "") target.set(key, v);
  }
}

