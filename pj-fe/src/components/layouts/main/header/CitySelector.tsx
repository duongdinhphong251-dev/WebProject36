"use client";

import { useState } from "react";
import { MapPin, ChevronDown, Check, Search, LocateFixed, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCityList } from "@/hooks/useCityList";
import type { CityResponseDto } from "@/types/api";
import { cn } from "@/libs/utils";

import { useRouter, useParams } from "next/navigation";
import { resolveServiceKey, getServiceUrl } from "@/constants/services";
import type { LocaleTypes } from "@/i18n/settings";

export function CitySelector() {
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
  } = useCityList();

  const [isOpen, setIsOpen] = useState(false);

  const handleSelectCity = (city: CityResponseDto) => {
    selectCity(city, "manual");
    setIsOpen(false);
    
    // Navigate to new URL if we are on a service listing page
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
          "flex w-full items-center justify-between px-3 py-2 text-left rounded-xl transition-colors text-[13.5px]",
          isActive
            ? "bg-[#E8FDE7] text-[#093E06] font-semibold"
            : "text-slate-700 hover:bg-slate-100/80 font-normal",
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={selectedCity ? getDisplayName(selectedCity) : labels.defaultLabel}
          className={cn(
            "flex items-center gap-1.5 px-[14px] h-10 rounded-xl text-white bg-white/15 hover:bg-white/25 transition-all text-[13.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-white",
            isOpen && "bg-white/30",
          )}
        >
          <MapPin className="w-4 h-4 text-[#E8FDE7] shrink-0" />
          <span className="max-w-[130px] truncate text-[#E8FDE7]">
            {selectedCity ? getDisplayName(selectedCity) : labels.defaultLabel}
          </span>
          <ChevronDown
            className={cn("w-3 h-3 text-white/80 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[290px] p-0 rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden z-50 text-slate-800"
      >
        {/* Header Search */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 text-[13.5px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#40813D] transition-colors"
            />
          </div>

          {/* Auto detect button */}
          <button
            type="button"
            onClick={onAutoDetectClick}
            disabled={isDetecting}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8FDE7] py-2 px-3 text-[12.5px] font-semibold text-[#1C5019] hover:bg-[#d5f7d4] transition-colors disabled:opacity-60"
          >
            {isDetecting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{labels.autoDetectLabel}</span>
          </button>
        </div>

        {/* Cities List */}
        <div className="max-h-[320px] overflow-y-auto p-1.5 divide-y divide-slate-50">
          {isLoading && cities.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{labels.loadingLabel}</span>
            </div>
          ) : filteredCities !== null ? (
            filteredCities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {labels.emptyLabel}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredCities.map((city) => renderCityItem(city))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {/* Nút Tất cả khu vực */}
              <button
                type="button"
                onClick={() => {
                  selectCity(null, "manual");
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-left rounded-xl transition-colors text-[13.5px]",
                  !selectedCity
                    ? "bg-[#E8FDE7] text-[#093E06] font-semibold"
                    : "text-slate-700 hover:bg-slate-100/80 font-normal",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{labels.defaultLabel === "Chọn khu vực" ? "Tất cả khu vực" : labels.defaultLabel}</span>
                </div>
                {!selectedCity && <Check className="w-4 h-4 text-[#40813D] shrink-0 ml-2" />}
              </button>

              {/* Nhóm phổ biến */}
              {popularCities.length > 0 && (
                <div className="space-y-0.5">
                  <div className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {labels.popularLabel}
                  </div>
                  {popularCities.map((city) => renderCityItem(city))}
                </div>
              )}

              {/* Nhóm tỉnh thành khác */}
              {otherCities.length > 0 && (
                <div className="space-y-0.5 pt-1">
                  <div className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {labels.otherLabel}
                  </div>
                  {otherCities.map((city) => renderCityItem(city))}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
