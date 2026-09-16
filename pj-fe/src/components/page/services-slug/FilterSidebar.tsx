"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useTranslate from "@/hooks/useTranslate";
import { useFilterStore } from "@/stores/filter/useFilterStore";
import {
  filterStateToParams,
  paramsToFilterState,
  hasActiveFilters,
} from "@/libs/filter-utils";
import { Button } from "@/components/ui/button";
import type { PageFiltersDto } from "@/types/api";
import { FilterGender } from "./FilterGender";
import { FilterPrice } from "./FilterPrice";
import { FilterRating } from "./FilterRating";

interface FilterSidebarProps {
  /** Filter options từ PagePayloadDto (cities, districts, services...) */
  filters?: PageFiltersDto;
}

/**
 * Main filter sidebar container — desktop only (hidden on mobile, md:block)
 * - Syncs filter state with URL query parameters
 * - Provides reset button to clear all filters
 * - Contains all four filter sections: districts, gender, price, rating
 */
export function FilterSidebar({ filters: _pageFilters }: FilterSidebarProps) {
  const t = useTranslate("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, resetFilters, setFilters } = useFilterStore();

  // Sync URL params to filters on mount and when URL changes externally
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const stateFromUrl = paramsToFilterState(params);

    const currentFilters = useFilterStore.getState().filters;
    const currentParamsStr = JSON.stringify(
      filterStateToParams(currentFilters),
    );
    const urlParamsStr = JSON.stringify(filterStateToParams(stateFromUrl));

    if (currentParamsStr !== urlParamsStr) {
      setFilters(stateFromUrl);
    }
  }, [searchParams, setFilters]);

  // Sync filters to URL whenever filters change
  useEffect(() => {
    const params = filterStateToParams(filters);
    const newSearchParams = new URLSearchParams(searchParams);

    let hasChanges = false;

    const setParam = (key: string, value?: string) => {
      if (value) {
        if (newSearchParams.get(key) !== value) {
          newSearchParams.set(key, value);
          hasChanges = true;
        }
      } else {
        if (newSearchParams.has(key)) {
          newSearchParams.delete(key);
          hasChanges = true;
        }
      }
    };

    setParam("gender", params.gender);
    setParam("minRating", params.minRating);
    setParam("priceSort", params.priceSort);

    if (hasChanges) {
      const queryString = newSearchParams.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
      router.push(newUrl, { scroll: false });
    }
  }, [filters, router, searchParams]);

  const handleReset = () => {
    resetFilters();
    // URL will be synced by the useEffect above
  };

  return (
    <aside className="hidden md:block w-64 flex-shrink-0">
      <div className="sticky top-4 space-y-4">
        {/* Header with Reset Button */}
        <div className="flex items-center justify-between px-4">
          <h2 className="text-lg font-bold text-gray-900">
            {t("filters") || "Bộ lọc"}
          </h2>
          {hasActiveFilters(filters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              {t("reset") || "Đặt lại"}
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200" />

        {/* Filter Sections */}
        <div className="space-y-0">
          <FilterGender />
          <FilterPrice />
          <FilterRating />
        </div>
      </div>
    </aside>
  );
}
