"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { getCities } from "@/services/api/spa-api";
import { mapCoordsToCity } from "@/libs/geo-city-mapper";
import type { CityResponseDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";
import { normalizeLocationSearchKey, localizeLocationName } from "@/libs/localize-location-name";

export function getCityDisplayName(city: CityResponseDto, locale?: LocaleTypes): string {
  return localizeLocationName(city.nameVi, locale, city.nameEn, city.nameKo);
}

export function useCityList(customLocale?: LocaleTypes) {
  const params = useParams();
  const locale = customLocale || (params?.locale as LocaleTypes) || "vi";

  const selectedCity = useLocationStore((s) => s.selectedCity);
  const setSelectedCity = useLocationStore((s) => s.setSelectedCity);
  const setCoords = useLocationStore((s) => s.setCoords);

  const [cities, setCities] = useState<CityResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  // Fetch cities once on mount
  useEffect(() => {
    let cancelled = false;
    if (cities.length === 0) {
      setIsLoading(true);
      getCities()
        .then((res) => {
          if (!cancelled) {
            setCities(res || []);
          }
        })
        .catch((e) => console.error("Failed to load cities", e))
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [cities.length]);

  // Sắp xếp cities 2 cấp: priority giảm dần -> tên tiếng Việt ABC
  const sortedCities = useMemo(() => {
    return [...cities].sort((a, b) => {
      const pDiff = (b.priority || 0) - (a.priority || 0);
      if (pDiff !== 0) return pDiff;
      return a.nameVi.localeCompare(b.nameVi, "vi");
    });
  }, [cities]);

  // Phân nhóm: Phổ biến (priority cao) và Tỉnh thành khác
  const popularCities = useMemo(() => {
    return sortedCities.filter((c) => (c.priority || 0) > 0);
  }, [sortedCities]);

  const otherCities = useMemo(() => {
    return sortedCities.filter((c) => (c.priority || 0) === 0);
  }, [sortedCities]);

  // Lọc theo search query
  const filteredCities = useMemo(() => {
    const q = normalizeLocationSearchKey(searchQuery);
    if (!q) return null; // null = hiển thị theo phân nhóm popular/other
    return sortedCities.filter((c) => {
      const matchVi = normalizeLocationSearchKey(c.nameVi).includes(q);
      const matchEn = c.nameEn ? normalizeLocationSearchKey(c.nameEn).includes(q) : false;
      const matchKo = c.nameKo ? normalizeLocationSearchKey(c.nameKo).includes(q) : false;
      return matchVi || matchEn || matchKo;
    });
  }, [sortedCities, searchQuery]);

  const selectCity = useCallback(
    (city: CityResponseDto | null, source: "manual" | "auto" = "manual") => {
      setSelectedCity(city, source);
      if (city) {
        setSearchQuery("");
      }
    },
    [setSelectedCity],
  );

  const handleAutoDetect = useCallback(
    (_onSuccess?: (city: CityResponseDto) => void) => {
      // Disabled geolocation auto-detect
    },
    [],
  );

  // Labels theo ngôn ngữ
  const defaultLabel =
    locale === "ko" ? "지역 선택" : locale === "en" ? "Select region" : "Chọn khu vực";

  const searchPlaceholder =
    locale === "ko" ? "도시 검색..." : locale === "en" ? "Search city..." : "Tìm tỉnh/thành phố...";

  const autoDetectLabel =
    locale === "ko" ? "현재 위치 자동 감지" : locale === "en" ? "Auto-detect location" : "Tự động phát hiện vị trí";

  const popularLabel =
    locale === "ko" ? "인기 지역" : locale === "en" ? "Popular Regions" : "Khu vực phổ biến";

  const otherLabel =
    locale === "ko" ? "기타 지역" : locale === "en" ? "Other Regions" : "Tỉnh / Thành khác";

  const loadingLabel =
    locale === "ko" ? "로딩 중..." : locale === "en" ? "Loading..." : "Đang tải...";

  const emptyLabel =
    locale === "ko" ? "결과 없음" : locale === "en" ? "No cities found" : "Không tìm thấy tỉnh/thành";

  const changeRegionLabel =
    locale === "ko" ? "지역 변경" : locale === "en" ? "Change region" : "Đổi khu vực";

  const getDisplayName = useCallback(
    (city: CityResponseDto) => getCityDisplayName(city, locale),
    [locale],
  );

  return {
    locale,
    selectedCity,
    cities,
    isLoading,
    searchQuery,
    setSearchQuery,
    isDetecting,
    sortedCities,
    popularCities,
    otherCities,
    filteredCities,
    selectCity,
    handleAutoDetect,
    getDisplayName,
    labels: {
      defaultLabel,
      searchPlaceholder,
      autoDetectLabel,
      popularLabel,
      otherLabel,
      loadingLabel,
      emptyLabel,
      changeRegionLabel,
    },
  };
}
