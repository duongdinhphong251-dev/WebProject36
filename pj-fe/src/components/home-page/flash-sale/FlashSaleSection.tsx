"use client";
import { ChevronRight } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocationStore } from "@/stores/location/useLocationStore";
import useTranslate from "@/hooks/useTranslate";
import { FlashSaleCountdown } from "./FlashSaleCountdown";
import { SpaCardScroll } from "./SpaCardScroll";
import { Container } from "@/components/ui/container";
import { API_V1_PREFIX } from "@/constants/api";
import { x_source } from "@/constants/common";
import type { FlashSaleDto } from "@/types/api";

// ─── Fetch ────────────────────────────────────────────────────────────────────

function unwrapFlashSale(raw: unknown): FlashSaleDto | null {
  if (!raw || typeof raw !== "object") return null;
  if ("deals" in raw) return raw as FlashSaleDto;
  if ("data" in raw) {
    const inner = (raw as { data: unknown }).data;
    if (inner && typeof inner === "object" && "deals" in inner) {
      return inner as FlashSaleDto;
    }
  }
  return null;
}

async function fetchFlashSale(
  locale?: string,
  lat?: number | null,
  lng?: number | null,
): Promise<FlashSaleDto | null> {
  const base = process.env.NEXT_PUBLIC_API;
  if (!base) return null;

  const params = new URLSearchParams();
  if (locale && ["vi", "en", "ko"].includes(locale))
    params.set("locale", locale);
  if (lat != null) params.set("lat", lat.toFixed(6));
  if (lng != null) params.set("lng", lng.toFixed(6));

  const res = await fetch(
    `${base}${API_V1_PREFIX}/deals/flash-sale?${params}`,
    { headers: { "X-Source": x_source } },
  );
  if (!res.ok) return null;
  const json: unknown = await res.json();
  return unwrapFlashSale(json);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FlashSaleSectionProps {
  locale?: string;
  viewAllHref?: string;
}

/**
 * Client component — tự gọi flash-sale API.
 * Watch useLocationStore: khi coords thay đổi → useQuery refetch với lat/lng.
 * coords=null → request không lat/lng (BE trả mặc định).
 */
export function FlashSaleSection({
  locale,
  viewAllHref,
}: FlashSaleSectionProps) {
  const t = useTranslate("home");
  const router = useRouter();
  const coords = useLocationStore((s) => s.coords);

  const { data: flashSale, isFetching } = useQuery({
    queryKey: ["flash-sale", locale, coords?.latitude, coords?.longitude],
    queryFn: () => fetchFlashSale(locale, coords?.latitude, coords?.longitude),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const hasFlashSale =
    flashSale?.isActive && flashSale.deals && flashSale.deals.length > 0;
  const endsAt =
    hasFlashSale && flashSale?.endsAt ? new Date(flashSale.endsAt) : null;

  return (
    <section
      id="flash-sale-section"
      className="w-full py-3 overflow-x-hidden"
      aria-label={t("home.flash_sale_title")}
    >
      <Container maxWidth="xl">
        {/* Header — luôn hiển thị */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-950 md:text-2xl lg:text-3xl">
              {t("home.flash_sale_title")}
            </h2>
            {endsAt && (
              <div className="rounded-lg bg-[#fecdca] px-1 py-0.5">
                <FlashSaleCountdown
                  targetDate={endsAt}
                  onExpired={() => router.refresh()}
                />
              </div>
            )}
          </div>
          <Link
            href={viewAllHref ?? `/${locale}/flash-sale`}
            className="flex items-center gap-1 text-sm font-medium text-[#5B7A4F] transition-colors hover:text-[#5fb3a1] md:text-base lg:text-lg"
            aria-label={`Xem tất cả ${t("home.flash_sale_title")}`}
          >
            {t("home.view_all")}
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 ml-0.5 stroke-[2]" />
          </Link>
        </div>

        {/* Cards:
            - isFetching: đang gọi API → skeleton
            - không có coords / query disabled → null
            - có data → SpaCardScroll
        */}
        {isFetching ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[163px] w-[148px] flex-shrink-0 animate-pulse rounded-xl bg-zinc-100"
              />
            ))}
          </div>
        ) : hasFlashSale ? (
          <SpaCardScroll deals={flashSale!.deals} locale={locale} />
        ) : flashSale !== undefined ? (
          <div className="py-4 text-center">
            <p className="text-sm text-zinc-500">
              {t("home.flash_sale_empty")}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {t("home.flash_sale_empty_desc")}
            </p>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export function FlashSaleSkeleton() {
  return (
    <div className="w-full py-3">
      <Container maxWidth="xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[163px] w-[148px] flex-shrink-0 animate-pulse rounded-xl bg-zinc-100"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
