"use client";

import { useEffect, useRef, useState } from "react";
import type { RecommendedSpaDto } from "@/types/api";
import { API_V1_PREFIX } from "@/constants/api";
import { x_source } from "@/constants/common";
import { NearbySpasScroll } from "./NearbySpasScroll";
import { NearbySpaMobileCard } from "./NearbySpaMobileCard";
import { useLocationStore } from "@/stores/location/useLocationStore";

function unwrapRecommended(raw: unknown): RecommendedSpaDto[] {
  if (Array.isArray(raw)) return raw as RecommendedSpaDto[];
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    Array.isArray((raw as { data: unknown }).data)
  ) {
    return (raw as { data: RecommendedSpaDto[] }).data;
  }
  return [];
}

export function NearbySpasWithClientGeo({
  initialSpas,
  locale,
}: {
  initialSpas: RecommendedSpaDto[];
  locale: string;
}) {
  const [spas, setSpas] = useState(initialSpas);
  const upgradedByGeoRef = useRef(false);

  useEffect(() => {
    if (!upgradedByGeoRef.current) setSpas(initialSpas);
  }, [initialSpas]);

  const coords = useLocationStore((s) => s.coords);

  useEffect(() => {
    if (!coords?.latitude || !coords?.longitude) return;

    const base = process.env.NEXT_PUBLIC_API;
    if (!base) return;

    const fetchGeoSpas = async () => {
      const q = new URLSearchParams({
        lat: coords.latitude.toFixed(6),
        lng: coords.longitude.toFixed(6),
        limit: "4",
        locale: locale || "vi",
      });
      try {
        const res = await fetch(`${base}${API_V1_PREFIX}/spas/recommended?${q}`, {
          headers: { "X-Source": x_source },
        });
        if (!res.ok) return;
        const json: unknown = await res.json();
        const list = unwrapRecommended(json);
        if (list.length > 0) {
          upgradedByGeoRef.current = true;
          setSpas(list);
        }
      } catch {
        // keep initial list
      }
    };

    fetchGeoSpas();
  }, [coords, locale]);

  const displayedSpas = spas.slice(0, 4);

  if (!displayedSpas.length) return null;
  return (
    <>
      {/* Giao diện Mobile (Dưới 768px): Danh sách tối đa 4 thẻ theo ảnh mẫu */}
      <div className="flex flex-col gap-3 md:hidden">
        {displayedSpas.map((spa) => (
          <NearbySpaMobileCard key={spa.id || spa.slug} spa={spa} locale={locale} />
        ))}
      </div>

      {/* Giao diện Tablet / Desktop (Từ 768px trở lên): Hiển thị tối đa 4 thẻ */}
      <div className="hidden md:block">
        <NearbySpasScroll spas={displayedSpas} locale={locale} />
      </div>
    </>
  );
}

