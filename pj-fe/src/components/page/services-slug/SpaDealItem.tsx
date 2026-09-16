"use client";

import type { DealCardDto } from "@/types/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useTranslate from "@/hooks/useTranslate";
import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";
import { dealTrackingSlug } from "@/libs/deal-slug";
import {
  calcCountdownHms,
  FlashSaleTimeBlocks,
} from "@/components/common/FlashSaleTimeBlocks";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";

import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";

interface SpaDealItemProps {
  deal: DealCardDto;
  isLast?: boolean;
  /** Kết thúc khung flash (windowEndsAt từ API) — bắt buộc cho countdown; không dùng deal.endAt. */
  sharedCountdownEndAt?: string | null;
  variant?: "list" | "card";
}

function getDiscountPercent(deal: DealCardDto): number {
  return deriveDisplayDiscountPercent({
    discountPercent: deal.discountPercent,
    originalPrice: deal.originalPrice,
    salePrice: deal.salePrice,
  });
}

export function SpaDealItem({
  deal,
  isLast,
  sharedCountdownEndAt,
  variant = "list",
}: SpaDealItemProps) {
  const t = useTranslate("services-slug");
  const { formatPrice: formatCurrencyPrice } = useCurrencyPreference();
  const discountPercent = getDiscountPercent(deal);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let countdownParts: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null = null;
  const countdownEnd = sharedCountdownEndAt ?? null;
  if (now && countdownEnd) {
    const endMs = new Date(countdownEnd).getTime();
    const parts = calcCountdownHms(endMs, now);
    if (!parts.expired) {
      countdownParts = {
        hours: parts.hours,
        minutes: parts.minutes,
        seconds: parts.seconds,
      };
    }
  }

  const params = useParams();
  const serviceSlug = params?.serviceSlug as string | undefined;
  const spaHref = serviceSlug
    ? `/provider/${deal.spa.slug}?ref_service=${serviceSlug}`
    : `/provider/${deal.spa.slug}`;

  const isCard = variant === "card";

  return (
    <TrackedDealLink
      href={spaHref}
      dealSlug={dealTrackingSlug(deal)}
      className={`flex flex-col transition-colors ${
        isCard
          ? "bg-white rounded-xl border border-[#DDE4D9] p-[14px] hover:border-[#40813D]"
          : "hover:bg-gray-50"
      }`}
    >
      <div className={`flex items-start justify-between gap-2 md:gap-3 relative ${isCard ? "" : "py-3 md:py-4 px-2"}`}>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-[14px] font-medium text-[#093E06] line-clamp-2 break-words whitespace-normal mb-1.5 leading-[1.4]">
            {deal.title}
          </p>

          {(deal as any).shortDescription && (
            <p className="text-[12px] font-normal text-[#5B6B58] line-clamp-1 mb-1.5 leading-[1.4]">
              {(deal as any).shortDescription}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {deal.salePrice && (
              <span className="text-[17px] font-semibold text-[#40813D] leading-none">
                {formatCurrencyPrice(deal.salePrice)}
              </span>
            )}
            {deal.originalPrice &&
              deal.salePrice &&
              deal.originalPrice > deal.salePrice && (
                <span className="text-[12px] font-normal text-[#5B6B58] line-through leading-none">
                  {formatCurrencyPrice(deal.originalPrice)}
                </span>
              )}
            {discountPercent > 0 && (
              <span className="text-[11px] font-semibold text-[#b42318] bg-[#fee4e2] px-2 py-0.5 rounded-full leading-none">
                -{discountPercent}%
              </span>
            )}
          </div>

          {deal.isFlashSale && countdownParts && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 md:mt-2.5">
              <span className="text-[12px] md:text-[14px] font-normal text-[#535862]">
                {t("ends_in")}
              </span>
              <FlashSaleTimeBlocks
                hours={countdownParts.hours}
                minutes={countdownParts.minutes}
                seconds={countdownParts.seconds}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {!isLast && !isCard && <div className="h-px bg-[#e9eaeb] w-full" />}
    </TrackedDealLink>
  );
}
