import { cache } from 'react';
import { LOCATION_COOKIE_NAME } from '@/stores/location/useLocationStore';
import { cookies } from 'next/headers';

export type CookieCoords = { lat: number; lng: number };

export const getCoordsFromCookie = cache(async (): Promise<CookieCoords | null> => {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(LOCATION_COOKIE_NAME)?.value;
    if (!raw) return null;

    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      state?: { coords?: { latitude?: unknown; longitude?: unknown } };
    };

    const lat = parsed?.state?.coords?.latitude;
    const lng = parsed?.state?.coords?.longitude;

    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      isFinite(lat) &&
      isFinite(lng)
    ) {
      return { lat, lng };
    }

    return null;
  } catch {
    // Cookie bị block, malformed JSON, hoặc bất kỳ lỗi runtime nào
    return null;
  }
});
