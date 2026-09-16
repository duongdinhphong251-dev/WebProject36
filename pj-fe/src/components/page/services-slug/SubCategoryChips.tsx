"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/libs/utils";
import useTranslate from "@/hooks/useTranslate";
import type { LocaleTypes } from "@/i18n/settings";
import type { PageFiltersDto, ServiceResponseDto } from "@/types/api";
import { buildSeoUrl } from "@/libs/filter-utils";

interface SubCategoryChipsProps {
  payloadFilters: PageFiltersDto;
  locale: LocaleTypes;
}

function SubCategoryChipsContent({
  payloadFilters,
  locale,
}: SubCategoryChipsProps) {
  const t = useTranslate("filter");
  const searchParams = useSearchParams();
  const activeChipRef = useRef<HTMLAnchorElement | null>(null);
  const isInitialMount = useRef(true);

  const { currentService, currentCity, currentDistrict, services } =
    payloadFilters;

  // Tự động cuộn chip active vào giữa màn hình
  // Mount lần đầu dùng "instant" để tránh giật layout, các lần đổi sau dùng "smooth"
  useEffect(() => {
    const isFirst = isInitialMount.current;
    isInitialMount.current = false;
    if (activeChipRef.current) {
      const behavior = isFirst ? "instant" : "smooth";
      const container = activeChipRef.current.parentElement;
      if (container) {
        const scrollLeft =
          activeChipRef.current.offsetLeft -
          container.clientWidth / 2 +
          activeChipRef.current.clientWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior });
      }
    }
  }, [currentService?.slugGlobal]);

  if (!services || services.length === 0) {
    return null;
  }

  const getLabel = (service: ServiceResponseDto): string => {
    let name = service.nameVi;
    if (locale === "en" && service.nameEn) name = service.nameEn;
    else if (locale === "ko" && service.nameKo) name = service.nameKo;
    return (name || "").replace(/&amp;/g, "&");
  };

  // URL cho nút "Tất cả" (Xoá filter service, giữ nguyên city/district)
  const allHref = (() => {
    let path = buildSeoUrl(
      locale,
      null,
      currentCity?.slug || null,
      currentDistrict?.slug || null,
    );
    if (path === `/${locale}`) path = `/${locale}/deals`;
    const q = searchParams.toString();
    return q ? `${path}?${q}` : path;
  })();

  const isAllActive = !currentService;

  return (
    <div className="flex gap-2 overflow-x-auto pt-2 pb-1 md:flex-wrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Nút "Tất cả" */}
      <Link
        href={allHref}
        scroll={false}
        ref={isAllActive ? activeChipRef : undefined}
        className={cn(
          "flex-none rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
          isAllActive
            ? "bg-[#40813D] text-white"
            : "border border-[#DDE4D9] bg-white text-[#181d27] hover:bg-[#F5F7F4]",
        )}
      >
        {t("all") || "Tất cả"}
      </Link>

      {/* Danh sách Sub-categories */}
      {services.map((service) => {
        const isActive = currentService?.slugGlobal === service.slugGlobal;

        const href = (() => {
          const path = buildSeoUrl(
            locale,
            service.slugGlobal || null,
            currentCity?.slug || null,
            currentDistrict?.slug || null,
          );
          const q = searchParams.toString();
          return q ? `${path}?${q}` : path;
        })();

        return (
          <Link
            key={service.slugGlobal}
            href={href}
            scroll={false}
            ref={isActive ? activeChipRef : undefined}
            className={cn(
              "flex-none rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-[#40813D] text-white"
                : "border border-[#DDE4D9] bg-white text-[#181d27] hover:bg-[#F5F7F4]",
            )}
          >
            {getLabel(service)}
          </Link>
        );
      })}
    </div>
  );
}

export function SubCategoryChips(props: SubCategoryChipsProps) {
  return (
    <Suspense fallback={null}>
      <SubCategoryChipsContent {...props} />
    </Suspense>
  );
}
