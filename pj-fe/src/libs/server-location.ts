import { cookies } from "next/headers";
import { LOCATION_COOKIE_NAME } from "@/stores/location/useLocationStore";

export async function getServerLocation() {
  try {
    const cookieStore = await cookies();
    const locationCookie = cookieStore.get(LOCATION_COOKIE_NAME);

    if (!locationCookie || !locationCookie.value) {
      return null;
    }

    // value is URL encoded JSON from Zustand persist middleware
    const decodedValue = decodeURIComponent(locationCookie.value);
    const parsed = JSON.parse(decodedValue);

    if (parsed?.state?.coords) {
      const lat = Number(parsed.state.coords.latitude);
      const lng = Number(parsed.state.coords.longitude);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
    return null;
  } catch (error) {
    console.warn("Failed to parse server location cookie", error);
    return null;
  }
}
