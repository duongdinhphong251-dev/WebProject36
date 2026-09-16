"use client";

import { useState } from "react";
import { MapPin, Check, Search, LocateFixed, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { useCityList } from "@/hooks/useCityList";
import type { CityResponseDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";
import { cn } from "@/libs/utils";

import { useRouter, useParams } from "next/navigation";
import { resolveServiceKey, getServiceUrl } from "@/constants/services";

interface MobileLocationBarProps {
  locale?: string;
}

export function MobileLocationBar({ locale }: MobileLocationBarProps) {
  const router = useRouter();
  const params = useParams();

  const {
    selectedCity,
    cities,
    isLoading,
    searchQuery,
    setSearchQuery,
    isDetecting,
    popularCities,
    otherCities,
    filteredCities,
    selectCity,
    handleAutoDetect,
    getDisplayName,
    labels,
  } = useCityList(locale as LocaleTypes);

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectCity = (city: CityResponseDto) => {
    selectCity(city, "manual");
    setIsOpen(false);

    if (params?.serviceSlug) {
      const currentServiceSlug = params.serviceSlug as string;
      const currentLocale = (params.locale as LocaleTypes) || "vi";
      const serviceKey = resolveServiceKey(currentServiceSlug, currentLocale);

      if (serviceKey) {
        const newUrl = getServiceUrl(serviceKey, currentLocale, city.slug);
        const search = window.location.search;
        router.replace(`${newUrl}${search}`, { scroll: false });
      }
    }
  };

  const onAutoDetectClick = () => {
    handleAutoDetect((city) => {
      setIsOpen(false);

      if (params?.serviceSlug && city) {
        const currentServiceSlug = params.serviceSlug as string;
        const currentLocale = (params.locale as LocaleTypes) || "vi";
        const serviceKey = resolveServiceKey(currentServiceSlug, currentLocale);

        if (serviceKey) {
          const newUrl = getServiceUrl(serviceKey, currentLocale, city.slug);
          const search = window.location.search;
          router.replace(`${newUrl}${search}`, { scroll: false });
        }
      }
    });
  };

  const renderCityItem = (city: CityResponseDto) => {
    const isActive = selectedCity?.id === city.id || selectedCity?.slug === city.slug;
    const name = getDisplayName(city);

    return (
      <button
        key={city.id || city.slug}
        type="button"
        onClick={() => handleSelectCity(city)}
        className={cn(
          "flex w-full items-center justify-between px-3.5 py-2.5 text-left rounded-xl transition-colors text-[14px]",
          isActive
            ? "bg-[#E8FDE7] text-[#093E06] font-semibold"
            : "text-slate-800 hover:bg-slate-100/80 font-normal",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{name}</span>
        </div>
        {isActive && <Check className="w-4 h-4 text-[#40813D] shrink-0 ml-2" />}
      </button>
    );
  };

  return (
    <div className="w-full pt-2.5 md:hidden">
      <div className="flex items-center justify-between text-[#E8FDE7]">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium truncate text-[12.5px]">
            {selectedCity ? getDisplayName(selectedCity) : labels.defaultLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="font-medium shrink-0 ml-2 hover:opacity-90 active:opacity-75 transition-opacity cursor-pointer text-[12px]"
        >
          {labels.changeRegionLabel}
        </button>
      </div>

      {/* Drawer chọn khu vực trên mobile */}
      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={labels.changeRegionLabel}
        height="85dvh"
      >
        <div className="flex flex-col h-full">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-[14px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#40813D] transition-colors"
              />
            </div>

            {/* Auto detect button */}
            <button
              type="button"
              onClick={onAutoDetectClick}
              disabled={isDetecting}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8FDE7] py-2.5 px-3 text-[13px] font-semibold text-[#1C5019] hover:bg-[#d5f7d4] active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LocateFixed className="w-4 h-4 shrink-0" />
              )}
              <span>{labels.autoDetectLabel}</span>
            </button>
          </div>

          {/* Cities List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading && cities.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{labels.loadingLabel}</span>
              </div>
            ) : filteredCities !== null ? (
              filteredCities.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  {labels.emptyLabel}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCities.map((city) => renderCityItem(city))}
                </div>
              )
            ) : (
              <div className="space-y-4 pb-6">
                {/* Nhóm phổ biến */}
                {popularCities.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {labels.popularLabel}
                    </div>
                    {popularCities.map((city) => renderCityItem(city))}
                  </div>
                )}

                {/* Nhóm tỉnh thành khác */}
                {otherCities.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {labels.otherLabel}
                    </div>
                    {otherCities.map((city) => renderCityItem(city))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
