"use client";

import { useEffect, useRef, useState } from "react";
import type { RecommendedSpaDto } from "@/types/api";
import { API_V1_PREFIX } from "@/constants/api";
import { x_source } from "@/constants/common";
import { RecommendedSpaScroll } from "./RecommendedSpaScroll";

function validCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

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

/**
 * SSR: danh sách sort theo rating (không vị trí).
 * Sau khi user cho phép geolocation: refetch recommended với lat/lng → BE sort gần → xa.
 */
export function RecommendedSpasWithClientGeo({
  initialSpas,
  locale,
}: {
  initialSpas: RecommendedSpaDto[];
  locale: string;
}) {
  const [spas, setSpas] = useState(initialSpas);
  const geoStartedRef = useRef(false);
  const upgradedByGeoRef = useRef(false);

  useEffect(() => {
    if (!upgradedByGeoRef.current) setSpas(initialSpas);
  }, [initialSpas]);

  useEffect(() => {
    if (geoStartedRef.current) return;
    geoStartedRef.current = true;

    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const base = process.env.NEXT_PUBLIC_API;
    if (!base) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!validCoords(lat, lng)) return;

        const q = new URLSearchParams({
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          limit: "10",
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
          // giữ danh sách theo rating
        }
      },
      () => {
        // không chia sẻ vị trí — giữ initial (rating)
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 12_000 },
    );
  }, []);

  if (!spas.length) return null;
  return <RecommendedSpaScroll spas={spas} locale={locale} />;
}
