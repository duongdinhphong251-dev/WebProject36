"use client";

import type { DealCardDto } from "@/types/api";
import { useEffect, useState } from "react";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { dealPathSegment, dealTrackingSlug } from "@/libs/deal-slug";
import { formatPrice } from "@/helpers/numbers";
import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";

interface YouMayAlsoLikeCardProps {
  deal: DealCardDto;
  locale: string;
}

function useCountdown(endAt: string | null | undefined) {
  const calcRemaining = () => {
    if (!endAt) return null;
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      mm: String(minutes).padStart(2, "0"),
      ss: String(seconds).padStart(2, "0"),
    };
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const id = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  return remaining;
}

function CountdownBadge({ endAt }: { endAt: string | null | undefined }) {
  const remaining = useCountdown(endAt);
  if (!remaining) return null;

  return (
    <div className="flex items-center gap-1">
      <span className="text-[12px] leading-[1.4] text-[#535862]">Ends in</span>
      <div className="flex items-center gap-[2px]">
        <span className="rounded-[6px] bg-[#f04438] px-1 pb-px pt-[2px] text-[12px] font-medium leading-[1.4] text-white">
          {remaining.mm}
        </span>
        <span className="text-[12px] font-semibold text-[#f97066]">:</span>
        <span className="rounded-[6px] bg-[#f04438] px-1 pb-px pt-[2px] text-[12px] font-medium leading-[1.4] text-white">
          {remaining.ss}
        </span>
      </div>
    </div>
  );
}

export function YouMayAlsoLikeCard({ deal, locale }: YouMayAlsoLikeCardProps) {
  const discountPercent = deriveDisplayDiscountPercent({
    discountPercent: deal.discountPercent,
    originalPrice: deal.originalPrice,
    salePrice: deal.salePrice,
  });

  return (
    <TrackedDealLink
      href={`/${locale}/organization_services/${dealPathSegment(deal)}`}
      dealSlug={dealTrackingSlug(deal)}
      className="flex w-full items-end gap-[2px] rounded-[20px] border border-[#d3d8e0] bg-[#fafafa] p-3 transition-opacity hover:opacity-90"
    >
      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title */}
        <p className="line-clamp-2 text-[12px] font-medium leading-[1.4] text-[#0a0d12]">
          {deal.title}
        </p>

        {/* Price + discount row */}
        <div className="flex flex-col gap-0">
          {/* Price row */}
          <div className="flex items-center gap-1">
            {deal.salePrice && (
              <span className="text-[16px] font-semibold leading-[1.5] text-[#d92d20]">
                {formatPrice(deal.salePrice)}
              </span>
            )}
            {deal.originalPrice &&
              deal.salePrice &&
              deal.originalPrice > deal.salePrice && (
                <span className="text-[12px] leading-[1.4] text-[#a4a7ae] line-through">
                  {formatPrice(deal.originalPrice)}
                </span>
              )}
            {discountPercent > 0 && (
              <span className="rounded-[11px] bg-[#fee4e2] px-1 py-[2px] text-[9px] font-semibold leading-[1.4] text-[#d92d20]">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Available time + countdown row */}
          <div className="flex items-center justify-end ">
            <CountdownBadge endAt={deal.endAt} />
          </div>
        </div>
      </div>
    </TrackedDealLink>
  );
}
