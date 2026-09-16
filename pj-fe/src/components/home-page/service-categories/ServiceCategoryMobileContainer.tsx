"use client";
import type { LocaleTypes } from "@/i18n/settings";
import { MAIN_SERVICE_GROUPS } from "@/constants/services";
import { ServiceCategoryItem } from "./ServiceCategoryItem";

interface Props {
  locale: LocaleTypes;
}

export function ServiceCategoryMobileContainer({ locale }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full">
      {MAIN_SERVICE_GROUPS.map((key, index) => (
        <ServiceCategoryItem key={key} serviceKey={key} locale={locale} priority={index < 4} variant="vertical" />
      ))}
    </div>
  );
}
