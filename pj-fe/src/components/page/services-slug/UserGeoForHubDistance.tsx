"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocationStore } from "@/stores/location/useLocationStore";
import type { CityResponseDto } from "@/types/api";
import { getCities } from "@/services/api/spa-api";
import { mapCoordsToCity } from "@/libs/geo-city-mapper";

function validUserCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Trang hub dịch vụ (chưa chọn tỉnh/thành): xin geolocation rồi gắn ?lat=&lng= để BE sort deal/spa theo khoảng cách gần → xa.
 * Đồng thời sync coords và selectedCity vào useLocationStore để các trang khác (home, header...) có thể dùng ngay.
 */
export function UserGeoForHubDistance({
  enabled,
  cities,
  shouldSetCity = true,
}: {
  enabled: boolean;
  cities?: CityResponseDto[];
  shouldSetCity?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const geoRequestedRef = useRef(false);
  const setCoords = useLocationStore((s) => s.setCoords);
  const setSelectedCity = useLocationStore((s) => s.setSelectedCity);

  useEffect(() => {
    if (!enabled) return;

    const resolveAndSetCity = async (lat: number, lng: number) => {
      try {
        const cityList = cities && cities.length > 0 ? cities : await getCities();
        const matched = mapCoordsToCity(lat, lng, cityList);
        const currentSource = useLocationStore.getState().citySource;
        if (matched && shouldSetCity && currentSource !== "manual") {
          setSelectedCity(matched, "auto");
        }
      } catch (e) {
        console.error("Failed to map coords to city", e);
      }
    };

    // 1. Nếu URL đã có tọa độ
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");
    if (latRaw != null && lngRaw != null) {
      const lat = Number.parseFloat(latRaw);
      const lng = Number.parseFloat(lngRaw);
      if (validUserCoords(lat, lng)) {
        // Coords đã có trong URL → sync vào store
        setCoords({ latitude: lat, longitude: lng });
        resolveAndSetCity(lat, lng);
        return;
      }
    }

    // 2. Nếu URL chưa có tọa độ, thử lấy từ Zustand store trước
    const storeCoords = useLocationStore.getState().coords;
    if (storeCoords && validUserCoords(storeCoords.latitude, storeCoords.longitude)) {
      const { latitude: lat, longitude: lng } = storeCoords;
      resolveAndSetCity(lat, lng);

      const next = new URLSearchParams(searchParams.toString());
      next.set("lat", lat.toFixed(6));
      next.set("lng", lng.toFixed(6));
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      return;
    }

    // 3. Nếu store cũng chưa có, mới gọi geolocation (chỉ gọi 1 lần mỗi session component)
    if (geoRequestedRef.current) return;
    geoRequestedRef.current = true;

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!validUserCoords(lat, lng)) return;

        // Sync vào Zustand store
        setCoords({ latitude: lat, longitude: lng });
        resolveAndSetCity(lat, lng);

        const next = new URLSearchParams(searchParams.toString());
        next.set("lat", lat.toFixed(6));
        next.set("lng", lng.toFixed(6));
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      },
      () => {
        // Từ chối hoặc lỗi — giữ sort mặc định (rating), không làm gì
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 12_000 },
    );
  }, [enabled, pathname, router, searchParams, setCoords, setSelectedCity, cities, shouldSetCity]);

  return null;
}

