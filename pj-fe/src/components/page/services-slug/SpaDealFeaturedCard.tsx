"use client";

import { useEffect, useState, memo } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Star, Eye } from "lucide-react";
import type { SpaBasicDto, DealCardDto } from "@/types/api";
import { SaveSpaButton } from "@/components/common/save-spa-button/SaveSpaButton";
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

interface SpaDealFeaturedCardProps {
  spa: SpaBasicDto;
  deals: DealCardDto[];
  sharedCountdownEndAt?: string | null;
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

export const SpaDealFeaturedCard = memo(function SpaDealFeaturedCard({
  spa,
  deals,
  priority = false,
}: SpaDealFeaturedCardProps) {
  const t = useTranslate("filter");
  const params = useParams();
  const currentServiceSlug = params?.serviceSlug as string | undefined;
  const { formatPrice } = useCurrencyPreference();

  const [openingStatus, setOpeningStatus] = useState<OpeningStatus | null>(null);
  const [imgErrored, setImgErrored] = useState(false);

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
  if (!bestDeal) {
    return null;
  }

  const discountPercent = deriveDisplayDiscountPercent({
    discountPercent: bestDeal.discountPercent,
    originalPrice: bestDeal.originalPrice,
    salePrice: bestDeal.salePrice,
  });

  const userCoords = useLocationStore((s) => s.coords);
  
  let displayDistance = spa.distanceKm;
  if (displayDistance == null && userCoords && spa.lat != null && spa.lng != null) {
    displayDistance = calculateDistanceKm(userCoords.latitude, userCoords.longitude, spa.lat, spa.lng);
  }

  const imgSrc = !imgErrored
    ? resolveSpaListingImageSrc({
        spaAvatarUrl: spa.spaAvatarUrl,
        photoName: spa.photoName,
      })
    : null;

  const spaHref = currentServiceSlug
    ? `/provider/${spa.slug}?ref_service=${currentServiceSlug}`
    : `/provider/${spa.slug}`;

  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(9,62,6,0.07)] flex flex-col border border-gray-100">
      <CustomLink href={spaHref} className="flex flex-col flex-1 hover:opacity-95 transition-opacity">
        {/* Vùng ảnh 140px + Save Button */}
        <div className="relative h-[140px] w-full bg-[#e0e0e0] shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={spa.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={80}
            unoptimized={shouldBypassNextImageOptimization(imgSrc)}
            onError={() => setImgErrored(true)}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-50">
            <div className="relative w-16 h-16">
              <Image
                src={FALLBACK_SPA_THUMBNAIL}
                alt={spa.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 z-10">
          <SaveSpaButton spaId={spa.slug || spa.id} />
        </div>
      </div>

      {/* Nội dung Card */}
      <div className="px-[13px] pt-[13px] flex w-full flex-col gap-[9px] flex-1">
        {/* Tên Spa */}
        <h3 className="font-semibold text-[15px] leading-[1.35] text-[#093E06] truncate">
          {spa.name}
        </h3>

        {/* Rating | Lượt xem · Khoảng cách */}
        <div className="flex items-center gap-1.5 font-normal text-[12.5px] leading-none text-[#5B6B58] flex-wrap">
          <div className="flex items-center gap-0.5">
            <Star className="w-[13px] h-[13px] fill-[#F5B816] text-[#F5B816] shrink-0" />
            <b className="font-semibold text-[#093E06]">
              {spa.ratingValue ? Number(spa.ratingValue || 0).toFixed(1) : "0.0"}
            </b>
          </div>

          <span className="text-[#9BA898]">|</span>

          <div className="flex items-center gap-1">
            <Eye className="w-[13px] h-[13px] text-[#5B6B58] shrink-0" />
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

        {/* Trạng thái giờ mở cửa */}
        {openingStatus && (
          <div className="flex items-center gap-1.5 font-medium text-[12.5px] leading-none">
            <span
              className={
                openingStatus.isOpen
                  ? "text-[#27AE60] flex items-center gap-1"
                  : "text-[#5B6B58] flex items-center gap-1"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${
                  openingStatus.isOpen ? "bg-[#27AE60]" : "bg-[#E0A82E]"
                }`}
              />
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

      <div className="px-[13px] pb-[13px] mt-auto">
        {/* Box ưu đãi nổi bật */}
        <div className="mt-3 bg-[#DDE4D9] rounded-[12px] p-[11px] flex flex-col gap-2">
          <span className="font-medium text-[12.5px] leading-[1.35] text-[#093E06] truncate">
            {bestDeal.title}
          </span>

          <div className="flex items-center gap-2">
            {bestDeal.salePrice && (
              <span className="font-bold text-[16px] leading-none text-[#093E06]">
                {formatPrice(bestDeal.salePrice)}
              </span>
            )}
            {bestDeal.originalPrice &&
              bestDeal.salePrice &&
              bestDeal.originalPrice > bestDeal.salePrice && (
                <span className="font-normal text-[12px] leading-none text-[#5B6B58] line-through">
                  {formatPrice(bestDeal.originalPrice)}
                </span>
              )}
            {discountPercent > 0 && (
              <span className="font-semibold text-[11px] leading-none text-[#C0392B] bg-[#FCEDEA] px-1.5 py-1 rounded-[5px]">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Nút CTA Xem ưu đãi */}
          <TrackedDealLink
            href={spaHref}
            dealSlug={dealTrackingSlug(bestDeal)}
            className="h-[40px] rounded-[10px] bg-[#40813D] text-white flex items-center justify-center font-semibold text-[13px] leading-none cursor-pointer hover:bg-[#356d32] transition-colors mt-1"
          >
            {t("view_deal") || "Xem ưu đãi"}
          </TrackedDealLink>
        </div>
      </div>
    </div>
  );
});
