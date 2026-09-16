"use client";

import { useState, useMemo } from "react";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Clock from "lucide-react/dist/esm/icons/clock";
import type { SpaDealDto, SpaServiceItemDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";
import { useTranslation } from "@/i18n/client";
import { CurrencyToggle } from "@/components/common/currency-toggle/CurrencyToggle";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { cn } from "@/libs/utils";
import { DealCard, type SpaDetailDictionary } from "./DealCard";

const normalizeString = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Massage": ["massage", "mát xa", "xoa bóp"],
  "Chăm sóc da": ["da mặt", "chăm sóc da", "facial", "mặt nạ", "tẩy da chết"],
  "Gội đầu dưỡng sinh": ["gội đầu", "dưỡng sinh"],
  "Lấy ráy tai": ["ráy tai", "lấy ráy"],
  "Xông hơi & sauna": ["xông hơi", "sauna", "giác hơi"],
  "Nail": ["nail", "móng", "sơn gel", "vẽ móng"],
  "Nối mi": ["mi", "nối mi", "uốn mi"],
  "Khác": [], // fallback
};

const CATEGORY_I18N_KEYS: Record<string, string> = {
  "Massage": "category_massage",
  "Chăm sóc da": "category_skincare",
  "Gội đầu dưỡng sinh": "category_herbal_shampoo",
  "Lấy ráy tai": "category_ear_cleaning",
  "Xông hơi & sauna": "category_sauna",
  "Nail": "category_nail",
  "Nối mi": "category_lash",
  "Khác": "category_other",
};

const classifyServiceName = (name: string): string => {
  const normalizedName = normalizeString(name);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "Khác") continue;
    if (keywords.some((kw) => normalizedName.includes(normalizeString(kw)))) {
      return category;
    }
  }
  return "Khác";
};

export interface CategoryGroup {
  id: number | null;
  title: string;
  deals: SpaDealDto[];
}

interface SpaPricingTableProps {
  serviceItems?: SpaServiceItemDto[];
  categoryGroups: CategoryGroup[];
  bestDealId: number | null;
  locale: LocaleTypes;
  dictionary: SpaDetailDictionary;
}

export function SpaPricingTable({
  serviceItems,
  categoryGroups,
  bestDealId,
  locale,
  dictionary,
}: SpaPricingTableProps) {
  const { t } = useTranslation(locale, "spa-detail");
  const { formatPrice, currency, formatUSD, formatVND } = useCurrencyPreference();
  const hasServiceItems = Array.isArray(serviceItems) && serviceItems.length > 0;

  const groupedServiceItems = useMemo(() => {
    if (!hasServiceItems) return [];
    
    const groupsMap = new Map<string, SpaServiceItemDto[]>();
    Object.keys(CATEGORY_KEYWORDS).forEach(key => {
      groupsMap.set(key, []);
    });

    serviceItems.forEach(item => {
      const category = classifyServiceName(item.serviceName || "");
      groupsMap.get(category)?.push(item);
    });

    return Array.from(groupsMap.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([title, items], index) => ({
        id: `service-group-${index}`,
        title,
        items
      }));
  }, [serviceItems, hasServiceItems]);

  // Accordion state: default to null (collapsed by default, user clicks to expand - matching Mockup 2b)
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);

  const toggleGroup = (groupKey: string) => {
    setActiveGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

  const getDisplayCategoryTitle = (title: string) => {
    const key = CATEGORY_I18N_KEYS[title];
    return key ? (t(key) || title) : title;
  };


  return (
    <section className="rounded-[24px] bg-[#FFFFFF] p-4 md:p-5 shadow-[0_10px_40px_rgba(20,52,35,0.06)] space-y-4">
      {/* Header card "Bảng giá đầy đủ" (Mockup 2b) */}
      <div className="flex items-start justify-between gap-3 border-b border-[#F0F2F5] pb-3.5">
        <div>
          <h2 className="text-base md:text-lg font-bold text-[#093E06]">
            {t("full_price_list") || "Bảng giá đầy đủ"}
          </h2>
        </div>
        <CurrencyToggle size="sm" />
      </div>

      {/* Accordion List — seamless groups within one card (Mockup 2b) */}
      <div className="divide-y divide-[rgba(9,62,6,0.06)]">
        {hasServiceItems ? (
          groupedServiceItems.map((group) => {
            const groupKey = group.id;
            const isGroupOpen = activeGroupKey === groupKey;
            const countText = t("services_count", { count: group.items.length });

            return (
              <div key={groupKey}>
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-3.5 text-left transition-colors hover:bg-[#F5F7F4] cursor-pointer",
                    isGroupOpen ? "bg-[#F5F7F4]/60" : "bg-white",
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[14.5px] text-[#093E06]">
                      {getDisplayCategoryTitle(group.title)}
                    </span>
                    <span className="text-[13px] font-normal text-[#5B6B58]">
                      {countText}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-[#5B6B58] transition-transform duration-200",
                      isGroupOpen && "rotate-180",
                    )}
                  />
                </button>

                {isGroupOpen && (
                  <div className="bg-[#FAFBF9]/40">
                    {group.items.map((item, idx) => (
                      <div
                        key={item.id || `item-${idx}`}
                        className="flex items-start justify-between gap-3 border-t border-[rgba(9,62,6,0.05)] px-4 py-3.5 transition-colors hover:bg-[#FAFCF9]"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-[13.5px] font-semibold text-[#093E06] leading-snug">
                            {item.serviceName}
                          </h3>
                          {item.durationMinutes != null && item.durationMinutes > 0 && (
                            <p className="flex items-center gap-1 text-[11.5px] font-normal text-[#5B6B58]">
                              <Clock className="size-3 text-[#5B6B58]" aria-hidden />
                              <span>
                                {t("mins", { count: item.durationMinutes })}
                              </span>
                            </p>
                          )}
                          {item.packageInfo && (
                            <p className="text-[11.5px] text-[#5B6B58] italic leading-tight">
                              {item.packageInfo}
                            </p>
                          )}
                        </div>
                        {item.originalPrice != null && item.originalPrice > 0 && (
                          <div className="shrink-0 text-right">
                            <span className="block text-[16.5px] font-bold text-[#40813D] leading-none mb-1">
                              {formatPrice(item.originalPrice)}
                            </span>
                            <span className="block text-[11px] font-normal text-[#8C9E89] leading-none">
                              {currency === "VND" ? formatUSD(item.originalPrice) : formatVND(item.originalPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          categoryGroups.map((group, groupIdx) => {
            const groupKey = group.id != null ? String(group.id) : `cat-${groupIdx}`;
            const isGroupOpen = activeGroupKey === groupKey;

            const countText = t("services_count", { count: group.deals.length });

            return (
              <div key={groupKey}>
                <button
                  type="button"
                  onClick={() => toggleGroup(groupKey)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-3.5 text-left transition-colors hover:bg-[#F5F7F4] cursor-pointer",
                    isGroupOpen ? "bg-[#F5F7F4]/60" : "bg-white",
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[14.5px] text-[#093E06]">
                      {getDisplayCategoryTitle(group.title)}
                    </span>
                    <span className="text-[13px] font-normal text-[#5B6B58]">
                      {countText}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-[#5B6B58] transition-transform duration-200",
                      isGroupOpen && "rotate-180",
                    )}
                  />
                </button>

                {isGroupOpen && (
                  <div className="border-t border-[rgba(9,62,6,0.05)] bg-[#FAFBF9]/40">
                    {group.deals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        dictionary={dictionary}
                        locale={locale}
                        isBestDeal={deal.id === bestDealId}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
