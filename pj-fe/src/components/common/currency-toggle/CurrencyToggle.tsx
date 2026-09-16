"use client";

import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { formatVND } from "@/helpers/currency";
import { cn } from "@/libs/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useParams } from "next/navigation";

interface CurrencyToggleProps {
  className?: string;
  size?: "sm" | "md";
  showInfoIcon?: boolean;
  defaultOpen?: boolean;
}

const TOOLTIP_TEXTS = {
  vi: {
    aria: "Thông tin tỷ giá",
    rateLabel: "Tỷ giá tham khảo",
    note: "Giá quy đổi chỉ mang tính tham khảo. Thanh toán thực tế bằng VNĐ.",
  },
  en: {
    aria: "Exchange rate information",
    rateLabel: "Reference rate",
    note: "Converted prices are for reference only. Actual payment is in VND.",
  },
  ko: {
    aria: "환율 정보",
    rateLabel: "참고 환율",
    note: "변환된 가격은 참고용입니다. 실제 결제는 VND로 진행됩니다.",
  },
};

export function CurrencyToggle({
  className,
  size = "md",
  showInfoIcon = true,
  defaultOpen,
}: CurrencyToggleProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const t = TOOLTIP_TEXTS[locale as keyof typeof TOOLTIP_TEXTS] || TOOLTIP_TEXTS.vi;

  const { currency, setCurrency, exchangeRates } = useCurrencyPreference();
  const formattedVndRate = formatVND(exchangeRates.usdToVnd);

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div
        className="inline-flex items-center rounded-[10px] bg-[#DDE4D9] p-[3px]"
        role="group"
        aria-label="Loại tiền tệ hiển thị"
      >
        <button
          type="button"
          onClick={() => setCurrency("VND")}
          className={cn(
            "rounded-[7px] transition-all select-none",
            size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs md:text-sm",
            currency === "VND"
              ? "bg-white text-[#093E06] shadow-sm font-bold"
              : "bg-transparent text-[#5B6B58] font-medium hover:text-[#093E06]",
          )}
        >
          VND
        </button>
        <button
          type="button"
          onClick={() => setCurrency("USD")}
          className={cn(
            "rounded-[7px] transition-all select-none",
            size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs md:text-sm",
            currency === "USD"
              ? "bg-white text-[#093E06] shadow-sm font-bold"
              : "bg-transparent text-[#5B6B58] font-medium hover:text-[#093E06]",
          )}
        >
          USD
        </button>
      </div>

      {showInfoIcon && (
        <Tooltip defaultOpen={defaultOpen} open={defaultOpen !== undefined ? defaultOpen : undefined}>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center p-1 text-[#6b7280] hover:text-[#143423] transition-colors rounded-full focus:outline-none"
              aria-label={t.aria}
            >
              <Info className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[280px] sm:max-w-xs text-center font-medium text-xs p-2.5 bg-[#181d27] text-white dark:bg-[#181d27] dark:text-white border-0 shadow-lg space-y-1 leading-normal"
          >
            <div className="font-semibold text-white">
              {t.rateLabel}: $1 = {formattedVndRate}
            </div>
            <div className="text-[11px] text-[#d5d7da] font-normal leading-snug pt-1 border-t border-white/10">
              {t.note}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
