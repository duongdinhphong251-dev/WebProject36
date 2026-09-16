"use client";

import { useQuery } from "@tanstack/react-query";
import type { DealCardDto, FlashSaleDto } from "@/types/api";
import { API_V1_PREFIX } from "@/constants/api";
import { x_source } from "@/constants/common";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { SpaCardScroll } from "./SpaCardScroll";

function unwrapDeals(raw: unknown): DealCardDto[] {
  if (!raw || typeof raw !== "object") return [];
  if ("deals" in raw && Array.isArray((raw as FlashSaleDto).deals)) {
    return (raw as FlashSaleDto).deals;
  }
  if ("data" in raw) {
    const inner = (raw as { data: unknown }).data;
    if (inner && typeof inner === "object" && "deals" in inner) {
      return (inner as FlashSaleDto).deals ?? [];
    }
  }
  return [];
}

async function fetchFlashSaleDeals(
  locale?: string,
  lat?: number | null,
  lng?: number | null,
): Promise<DealCardDto[]> {
  const base = process.env.NEXT_PUBLIC_API;
  if (!base) return [];

  const params = new URLSearchParams();
  if (locale && ["vi", "en", "ko"].includes(locale))
    params.set("locale", locale);
  if (lat != null) params.set("lat", lat.toFixed(6));
  if (lng != null) params.set("lng", lng.toFixed(6));

  const res = await fetch(
    `${base}${API_V1_PREFIX}/deals/flash-sale?${params}`,
    { headers: { "X-Source": x_source } },
  );
  if (!res.ok) throw new Error("flash-sale fetch failed");
  const json: unknown = await res.json();
  return unwrapDeals(json);
}

interface FlashSaleWithClientGeoProps {
  initialDeals: DealCardDto[];
  locale?: string;
}

/**
 * Client wrapper: SSR renders initialDeals, sau khi user share vị trí
 * useLocationStore cập nhật coords → useQuery refetch với lat/lng.
 * Khi coords=null → gửi request không có lat/lng (BE trả về mặc định).
 */
export function FlashSaleWithClientGeo({
  initialDeals,
  locale,
}: FlashSaleWithClientGeoProps) {
  const coords = useLocationStore((s) => s.coords);

  const { data: deals } = useQuery({
    queryKey: ["flash-sale", locale, coords?.latitude, coords?.longitude],
    queryFn: () =>
      fetchFlashSaleDeals(locale, coords?.latitude, coords?.longitude),
    initialData: initialDeals,
    staleTime: 0, // 2 phút — coords ít thay đổi
    refetchOnWindowFocus: true,
  });

  if (!deals?.length) return null;
  return <SpaCardScroll deals={deals} locale={locale} />;
}
