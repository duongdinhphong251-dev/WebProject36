"use client";

import { cn } from "@/libs/utils";

/** Đếm ngược flash sale — HH : MM : SS, Figma GlowExplore node 5:1709 (Error/500 + nền #fecdca). */
export function calcCountdownHms(
  endMs: number,
  nowMs: number,
): { expired: boolean; hours: number; minutes: number; seconds: number } {
  const diff = endMs - nowMs;
  if (diff <= 0) {
    return { expired: true, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    expired: false,
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function DigitBlock({ value, compact }: { value: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-destructive px-1 font-semibold text-white",
        compact
          ? "h-[22px] min-w-[26px] text-[10px] md:h-6 md:min-w-[32px] md:text-xs"
          : "h-5 min-w-[26px] text-xs md:h-6 md:min-w-[32px] md:text-sm lg:h-7 lg:min-w-[36px] lg:text-base",
      )}
      suppressHydrationWarning
    >
      {value}
    </span>
  );
}

interface FlashSaleTimeBlocksProps {
  hours: number;
  minutes: number;
  seconds: number;
  /** Nhỏ gọn cho hàng deal (SpaDealItem) */
  compact?: boolean;
}

export function FlashSaleTimeBlocks({
  hours,
  minutes,
  seconds,
  compact,
}: FlashSaleTimeBlocksProps) {
  const sep = (
    <span
      className={cn(
        "font-semibold text-destructive",
        compact
          ? "text-[12px] md:text-[14px]"
          : "text-xs md:text-sm lg:text-base",
      )}
    >
      :
    </span>
  );

  const hStr = hours >= 100 ? String(hours) : pad2(hours);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg px-1 py-0.5",
        compact && "py-px",
      )}
    >
      <DigitBlock value={hStr} compact={compact} />
      {sep}
      <DigitBlock value={pad2(minutes)} compact={compact} />
      {sep}
      <DigitBlock value={pad2(seconds)} compact={compact} />
    </span>
  );
}
