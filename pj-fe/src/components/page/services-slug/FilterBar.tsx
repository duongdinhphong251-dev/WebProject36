"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ChevronDown, Check, SlidersHorizontal } from "lucide-react";
import { useSpaUrlFilters } from "@/hooks/useSpaUrlFilters";
import useTranslate from "@/hooks/useTranslate";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const FilterDrawerRegion = dynamic(
  () => import("./FilterDrawerRegion").then((mod) => mod.FilterDrawerRegion),
  { ssr: false }
);
const FilterDrawerRating = dynamic(
  () => import("./FilterDrawerRating").then((mod) => mod.FilterDrawerRating),
  { ssr: false }
);
const FilterDrawerCategory = dynamic(
  () => import("./FilterDrawerCategory").then((mod) => mod.FilterDrawerCategory),
  { ssr: false }
);
const FilterDrawerAdvanced = dynamic(
  () => import("./FilterDrawerAdvanced").then((mod) => mod.FilterDrawerAdvanced),
  { ssr: false }
);

import { buildSeoUrl } from "@/libs/filter-utils";

import {
  inferGeoFromFlatPath,
  cityDisplayName,
  districtDisplayName,
  placeDisplayName,
  serviceDisplayName,
} from "@/libs/parse-seo-service-path";
import type { PageFiltersDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";

type DrawerType =
  | "region"
  | "rating"
  | "category"
  | "advanced"
  | "openNow"
  | "nearMe"
  | "under500k"
  | "ratingQuick"
  | null;

interface ChipConfig {
  key: Exclude<DrawerType, null>;
  labelKey: string;
}

const ROW1_CHIP_CONFIG: ChipConfig[] = [
  { key: "advanced", labelKey: "filter" },
  { key: "under500k", labelKey: "under_500k" },
  { key: "ratingQuick", labelKey: "rating_quick" },
  { key: "openNow", labelKey: "is_open_now" },
];

interface FilterBarProps {
  payloadFilters: PageFiltersDto;
}

/**
 * FilterBar — Responsive horizontal chip bar.
 * Each chip opens the corresponding Drawer or toggles quick filter.
 */
export function FilterBar({ payloadFilters }: FilterBarProps) {
  const t = useTranslate("filter");
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const lastClosedAtRef = useRef(0);
  const { filters, commit } = useSpaUrlFilters();

  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = (params?.locale as LocaleTypes) ?? "vi";
  const pathSegment = params?.serviceSlug as string | undefined;

  const inferred = useMemo(
    () =>
      inferGeoFromFlatPath(
        pathSegment,
        locale,
        payloadFilters.services ?? [],
        payloadFilters.cities ?? [],
      ),
    [pathSegment, locale, payloadFilters.services, payloadFilters.cities],
  );

  const mergedFilters = useMemo((): PageFiltersDto => {
    const currentService = payloadFilters.currentService ?? inferred.service;
    const currentCity = payloadFilters.currentCity ?? inferred.city;
    const fromPayload = payloadFilters.currentDistrict;
    const fromInferred =
      inferred.districtSlug && payloadFilters.districts?.length
        ? (payloadFilters.districts.find(
          (d) =>
            d.slug.toLowerCase() === inferred.districtSlug!.toLowerCase(),
        ) ?? null)
        : null;
    return {
      ...payloadFilters,
      currentService,
      currentCity,
      currentDistrict: fromPayload ?? fromInferred,
    };
  }, [payloadFilters, inferred]);

  const { currentCity, currentDistrict, currentService } = mergedFilters;

  // Place name comes directly from BE's currentPlace field in the resolver response
  const resolvedPlaceName = mergedFilters.currentPlace
    ? placeDisplayName(mergedFilters.currentPlace, locale)
    : null;
  // BE returns currentPlace (object) but not place (slug string) — derive slug from object
  const placeSlug = mergedFilters.currentPlace?.slug ?? mergedFilters.place ?? null;

  const isChipActive = (key: Exclude<DrawerType, null>): boolean => {
    switch (key) {
      case "nearMe":
        return filters.sortBy === "distance";
      case "under500k":
        return filters.maxPrice === 500000;
      case "ratingQuick":
        return filters.minRating === 4.5;
      case "region":
        return !!currentCity || !!currentDistrict || !!placeSlug;
      case "rating":
        return filters.minRating > 0;
      case "category":
        return !!currentService;
      case "openNow":
        return !!filters.isOpenNow;
      case "advanced":
        return !!filters.extraFilters && Object.keys(filters.extraFilters).length > 0;
      default:
        return false;
    }
  };

  const getChipLabel = (
    key: Exclude<DrawerType, null>,
    defaultLabelKey: string,
  ) => {
    try {
      switch (key) {
        case "nearMe":
          return t("near_me" as any) || "Gần tôi";
        case "under500k":
          return t("under_500k" as any) || "Dưới 500k";
        case "ratingQuick":
          return t("rating_quick" as any) || "4.5★ trở lên";
        case "region": {
          if (resolvedPlaceName && currentDistrict)
            return `${resolvedPlaceName}, ${districtDisplayName(currentDistrict, locale)}${currentCity ? `, ${cityDisplayName(currentCity, locale)}` : ""}`;
          if (resolvedPlaceName)
            return `${resolvedPlaceName}${currentCity ? `, ${cityDisplayName(currentCity, locale)}` : ""}`;
          if (currentDistrict)
            return `${districtDisplayName(currentDistrict, locale)}${currentCity ? `, ${cityDisplayName(currentCity, locale)}` : ""}`;
          if (currentCity) return cityDisplayName(currentCity, locale);
          return t(defaultLabelKey as Parameters<typeof t>[0]);
        }
        case "rating": {
          if (filters.minRating > 0) {
            return `${filters.minRating} ${filters.minRating === 1 ? t("star") : t("stars")}`;
          }
          return t(defaultLabelKey as Parameters<typeof t>[0]);
        }
        case "category": {
          if (currentService) return serviceDisplayName(currentService, locale);
          return t(defaultLabelKey as Parameters<typeof t>[0]);
        }
        case "openNow": {
          return t("is_open_now" as any) || "Đang mở";
        }
        default:
          return t(defaultLabelKey as Parameters<typeof t>[0]);
      }
    } catch {
      return t(defaultLabelKey as Parameters<typeof t>[0]);
    }
  };

  const closeDrawer = () => {
    lastClosedAtRef.current = Date.now();
    setActiveDrawer(null);
  };

  // Any URL change => ensure drawer closes.
  useEffect(() => {
    setActiveDrawer(null);
  }, [pathname, searchParams]);

  const baseChipClassName =
    "inline-flex min-h-[34px] min-w-0 shrink-0 flex-none items-center gap-1.5 px-3.5 py-1.5 text-left text-[13px] font-medium transition-colors duration-150 rounded-full border cursor-pointer select-none";

  const renderChip = ({ key, labelKey }: ChipConfig) => {
    const active = isChipActive(key);
    const chipClassName = `${baseChipClassName} ${active
        ? "bg-[#40813D] text-white border-[#40813D]"
        : "bg-white text-[#093E06] border-[#DDE4D9] hover:bg-[#F5F7F4]"
      }`;

    const chipContent =
      key === "advanced" ? (
        <SlidersHorizontal
          size={15}
          className={active ? "text-white shrink-0" : "text-[#093E06] shrink-0"}
        />
      ) : key === "openNow" || key === "nearMe" || key === "ratingQuick" || key === "under500k" ? (
        <>
          {active && <Check size={13} className="text-white shrink-0 stroke-[2.5]" />}
          <span
            suppressHydrationWarning
            className="whitespace-nowrap text-left leading-none"
          >
            {getChipLabel(key, labelKey)}
          </span>
        </>
      ) : (
        <>
          {active && <Check size={13} className="text-white shrink-0 stroke-[2.5]" />}
          <span
            suppressHydrationWarning
            className="whitespace-nowrap text-left leading-none"
          >
            {getChipLabel(key, labelKey)}
          </span>
          <ChevronDown
            size={13}
            className={active ? "text-white shrink-0" : "text-[#5B6B58] shrink-0"}
          />
        </>
      );

    const handleOpen = () => {
      if (Date.now() - lastClosedAtRef.current < 350) return;
      if (key === "nearMe") {
        commit({
          ...filters,
          sortBy: filters.sortBy === "distance" ? undefined : "distance",
        });
        return;
      }
      if (key === "under500k") {
        commit({
          ...filters,
          maxPrice: filters.maxPrice === 500000 ? undefined : 500000,
          minPrice: undefined,
        });
        return;
      }
      if (key === "ratingQuick") {
        commit({
          ...filters,
          minRating: filters.minRating === 4.5 ? 0 : 4.5,
        });
        return;
      }
      if (key === "openNow") {
        commit({
          ...filters,
          isOpenNow: filters.isOpenNow ? undefined : true,
        });
        return;
      }
      setActiveDrawer(key as any);
    };

    if (key === "region" || key === "category") {
      const isCat = key === "category";
      let href = buildSeoUrl(
        locale,
        isCat ? null : (currentService?.slugGlobal ?? null),
        isCat ? (currentCity?.slug ?? null) : null,
        isCat ? (currentDistrict?.slug ?? null) : null,
      );
      if (href === `/${locale}`) href = `/${locale}/deals`;
      return (
        <Link
          key={key}
          href={href}
          suppressHydrationWarning
          className={chipClassName}
          onClick={(e) => {
            e.preventDefault();
            handleOpen();
          }}
        >
          {chipContent}
        </Link>
      );
    }

    return (
      <button
        key={key}
        type="button"
        onClick={handleOpen}
        suppressHydrationWarning
        className={chipClassName}
      >
        {chipContent}
      </button>
    );
  };

  return (
    <>
      {/* FilterBar on mobile: single horizontal scrollable row (mockup 1b) */}
      <div className="flex flex-row items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-2.5 w-full">
        {ROW1_CHIP_CONFIG.map(renderChip)}
      </div>

      {/* Drawers */}
      <FilterDrawerRegion
        open={activeDrawer === "region"}
        onClose={closeDrawer}
        payloadFilters={mergedFilters}
      />
      <FilterDrawerRating
        open={activeDrawer === "rating"}
        onClose={closeDrawer}
      />
      <FilterDrawerCategory
        open={activeDrawer === "category"}
        onClose={closeDrawer}
        payloadFilters={mergedFilters}
      />
      <FilterDrawerAdvanced
        open={activeDrawer === "advanced"}
        onClose={closeDrawer}
        payloadFilters={mergedFilters}
      />
    </>
  );
}
