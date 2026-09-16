import { getHomeSlotBanners } from "@/services/api/banners";
import { HeroBannerSlider } from "@/components/home-page/hero-banner/HeroBannerSlider";
import type { LocaleTypes } from "@/i18n/settings";

import { getServerLocation } from "@/libs/server-location";

interface HomeSlotBannersSectionProps {
  locale: LocaleTypes;
}

export async function HomeSlotBannersSection({
  locale,
}: HomeSlotBannersSectionProps) {
  try {
    const coords = await getServerLocation();
    const banners = await getHomeSlotBanners(locale, coords?.lat, coords?.lng);
    return <HeroBannerSlider banners={banners} locale={locale} />;
  } catch (error) {
    console.error("Home slot banners fetch failed:", error);
    return null;
  }
}
