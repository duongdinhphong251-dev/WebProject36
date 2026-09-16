"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import useTranslate from "@/hooks/useTranslate";
import { useSpaUrlFilters } from "@/hooks/useSpaUrlFilters";
import { buildSeoUrl } from "@/libs/filter-utils";
import { cityDisplayName } from "@/libs/parse-seo-service-path";
import type { LocaleTypes } from "@/i18n/settings";
import type { PageFiltersDto } from "@/types/api";
import { useCityList } from "@/hooks/useCityList";



interface ListingSidebarProps {
  payloadFilters: PageFiltersDto;
  locale: LocaleTypes;
  groupTitle?: string;
}

function ListingSidebarContent({ payloadFilters, locale, groupTitle }: ListingSidebarProps) {
  const t = useTranslate("filter");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const { filters, commit, resetFilters } = useSpaUrlFilters();
  const { selectCity } = useCityList();

  const { currentCity, currentService, cities, subServices } = payloadFilters;



  // Local state cho Khoảng giá min/max
  const [minInput, setMinInput] = useState<string>("");
  const [maxInput, setMaxInput] = useState<string>("");
  const [isPriceError, setIsPriceError] = useState<boolean>(false);

  useEffect(() => {
    setMinInput(
      filters.minPrice !== undefined
        ? new Intl.NumberFormat("vi-VN").format(filters.minPrice)
        : "",
    );
    setMaxInput(
      filters.maxPrice !== undefined
        ? new Intl.NumberFormat("vi-VN").format(filters.maxPrice)
        : "",
    );
    setIsPriceError(false);
  }, [filters.minPrice, filters.maxPrice]);

  const parsePrice = (raw: string): number | undefined => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return undefined;
    const val = parseInt(digits, 10);
    return isNaN(val) ? undefined : val;
  };

  const handlePriceCommit = (overrideMin?: string, overrideMax?: string) => {
    const minVal = parsePrice(overrideMin ?? minInput);
    const maxVal = parsePrice(overrideMax ?? maxInput);

    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      setIsPriceError(true);
      return;
    }

    setIsPriceError(false);
    commit({ ...filters, minPrice: minVal, maxPrice: maxVal });
  };

  // Xử lý chuyển đổi Tỉnh/Thành phố
  const handleCityChange = (citySlug: string | null) => {
    if (citySlug !== currentCity?.slug) {
      if (citySlug) {
        const cityObj = cities?.find((c) => c.slug === citySlug);
        if (cityObj) {
          selectCity(cityObj, "manual");
        }
      } else {
        selectCity(null, "manual");
      }
    }
    
    let path = buildSeoUrl(
      locale,
      currentService?.slugGlobal || null,
      citySlug,
      null,
    );
    if (path === `/${locale}`) path = `/${locale}/deals`;
    const q = searchParams.toString();
    const target = q ? `${path}?${q}` : path;
    
    startTransition(() => {
      router.replace(target, { scroll: false });
      router.refresh();
    });
  };

  // State & Handler cho Dưới 500k
  const isUnder500kActive = filters.maxPrice === 500000;
  const toggleUnder500k = () => {
    if (isUnder500kActive) {
      commit({ ...filters, maxPrice: undefined });
    } else {
      commit({ ...filters, maxPrice: 500000, minPrice: undefined });
    }
  };

  // State & Handler cho 4.5★ trở lên
  const isRatingActive = filters.minRating === 4.5;
  const toggleRating = () => {
    commit({ ...filters, minRating: isRatingActive ? 0 : 4.5 });
  };

  // State & Handler cho Đang mở
  const isOpenNowActive = !!filters.isOpenNow;
  const toggleOpenNow = () => {
    commit({ ...filters, isOpenNow: !isOpenNowActive });
  };

  const hasSubServices = Array.isArray(subServices) && subServices.length > 0;

  const rawSubServiceSectionTitle = groupTitle || currentService?.nameVi || "";
  const subServiceSectionTitle = rawSubServiceSectionTitle.replace(/&amp;/g, "&");

  const handleResetAll = () => {
    setMinInput("");
    setMaxInput("");
    setIsPriceError(false);
    resetFilters();
  };

  return (
    <aside className="hidden md:flex w-[262px] shrink-0 bg-white rounded-2xl p-[18px] shadow-[0_1px_3px_rgba(9,62,6,0.07)] flex-col gap-4">
      {/* Header Sidebar */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-[15px] leading-none text-[#093E06]">
          {t("title") || "Bộ lọc"}
        </span>
        <button
          type="button"
          onClick={handleResetAll}
          className="font-medium text-[12px] leading-none text-[#40813D] underline cursor-pointer hover:opacity-80"
        >
          {t("reset") || "Xóa tất cả"}
        </button>
      </div>

      <div className="h-[1px] bg-[#093E06]/[0.07]" />

      {/* Khu vực (City Select) */}
      <div className="flex flex-col gap-[9px]">
        <label className="font-semibold text-[12.5px] leading-none text-[#093E06]">
          {t("region") || "Khu vực"}
        </label>
        <div className="relative">
          <select
            value={currentCity?.slug || ""}
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

      <div className="h-[1px] bg-[#093E06]/[0.07]" />

      {/* Khoảng giá (2 input min/max) */}
      <div className="flex flex-col gap-[9px]">
        <label className="font-semibold text-[12.5px] leading-none text-[#093E06]">
          {t("price_range_label") || "Khoảng giá"}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="200.000đ"
            value={minInput}
            onChange={(e) => {
              setMinInput(e.target.value);
              setIsPriceError(false);
            }}
            onBlur={() => handlePriceCommit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handlePriceCommit();
              }
            }}
            className={`flex-1 min-w-0 h-[40px] border-[1.5px] ${
              isPriceError ? "border-red-500" : "border-[#DDE4D9]"
            } rounded-[10px] px-[11px] font-normal text-[12.5px] text-[#093E06] bg-white focus:outline-none focus:border-[#40813D]`}
          />
          <span className="text-[#DDE4D9]">–</span>
          <input
            type="text"
            placeholder="1.500.000đ"
            value={maxInput}
            onChange={(e) => {
              setMaxInput(e.target.value);
              setIsPriceError(false);
            }}
            onBlur={() => handlePriceCommit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handlePriceCommit();
              }
            }}
            className={`flex-1 min-w-0 h-[40px] border-[1.5px] ${
              isPriceError ? "border-red-500" : "border-[#DDE4D9]"
            } rounded-[10px] px-[11px] font-normal text-[12.5px] text-[#093E06] bg-white focus:outline-none focus:border-[#40813D]`}
          />
        </div>
      </div>

      <div className="h-[1px] bg-[#093E06]/[0.07]" />

      {/* Nhóm Checkbox */}
      <div className="flex flex-col gap-2.5">
        {/* Checkbox 1: Dưới 500k */}
        <label
          onClick={toggleUnder500k}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isUnder500kActive
                ? "bg-[#40813D] border-[#40813D]"
                : "border-[#DDE4D9] bg-white"
            }`}
          >
            {isUnder500kActive && (
              <Check className="w-3 h-3 text-white stroke-[3]" />
            )}
          </div>
          <span className="font-medium text-[12.5px] text-[#093E06]">
            {t("under_500k") || "Dưới 500k"}
          </span>
        </label>

        {/* Checkbox 2: 4.5★ trở lên (Đã bind minRating) */}
        <label
          onClick={toggleRating}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isRatingActive
                ? "bg-[#40813D] border-[#40813D]"
                : "border-[#DDE4D9] bg-white"
            }`}
          >
            {isRatingActive && (
              <Check className="w-3 h-3 text-white stroke-[3]" />
            )}
          </div>
          <span className="font-medium text-[12.5px] text-[#093E06]">
            {t("rating_quick") || "4.5★ trở lên"}
          </span>
        </label>

        {/* Checkbox 3: Đang mở (Đã bind isOpenNow) */}
        <label
          onClick={toggleOpenNow}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
              isOpenNowActive
                ? "bg-[#40813D] border-[#40813D]"
                : "border-[#DDE4D9] bg-white"
            }`}
          >
            {isOpenNowActive && (
              <Check className="w-3 h-3 text-white stroke-[3]" />
            )}
          </div>
          <span className="font-medium text-[12.5px] text-[#093E06]">
            {t("is_open_now") || "Đang mở"}
          </span>
        </label>
      </div>



      {/* Sub-services section (Dịch vụ trong [Category Name]) — đặt ở cuối cùng */}
      {hasSubServices && (
        <>
          <div className="h-[1px] bg-[#093E06]/[0.07]" />
          <div className="flex flex-col gap-2.5">
            <label className="font-semibold text-[12.5px] leading-none text-[#093E06]">
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
                const path = buildSeoUrl(
                  locale,
                  sub.slugGlobal || null,
                  currentCity?.slug || null,
                  payloadFilters.currentDistrict?.slug || null,
                );
                const q = searchParams.toString();
                const href = q ? `${path}?${q}` : path;
                return (
                  <Link
                    key={sub.id || sub.slugGlobal}
                    href={href}
                    scroll={false}
                    className="bg-[#DDE4D9] hover:bg-[#cbd4c5] text-[#093E06] rounded-[8px] px-[10px] py-[7px] font-medium text-[11.5px] leading-none transition-colors"
                  >
                    {subName}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

export function ListingSidebar(props: ListingSidebarProps) {
  return (
    <Suspense
      fallback={
        <aside className="hidden md:block w-[262px] shrink-0 bg-white rounded-2xl p-[18px] shadow-[0_1px_3px_rgba(9,62,6,0.07)] h-[400px]" />
      }
    >
      <ListingSidebarContent {...props} />
    </Suspense>
  );
}
