import type { LocaleTypes } from "@/i18n/settings";
import { Suspense } from "react";
import { HomeSlotBannersSection } from "@/components/common/banners/HomeSlotBannersSection";

// ─── Components ───────────────────────────────────────────────────────────────
import {
  HeroBannerSkeleton,
} from "./hero-banner/HeroBannerSlider";
import { ServiceCategorySlider } from "./service-categories/ServiceCategorySlider";
import {
  HomeNearbySpasSection,
  HomeNearbySpasSectionSkeleton,
} from "./recommended-spas/HomeNearbySpasSection";


// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage({ locale }: { locale: string }) {
  return (
    <div className="flex w-full flex-col bg-app-bg my-auto">
      <ServiceCategorySlider locale={locale as LocaleTypes} />
      <Suspense fallback={<HeroBannerSkeleton />}>
        <HomeSlotBannersSection locale={locale as LocaleTypes} />
      </Suspense>
      <Suspense fallback={<HomeNearbySpasSectionSkeleton />}>
        <HomeNearbySpasSection locale={locale} />
      </Suspense>
    </div>
  );
}


