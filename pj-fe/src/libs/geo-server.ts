import { cookies } from 'next/headers';
import { LOCATION_COOKIE_NAME } from '@/stores/location/useLocationStore';

/**
 * Server-only utility — không import file này trong Client Components.
 *
 * Đọc coords từ cookie `tuoi-location` ở server-side (Next.js App Router).
 * Dùng làm fallback khi URL không có ?lat=&lng=.
 * Cookie có format: {"state":{"coords":{"latitude":...,"longitude":...}},"version":0}
 */
export async function parseCoordsFromLocationCookie(): Promise<{ lat: number; lng: number } | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(LOCATION_COOKIE_NAME)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw));
    const lat = parsed?.state?.coords?.latitude;
    const lng = parsed?.state?.coords?.longitude;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
