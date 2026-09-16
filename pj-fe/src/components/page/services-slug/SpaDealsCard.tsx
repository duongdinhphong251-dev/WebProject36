"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { Star, Eye } from "lucide-react";
import { memo, useState, useEffect } from "react";
import type { SpaBasicDto, DealCardDto } from "@/types/api";
import CustomLink from "@/components/common/link";
import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";
import { dealTrackingSlug } from "@/libs/deal-slug";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { getOpeningStatus, type OpeningStatus } from "@/libs/opening-hours";
import { formatDistanceKm } from "@/libs/distance-formatter";
import useTranslate from "@/hooks/useTranslate";
import {
  resolveSpaListingImageSrc,
  shouldBypassNextImageOptimization,
} from "@/libs/spa-image-url";
import { useLocationStore } from "@/stores/location/useLocationStore";
import { calculateDistanceKm } from "@/libs/geo-distance";

const FALLBACK_SPA_THUMBNAIL = "/assets/images/common/logo_x.png";

interface SpaDealsCardProps {
  spa: SpaBasicDto;
  deals: DealCardDto[];
  sharedCountdownEndAt?: string | null;
  /** Pass true for the first above-fold cards to preload the thumbnail (LCP fix) */
  priority?: boolean;
}

function findBestDiscountDeal(deals: DealCardDto[]): DealCardDto | null {
  if (!deals || deals.length === 0) return null;
  let bestDeal = deals[0]!;
  let maxPercent = deriveDisplayDiscountPercent({
    discountPercent: bestDeal.discountPercent,
    originalPrice: bestDeal.originalPrice,
    salePrice: bestDeal.salePrice,
  });

  for (let i = 1; i < deals.length; i++) {
    const currentDeal = deals[i]!;
    const percent = deriveDisplayDiscountPercent({
      discountPercent: currentDeal.discountPercent,
      originalPrice: currentDeal.originalPrice,
      salePrice: currentDeal.salePrice,
    });
    if (percent > maxPercent) {
      maxPercent = percent;
      bestDeal = currentDeal;
    }
  }

  return bestDeal;
}

function SpaThumb({
  photoName,
  spaAvatarUrl,
  name,
  priority,
}: {
  photoName?: string | null;
  spaAvatarUrl?: string | null;
  name: string;
  priority?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const src = !errored
    ? resolveSpaListingImageSrc({ spaAvatarUrl, photoName })
    : null;

  if (src) {
    return (
      <div className="relative h-[80px] w-[80px] shrink-0 rounded-[14px] overflow-hidden bg-[#EAF2E8] border border-gray-100/80">
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="80px"
          quality={80}
          unoptimized={shouldBypassNextImageOptimization(src)}
          onError={() => setErrored(true)}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }

  return (
    <div className="relative h-[80px] w-[80px] shrink-0 rounded-[14px] overflow-hidden bg-[#EAF2E8] border border-gray-100/80 flex items-center justify-center">
      <div className="relative w-10 h-10">
        <Image
          src={FALLBACK_SPA_THUMBNAIL}
          alt={name}
          fill
          className="object-contain"
          sizes="40px"
        />
      </div>
    </div>
  );
}

// Memoize card component for performance optimizations (Rule 5.2)
export const SpaDealsCard = memo(function SpaDealsCard({
  spa,
  deals,
  priority = false,
}: SpaDealsCardProps) {
  const t = useTranslate("filter");
  const params = useParams();
  const currentServiceSlug = params?.serviceSlug as string;
  const { formatPrice } = useCurrencyPreference();

  const [openingStatus, setOpeningStatus] = useState<OpeningStatus | null>(null);

  useEffect(() => {
    const tOpening = (key: string, options?: any): string => {
      if (key === "is_open_now" || key === "opening_is_open_now") {
        const res = t("opening_is_open_now") || t("is_open_now");
        return typeof res === "string" ? res : "Đang mở";
      }
      const res = t(key, options);
      return typeof res === "string" ? res : String(res ?? key);
    };
    setOpeningStatus(getOpeningStatus(spa.openingHours, tOpening));
  }, [spa.openingHours, t]);

  const bestDeal = findBestDiscountDeal(deals);
  const discountPercent = bestDeal
    ? deriveDisplayDiscountPercent({
        discountPercent: bestDeal.discountPercent,
        originalPrice: bestDeal.originalPrice,
        salePrice: bestDeal.salePrice,
      })
    : 0;

  const userCoords = useLocationStore((s) => s.coords);
  
  let displayDistance = spa.distanceKm;
  if (displayDistance == null && userCoords && spa.lat != null && spa.lng != null) {
    displayDistance = calculateDistanceKm(userCoords.latitude, userCoords.longitude, spa.lat, spa.lng);
  }

  const spaHref = currentServiceSlug
    ? `/provider/${spa.slug}?ref_service=${currentServiceSlug}`
    : `/provider/${spa.slug}`;

  const bestDealHref = bestDeal
    ? (currentServiceSlug
        ? `/provider/${spa.slug}?ref_service=${currentServiceSlug}`
        : `/provider/${spa.slug}`)
    : spaHref;

  const extraCount = deals.length - 1;

  return (
    <div className="relative w-full rounded-2xl bg-white border border-[#EAF2E8] p-3.5 shadow-[0_1px_3px_rgba(9,62,6,0.07)] flex flex-col gap-3">
      {/* Top Section: Spa Info */}
      <CustomLink
        href={spaHref}
        className="flex items-start gap-3 w-full hover:opacity-90 transition-opacity"
      >
        {/* Thumbnail */}
        <SpaThumb
          photoName={spa.photoName}
          spaAvatarUrl={spa.spaAvatarUrl}
          name={spa.name}
          priority={priority}
        />

        {/* Spa details */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
          <h2 className="font-bold text-[15px] leading-snug text-[#093E06] line-clamp-2">
            {spa.name}
          </h2>

          {/* Rating, Views & Distance */}
          <div className="flex items-center gap-1.5 text-[12.5px] leading-none text-[#5B6B58] flex-wrap">
            <div className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-[#F5B816] text-[#F5B816] shrink-0" />
              <b className="font-semibold text-[#093E06]">
                {spa.ratingValue ? Number(spa.ratingValue || 0).toFixed(1) : "0.0"}
              </b>
            </div>

            <span className="text-[#9BA898]">|</span>

            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#5B6B58] shrink-0" />
              <span>
                {spa.viewCount ? spa.viewCount.toLocaleString("vi-VN") : "0"}
              </span>
            </div>

            {displayDistance != null && displayDistance >= 0 && (
              <>
                <span className="text-[#9BA898]">·</span>
                <span>{formatDistanceKm(displayDistance)}</span>
              </>
            )}
          </div>

          {/* Opening hours status */}
          {openingStatus && (
            <div className="flex items-center gap-1.5 text-[12px] leading-none font-medium mt-0.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  openingStatus.isOpen ? "bg-[#40813D]" : "bg-[#E0A82E]"
                }`}
              />
              <span
                className={
                  openingStatus.isOpen ? "text-[#093E06]" : "text-[#5B6B58]"
                }
              >
                {openingStatus.text}
              </span>
              {openingStatus.openSub && (
                <span className="text-[#5B6B58] font-normal">
                  · {openingStatus.openSub}
                </span>
              )}
            </div>
          )}
        </div>
      </CustomLink>

      {/* Bottom Section: Featured Deal Box (Mockup 1b) */}
      {bestDeal && (
        <div className="bg-[#EAF2E8] rounded-[14px] p-3 flex items-center justify-between gap-2.5">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="font-medium text-[13px] leading-tight text-[#093E06] line-clamp-1">
              {bestDeal.title}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {bestDeal.salePrice && (
                <span className="font-bold text-[15px] leading-none text-[#093E06]">
                  {formatPrice(bestDeal.salePrice)}
                </span>
              )}
              {bestDeal.originalPrice &&
                bestDeal.salePrice &&
                bestDeal.originalPrice > bestDeal.salePrice && (
                  <span className="text-[12px] leading-none text-[#8C9E89] line-through">
                    {formatPrice(bestDeal.originalPrice)}
                  </span>
                )}
              {discountPercent > 0 && (
                <span className="font-semibold text-[11px] leading-none text-[#E15241]">
                  -{discountPercent}%
                </span>
              )}
            </div>
          </div>

          <TrackedDealLink
            href={bestDealHref}
            dealSlug={dealTrackingSlug(bestDeal)}
            className="bg-[#40813D] hover:bg-[#346a32] text-white font-medium text-[12.5px] px-3.5 py-2 rounded-[9px] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {t("view_deal") || "Xem ưu đãi"}
          </TrackedDealLink>
        </div>
      )}

      {/* Extra deals link if > 1 */}
      {extraCount > 0 && (
        <div className="flex justify-center pt-0.5">
          <CustomLink
            href={spaHref}
            className="text-[12px] font-medium text-[#40813D] hover:underline"
          >
            {t("view_more_deals", { count: extraCount }) || `Xem thêm ${extraCount} ưu đãi khác →`}
          </CustomLink>
        </div>
      )}
    </div>
  );
});


