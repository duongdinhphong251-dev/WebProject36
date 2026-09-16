"use client";

import { useEffect, useMemo } from "react";
import { useLocationStore } from "@/stores/location/useLocationStore";

interface SpaLocationMetaProps {
  lat?: number | null;
  lng?: number | null;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `~ ${Number(km || 0).toFixed(1)}km`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function SpaLocationMeta({ lat, lng }: SpaLocationMetaProps) {
  const coords = useLocationStore((state) => state.coords);
  const isHydrated = useLocationStore((state) => state.isHydrated);
  const setCoords = useLocationStore((state) => state.setCoords);

  useEffect(() => {
    if (!isHydrated || coords || typeof navigator === "undefined") return;
    if (!navigator.geolocation || !navigator.permissions) return;

    let cancelled = false;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (cancelled || permission.state !== "granted") return;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return;
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => {},
          { maximumAge: 5 * 60 * 1000, timeout: 10_000 },
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [coords, isHydrated, setCoords]);

  const distanceLabel = useMemo(() => {
    if (!coords || lat == null || lng == null) return "";
    return formatDistance(
      calculateDistanceKm(coords, {
        latitude: lat,
        longitude: lng,
      }),
    );
  }, [coords, lat, lng]);

  if (!distanceLabel) return null;

  return <span className="ml-1 text-[#414651]">{distanceLabel}</span>;
}
