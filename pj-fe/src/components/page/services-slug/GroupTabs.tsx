"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/libs/utils";
import {
  MAIN_SERVICE_GROUPS,
  getServiceUrl,
  resolveServiceKey,
} from "@/constants/services";
import type { LocaleTypes } from "@/i18n/settings";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { useEffect, useState } from "react";

interface GroupTabsProps {
  locale: string;
  labels: Record<string, string>;
  currentCitySlug?: string | null;
}

export function GroupTabs({ locale, labels, currentCitySlug }: GroupTabsProps) {
  const params = useParams();
  const currentSlug = params?.serviceSlug as string;
  const currentLocale = (locale as LocaleTypes) || "vi";
  const currentServiceKey = resolveServiceKey(currentSlug, currentLocale) || "massage-spa";

  const { selectedCity, isHydrated } = useLocationStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const effectiveCitySlug = currentCitySlug ?? (mounted && isHydrated ? selectedCity?.slug : null);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
      {MAIN_SERVICE_GROUPS.map((groupKey) => {
        const isActive = groupKey === currentServiceKey;
        const label = labels[groupKey] ?? groupKey;
        const href = getServiceUrl(groupKey, currentLocale, effectiveCitySlug);

        return (
          <Link
            key={groupKey}
            href={href}
            className={cn(
              "flex-none rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-[#40813D] text-white"
                : "border border-[#DDE4D9] bg-white text-[#181d27] hover:bg-[#F5F7F4]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
