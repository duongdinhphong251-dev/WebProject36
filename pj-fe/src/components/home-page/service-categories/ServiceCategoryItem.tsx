"use client";

import type { LocaleTypes } from "@/i18n/settings";
import type { ServiceKey } from "@/constants/services";
import { getServiceUrl } from "@/constants/services";
import { useTranslation } from "@/i18n/client";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MassageIcon,
  NailsIcon,
  DentalIcon,
  RestaurantIcon,
  TravelIcon,
  SportsIcon,
  HotelResortIcon,
  OtherBrandsIcon,
} from "@/components/icons/services";

type IconComponent = React.FC<{
  size?: number;
  className?: string;
  color?: string;
}>;

export const SERVICE_ICON_MAP: Record<ServiceKey, IconComponent> = {
  // Main 8 group hubs
  "massage-spa": MassageIcon,
  "beauty-hair": NailsIcon,
  "food-drink": RestaurantIcon,
  tours: TravelIcon,
  transport: SportsIcon,
  stay: HotelResortIcon,
  health: DentalIcon,
  essentials: OtherBrandsIcon,
};

export const SERVICE_IMAGE_MAP: Partial<Record<ServiceKey, string>> = {
  "food-drink": "/assets/category/an-uong.png",
  "transport": "/assets/category/di-chuyen.png",
  "beauty-hair": "/assets/category/lam-dep.png",
  "stay": "/assets/category/luu-tru.png",
  "massage-spa": "/assets/category/massage-spa.png",
  "health": "/assets/category/suc-khoe-y-te.png",
  "essentials": "/assets/category/tien-ich-du-lich.png",
  "tours": "/assets/category/tour-trai-nghiem.png",
};

// These icons were originally 128x128 with a lot of padding.
// We apply a scale transform so they match the visual size of normal icons.
const ICONS_128 = new Set<ServiceKey>([
  "food-drink",
  "tours",
  "transport",
  "stay",
  "essentials",
]);

export function ServiceCategoryItem({
  serviceKey,
  locale,
  priority = false,
  variant = "horizontal",
}: {
  serviceKey: ServiceKey;
  locale: LocaleTypes;
  priority?: boolean;
  variant?: "horizontal" | "vertical";
}) {
  const { selectedCity, isHydrated } = useLocationStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const href = mounted && isHydrated
    ? getServiceUrl(serviceKey, locale, selectedCity?.slug)
    : getServiceUrl(serviceKey, locale);
    
  const IconComponent = SERVICE_ICON_MAP[serviceKey];
  const imagePath = SERVICE_IMAGE_MAP[serviceKey];
  const { t } = useTranslation(locale, "home");

  const label = t(`home.services.${serviceKey}`);
  const groupTitle = t(`home.service_groups.${serviceKey}.title`, label);
  const subServices = t(`home.service_groups.${serviceKey}.sub_services`, "");
  const extraCount = t(`home.service_groups.${serviceKey}.extra_count`, "");

  const isGroup = subServices && !subServices.startsWith("home.");
  const title = isGroup ? groupTitle : label;
  const is128 = ICONS_128.has(serviceKey);

  if (variant === "vertical") {
    return (
      <Link
        prefetch
        href={href}
        className="group flex flex-col items-center justify-between rounded-[16px] sm:rounded-2xl border border-[#DDE4D9]/70 bg-white pt-[9px] sm:pt-[10px] pb-[7px] sm:pb-[9px] px-[4px] shadow-xs transition-all duration-200 hover:shadow-md active:scale-[0.98] w-full aspect-[81/100]"
      >
        <div
          className="flex w-[70%] max-w-[58px] aspect-square shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 overflow-hidden"
          style={imagePath ? undefined : { backgroundColor: "#F2F5F1" }}
        >
          {imagePath ? (
            <div className="relative w-full h-full">
              <Image
                src={imagePath}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 360px) 48px, 58px"
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                loading={priority ? "eager" : "lazy"}
              />
            </div>
          ) : (
            <IconComponent
              size={26}
              color="var(--brand-500)"
              aria-label={title}
              className={`w-[65%] h-[65%] ${is128 ? "scale-[1.3]" : ""}`}
            />
          )}
        </div>
        <div className="flex flex-1 items-center justify-center w-full px-0.5 mt-1">
          <span className="text-[10.5px] sm:text-[11.5px] font-semibold leading-[1.22] text-[#093E06] text-center line-clamp-2 transition-colors group-hover:text-[#5B7A4F] w-full">
            {title}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      prefetch
      href={href}
      className="group flex flex-row items-center gap-3 sm:gap-3.5 rounded-xl md:rounded-2xl border border-[#DDE4D9]/70 bg-white p-3 sm:p-3.5 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#C6D0C2] active:translate-y-0 w-full"
    >
      <div
        className="flex w-[52px] sm:w-[58px] aspect-square shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 overflow-hidden"
        style={imagePath ? undefined : { backgroundColor: "#F2F5F1" }}
      >
        {imagePath ? (
          <div className="relative w-full h-full">
            <Image
              src={imagePath}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 52px, 58px"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          </div>
        ) : (
          <IconComponent
            size={32}
            color="var(--brand-500)"
            aria-label={title}
            className={`w-[65%] h-[65%] ${is128 ? "scale-[1.3]" : ""}`}
          />
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1 py-0.5">
        <span className="truncate text-[14px] sm:text-[15px] font-semibold leading-tight text-[#093E06] transition-colors group-hover:text-[#5B7A4F]">
          {title}
        </span>
        {isGroup && (
          <div className="mt-1 text-[11px] sm:text-[11.5px] leading-snug text-[#5B6B58] line-clamp-2">
            <span>{subServices}</span>
            {extraCount && !extraCount.startsWith("home.") && (
              <span className="ml-1 inline-block font-semibold text-[#093E06]">
                {extraCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
