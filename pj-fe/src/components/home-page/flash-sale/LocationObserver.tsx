"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useTranslate from "@/hooks/useTranslate";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { getCities } from "@/services/api/spa-api";
import { mapCoordsToCity } from "@/libs/geo-city-mapper";

type PermState = "prompt" | "granted" | "denied" | "unknown";

export function LocationObserver() {
  const t = useTranslate("home");
  const setCoords = useLocationStore((s) => s.setCoords);
  const setSelectedCity = useLocationStore((s) => s.setSelectedCity);
  const clearCoords = useLocationStore((s) => s.clearCoords);
  const coords = useLocationStore((s) => s.coords);
  const isHydrated = useLocationStore((s) => s.isHydrated);

  const [permState, setPermState] = useState<PermState>("unknown");
  const [dismissed, setDismissed] = useState(false);
  const hasTriggeredRef = useRef(false);

  const requestLocation = useCallback(
    (reloadOnSuccess = false) => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(coords);
          setPermState("granted");
          try {
            const cities = await getCities();
            const matched = mapCoordsToCity(coords.latitude, coords.longitude, cities);
            const currentSource = useLocationStore.getState().citySource;
            if (matched && currentSource !== "manual") {
              setSelectedCity(matched, "auto");
            }
          } catch (e) {
            console.error("Failed to map coords to city", e);
          }
          if (reloadOnSuccess) window.location.reload();
        },
        () => setPermState("denied"),
        { maximumAge: 5 * 60 * 1000, timeout: 10_000 },
      );
    },
    [setCoords, setSelectedCity],
  );

  // Observe permission state
  useEffect(() => {
    if (!navigator.permissions) return;
    let cancelled = false;
    let permStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((s) => {
        if (cancelled) return;
        permStatus = s;
        // Nếu denied → xóa coords cũ (user có thể đã grant trước đó)
        if (s.state === "denied") clearCoords();
        setPermState(s.state as PermState);
        if (s.state === "granted") {
          requestLocation(false);
        }
        s.onchange = () => {
          if (cancelled) return;
          if (s.state === "denied") clearCoords();
          setPermState(s.state as PermState);
          if (s.state === "granted") {
            requestLocation(false);
            setDismissed(false);
          }
        };
      })
      .catch(() => { });

    return () => {
      cancelled = true;
      if (permStatus) permStatus.onchange = null;
    };
  }, [requestLocation]);

  // Trigger toast khi flash-sale section xuất hiện
  useEffect(() => {
    const el = document.getElementById("flash-sale-section");
    if (!el || !navigator.geolocation) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          navigator.permissions
            ?.query({ name: "geolocation" })
            .then((s) => {
              if (s.state === "prompt") setPermState("prompt");
              // granted → requestLocation đã gọi trong useEffect trên
            })
            .catch(() => { });
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Không hiển thị nếu chưa hydrate, đã có data, hoặc đã cấp quyền/bỏ qua
  if (
    !isHydrated ||
    coords ||
    permState === "granted" ||
    permState === "unknown" ||
    dismissed
  ) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-4 z-[1200] w-[300px] rounded-2xl border border-[#e9eaeb] bg-white/95 p-4 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)] backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f5f2]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#5B7A4F"
            aria-hidden
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-[1.4] text-[#0a0d12]">
            {t("location_toast.title")}
          </p>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-[#535862]">
            {permState === "denied"
              ? t("location_toast.subtitle_denied")
              : t("location_toast.subtitle_prompt")}
          </p>

          <div className="mt-3 flex gap-2">
            {permState === "denied" ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-[10px] bg-[#5B7A4F] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
              >
                {t("location_toast.reload")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requestLocation(false)}
                className="rounded-[10px] bg-[#5B7A4F] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
              >
                {t("location_toast.allow")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-[10px] px-3 py-1.5 text-[12px] text-[#535862] transition-colors hover:text-[#0a0d12]"
            >
              {t("location_toast.dismiss")}
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="-mr-1 -mt-1 ml-1 shrink-0 rounded-lg p-1 text-[#a4a7ae] transition-colors hover:text-[#535862]"
          aria-label={t("location_toast.dismiss")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
