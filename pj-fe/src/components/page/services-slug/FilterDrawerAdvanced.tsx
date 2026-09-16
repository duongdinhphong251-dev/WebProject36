"use client";

import { useTransition, useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { useSpaUrlFilters } from "@/hooks/useSpaUrlFilters";
import useTranslate from "@/hooks/useTranslate";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { buildSeoUrl, filterStateToParams } from "@/libs/filter-utils";
import { appendPreservedGeoParams } from "@/libs/geo-url-params";
import type { PageFiltersDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";
import { cityDisplayName } from "@/libs/parse-seo-service-path";

import { useCityList } from "@/hooks/useCityList";

const SORT_OPTIONS = [
  { value: "relevance", labelKey: "sort_relevance", defaultLabel: "Phù hợp nhất" },
  { value: "price_asc", labelKey: "sort_price_asc", defaultLabel: "Giá thấp nhất" },
  { value: "discount_desc", labelKey: "sort_discount_desc", defaultLabel: "Khuyến mãi tốt nhất" },
  { value: "rating", labelKey: "sort_rating_desc", defaultLabel: "Đánh giá cao nhất" },
] as const;

interface FilterDrawerAdvancedProps {
  open: boolean;
  onClose: () => void;
  payloadFilters?: PageFiltersDto;
}

export function FilterDrawerAdvanced({
  open,
  onClose,
  payloadFilters,
}: FilterDrawerAdvancedProps) {
  const t = useTranslate("filter");
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as LocaleTypes) ?? "vi";
  const [, startTransition] = useTransition();

  const { filters, setFilters, canonicalFilters } = useSpaUrlFilters();
  const { selectCity } = useCityList();

  const currentCity = payloadFilters?.currentCity;
  const currentService = payloadFilters?.currentService;
  const cities = payloadFilters?.cities;
  const subServices = payloadFilters?.subServices;

  const [localCitySlug, setLocalCitySlug] = useState<string | null>(currentCity?.slug ?? null);
  const [localServiceSlug, setLocalServiceSlug] = useState<string | null>(currentService?.slugGlobal ?? null);

  // Sync state whenever props change (e.g. on Back/Forward browser navigation)
  useEffect(() => {
    setLocalCitySlug(currentCity?.slug ?? null);
    setLocalServiceSlug(currentService?.slugGlobal ?? null);
    setFilters(canonicalFilters);
  }, [currentCity?.slug, currentService?.slugGlobal, canonicalFilters, setFilters]);

  // Also re-sync when drawer opens
  useEffect(() => {
    if (open) {
      setLocalCitySlug(currentCity?.slug ?? null);
      setLocalServiceSlug(currentService?.slugGlobal ?? null);
      setFilters(canonicalFilters);
    }
  }, [open, currentCity?.slug, currentService?.slugGlobal, canonicalFilters, setFilters]);
  const hasSubServices = Array.isArray(subServices) && subServices.length > 0;
  const rawSubServiceSectionTitle = currentService?.nameVi || "";
  const subServiceSectionTitle = rawSubServiceSectionTitle.replace(/&amp;/g, "&");



  // Xử lý chuyển đổi Tỉnh/Thành phố (lưu local)
  const handleCityChange = (citySlug: string | null) => {
    setLocalCitySlug(citySlug);
  };

  const currentSortKind = filters.priceSort === "asc" ? "price_asc" : (filters.sortBy || "relevance");

  const handleSortChange = (value: string) => {
    if (value === "price_asc") {
      setFilters({ priceSort: "asc", sortBy: undefined });
    } else if (value === "relevance") {
      setFilters({ priceSort: undefined, sortBy: undefined });
    } else {
      setFilters({ priceSort: undefined, sortBy: value as any });
    }
  };

  const handleReset = () => {
    const parentService = payloadFilters?.services?.find(
      (s) => s.id === currentService?.categoryId
    );
    const defaultServiceSlug = parentService?.slugGlobal ?? currentService?.slugGlobal ?? null;
    const defaultCitySlug = currentCity?.slug ?? null;

    setFilters({});
    setLocalCitySlug(defaultCitySlug);
    setLocalServiceSlug(defaultServiceSlug);
    let path = buildSeoUrl(
      locale,
      defaultServiceSlug,
      defaultCitySlug,
      null,
    );
    if (path === `/${locale}`) path = `/${locale}/deals`;

    const newSearchParams = new URLSearchParams();
    appendPreservedGeoParams(newSearchParams, searchParams);
    const queryString = newSearchParams.toString();
    const target = queryString ? `${path}?${queryString}` : path;

    startTransition(() => {
      router.push(target, { scroll: false });
      onClose();
    });
  };

  const handleApply = () => {
    let nextDistrictSlug = payloadFilters?.currentDistrict?.slug || null;
    if (localCitySlug !== currentCity?.slug) {
      nextDistrictSlug = null;
    }
    let path = buildSeoUrl(
      locale,
      localServiceSlug || null,
      localCitySlug || null,
      nextDistrictSlug
    );
    if (path === `/${locale}`) path = `/${locale}/deals`;

    const paramsMap = filterStateToParams(filters);
    const newSearchParams = new URLSearchParams();
    Object.entries(paramsMap).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newSearchParams.set(key, String(value));
      }
    });

    if (localCitySlug !== currentCity?.slug) {
      if (localCitySlug) {
        const cityObj = cities?.find((c) => c.slug === localCitySlug);
        if (cityObj) {
          selectCity(cityObj, "manual");
        }
      } else {
        selectCity(null, "manual");
      }
    }

    appendPreservedGeoParams(newSearchParams, searchParams);
    const queryString = newSearchParams.toString();
    const target = queryString ? `${path}?${queryString}` : path;

    startTransition(() => {
      router.push(target, { scroll: false });
      router.refresh();
      onClose();
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("title") || "Bộ lọc"}
      footer={
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3 z-10">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-3.5 rounded-full font-medium text-[15px] bg-[#F3F4F6] text-slate-700 active:bg-slate-200 transition-colors"
          >
            {t("reset") || "Xóa tất cả"}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3.5 rounded-full font-medium text-[15px] bg-[#5B7A4F] text-white active:bg-[#4a6340] transition-colors"
          >
            {t("apply") || "Áp dụng"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-4">
        {/* Sắp xếp */}
        <div className="flex flex-col gap-[9px]">
          <label className="font-semibold text-[13px] leading-none text-[#093E06]">
            {(t("sort_prefix" as any) || "Sắp xếp:").replace(":", "")}
          </label>
          <div className="relative">
            <select
              value={currentSortKind}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full h-[42px] border-[1.5px] border-[#DDE4D9] rounded-[11px] px-3 font-medium text-[13px] text-[#093E06] bg-white appearance-none cursor-pointer pr-8 focus:outline-none focus:border-[#40813D]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey as Parameters<typeof t>[0]) || opt.defaultLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5B6B58] pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* Khu vực (City Select) */}
        <div className="flex flex-col gap-[9px]">
          <label className="font-semibold text-[13px] leading-none text-[#093E06]">
            {t("region") || "Khu vực"}
          </label>
          <div className="relative">
            <select
              value={localCitySlug || ""}
              onChange={(e) => handleCityChange(e.target.value || null)}
              className="w-full h-[42px] border-[1.5px] border-[#DDE4D9] rounded-[11px] px-3 font-medium text-[13px] text-[#093E06] bg-white appearance-none cursor-pointer pr-8 focus:outline-none focus:border-[#40813D]"
            >
              <option value="">{t("all_regions") || "Tất cả khu vực"}</option>
              {cities?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {cityDisplayName(c, locale)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5B6B58] pointer-events-none stroke-[2.5]" />
          </div>
        </div>

        {/* Sub-services section (Dịch vụ trong [Category Name]) */}
        {hasSubServices && (
          <>
            <div className="h-[1px] bg-[#093E06]/[0.07]" />
            <div className="flex flex-col gap-2.5">
              <label className="font-semibold text-[13px] leading-none text-[#093E06]">
                {t("services_in_category", { category: subServiceSectionTitle, interpolation: { escapeValue: false } }) || `Dịch vụ trong ${subServiceSectionTitle}`}
              </label>
              <div className="flex flex-wrap gap-2">
                {subServices.map((sub) => {
                  const rawSubName =
                    locale === "en" && sub.nameEn
                      ? sub.nameEn
                      : locale === "ko" && sub.nameKo
                        ? sub.nameKo
                        : sub.nameVi;
                  const subName = (rawSubName || "").replace(/&amp;/g, "&");
                  const isSelected = localServiceSlug === sub.slugGlobal;

                  return (
                    <button
                      key={sub.id || sub.slugGlobal}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setLocalServiceSlug(currentService?.slugGlobal || null);
                        } else {
                          setLocalServiceSlug(sub.slugGlobal || null);
                        }
                      }}
                      className={
                        isSelected
                          ? "bg-[#DDE4D9] text-[#093E06] rounded-[8px] px-[10px] py-[7px] font-medium text-[11.5px] leading-none border border-transparent transition-colors"
                          : "bg-white text-[#40813D] border border-[#40813D] rounded-[8px] px-[10px] py-[7px] font-medium text-[11.5px] leading-none transition-colors"
                      }
                    >
                      {subName}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}


      </div>
    </Drawer>
  );
}
