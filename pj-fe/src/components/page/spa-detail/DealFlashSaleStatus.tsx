"use client";

import { useEffect, useState } from "react";
import type { SpaDealDto } from "@/types/api";
import {
  calcCountdownHms,
  FlashSaleTimeBlocks,
} from "@/components/common/FlashSaleTimeBlocks";

interface DealFlashSaleStatusProps {
  deal: SpaDealDto;
  endsInLabel: string;
  flashSaleLabel: string;
}

function getTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function DealFlashSaleStatus({
  deal,
  endsInLabel,
  flashSaleLabel,
}: DealFlashSaleStatusProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!deal.isFlashSale) return null;

  const flashBadge = (
    <span className="shrink-0 rounded-[11px] bg-[#f04438] px-1.5 py-1 text-[10px] font-semibold leading-[1.4] text-white">
      {flashSaleLabel}
    </span>
  );

  if (!mounted || now == null) {
    return flashBadge;
  }

  const startAt = getTimestamp(deal.startAt);
  const endAt = getTimestamp(deal.endAt);

  if (startAt == null || endAt == null) {
    return flashBadge;
  }

  if (now < startAt) {
    return flashBadge;
  }

  if (now >= endAt) return null;

  const { expired, hours, minutes, seconds } = calcCountdownHms(endAt, now);
  if (expired) return null;

  // Chỉ hiện đếm ngược khi còn dưới 24h
  const remainingMs = endAt - now;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  if (remainingMs < TWENTY_FOUR_HOURS_MS) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <span className="whitespace-nowrap text-xs leading-[1.4] text-[#535862]">
          {endsInLabel}
        </span>
        <FlashSaleTimeBlocks hours={hours} minutes={minutes} seconds={seconds} />
      </div>
    );
  }

  // Còn hơn 24h → chỉ hiện badge flash sale
  return (
    <span className="shrink-0 rounded-[11px] bg-[#f04438] px-1.5 py-1 text-[10px] font-semibold leading-[1.4] text-white">
      {flashSaleLabel}
    </span>
  );
}
