"use client";

import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";

interface DealPriceDisplayProps {
  salePrice?: number | null;
  originalPrice?: number | null;
  discountPercent?: number;
  salePriceColorClass?: string;
}

export function DealPriceDisplay({
  salePrice,
  originalPrice,
  discountPercent = 0,
  salePriceColorClass = "text-[#5B7A4F]",
}: DealPriceDisplayProps) {
  const { currency, formatPrice, formatVND, formatUSD } = useCurrencyPreference();

  const showOriginalPrice =
    originalPrice != null &&
    (salePrice == null || originalPrice !== salePrice);

  const getSecondaryPrice = (amount: number | null | undefined) => {
    if (amount == null || amount <= 0) return null;
    if (currency === "VND") {
      const usdStr = formatUSD(amount);
      return usdStr ? `~${usdStr}` : null;
    }
    const vndStr = formatVND(amount);
    return vndStr ? `~${vndStr}` : null;
  };

  const secondarySalePrice = getSecondaryPrice(salePrice);

  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-center gap-2">
        {salePrice != null && (
          <p className={`text-base font-semibold leading-[1.5] ${salePriceColorClass}`}>
            {formatPrice(salePrice)}
          </p>
        )}
        {showOriginalPrice && (
          <p className="text-xs leading-[1.4] text-[#a4a7ae] line-through">
            {formatPrice(originalPrice)}
          </p>
        )}
        {discountPercent > 0 && (
          <div className="rounded-[11px] bg-[#fee4e2] px-1 py-0.5">
            <p className="text-[10px] font-semibold leading-[1.4] text-[#d92d20]">
              -{discountPercent}%
            </p>
          </div>
        )}
      </div>

      {secondarySalePrice && (
        <p className="text-[11px] font-normal text-[#717680]">
          {secondarySalePrice}
        </p>
      )}
    </div>
  );
}
