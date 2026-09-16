"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import type { BannerLocale, BannerResponseDto } from "@/types/api";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { getHomeSlotBanners } from "@/services/api/banners";
import { HomeSlotBannerTile } from "./HomeSlotBannerTile";

interface HeroBannerSliderProps {
  banners: BannerResponseDto[];
  locale?: string;
}

export function HeroBannerSlider({ banners: initialBanners, locale }: HeroBannerSliderProps) {
  const coords = useLocationStore((s) => s.coords);
  const [banners, setBanners] = useState(initialBanners);

  useEffect(() => {
    if (coords?.latitude && coords?.longitude) {
      getHomeSlotBanners((locale as BannerLocale) ?? 'vi', coords.latitude, coords.longitude)
        .then((newBanners) => {
          if (newBanners.length > 0) {
            setBanners(newBanners);
          }
        })
        .catch(console.error);
    }
  }, [coords, locale]);

  const visibleBanners = banners.filter((banner) => (
    banner.isEnabled
    && Boolean(banner.imageUrl?.trim())
    && Boolean(banner.targetUrl?.trim())
  )).slice(0, 8);

  const [hiddenCount, setHiddenCount] = useState(0);

  if (!visibleBanners.length || hiddenCount >= visibleBanners.length) return null;

  function resolveImageUrl(imageUrl: string): string {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    const apiBase = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';
    return `${apiBase}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  }

  return (
    <section className="w-full py-[10px] md:py-5">
      <Container maxWidth="2xl" disableGutters className="px-[14px] md:px-4 lg:px-[20px]">
        <div className="grid grid-cols-4 gap-[7px] sm:gap-2.5 md:gap-3 lg:gap-[14px]">
          {visibleBanners.map((banner, index) => {
            const href = banner.targetUrl.startsWith('http')
              ? banner.targetUrl
              : `/${locale ?? 'vi'}${banner.targetUrl.startsWith('/') ? banner.targetUrl : `/${banner.targetUrl}`}`;

            return (
              <HomeSlotBannerTile
                key={banner.id}
                href={href}
                imageUrl={resolveImageUrl(banner.imageUrl)}
                gaClickTag={banner.gaClickTag}
                bannerName={banner.name}
                index={index + 1}
                onHide={() => setHiddenCount(c => c + 1)}
              />
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function HeroBannerSkeleton() {
  return (
    <section className="w-full py-[10px] md:py-5">
      <Container maxWidth="2xl" disableGutters className="px-[14px] md:px-4 lg:px-[20px]">
        <div className="grid grid-cols-4 gap-[7px] sm:gap-2.5 md:gap-3 lg:gap-[14px]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-[16px] md:rounded-2xl bg-brand-100/50" />
          ))}
        </div>
      </Container>
    </section>
  );
}
