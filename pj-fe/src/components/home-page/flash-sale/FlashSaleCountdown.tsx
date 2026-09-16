'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { calcCountdownHms, FlashSaleTimeBlocks } from '@/components/common/FlashSaleTimeBlocks';

interface FlashSaleCountdownProps {
  targetDate: Date;
  /** Gọi 1 lần khi hết giờ — ví dụ `router.refresh()` để load cửa hàng / khung mới */
  onExpired?: () => void;
}

/** Client: đếm ngược HH:MM:SS — đồng bộ Figma 5:1709 (màu destructive + nền #fecdca). */
export function FlashSaleCountdown({ targetDate, onExpired }: FlashSaleCountdownProps) {
  const endMs = targetDate.getTime();
  const firedRef = useRef(false);

  const [parts, setParts] = useState(() =>
    calcCountdownHms(endMs, Date.now()),
  );

  const tick = useCallback(() => {
    setParts(calcCountdownHms(endMs, Date.now()));
  }, [endMs]);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  useEffect(() => {
    if (parts.expired && onExpired && !firedRef.current) {
      firedRef.current = true;
      onExpired();
    }
  }, [parts.expired, onExpired]);

  if (parts.expired) {
    return (
      <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
        Đã kết thúc
      </span>
    );
  }

  return (
    <FlashSaleTimeBlocks
      hours={parts.hours}
      minutes={parts.minutes}
      seconds={parts.seconds}
    />
  );
}
