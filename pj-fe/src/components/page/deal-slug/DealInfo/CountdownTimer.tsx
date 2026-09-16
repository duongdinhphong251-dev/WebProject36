'use client';

import { useState, useEffect } from 'react';
import { calcCountdownHms } from '@/components/common/FlashSaleTimeBlocks';

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

interface CountdownTimerProps {
  endAt?: string | null;
  label: string;
  unitLabels?: { hours: string; minutes: string; seconds: string };
}

export function CountdownTimer({
  endAt,
  unitLabels = { hours: 'giờ', minutes: 'phút', seconds: 'giây' },
}: CountdownTimerProps) {
  const endMs = endAt ? new Date(endAt).getTime() : NaN;
  const validEnd = Number.isFinite(endMs);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    
    if (!validEnd) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [validEnd]);

  if (!validEnd || now === null) return null;
  if (endMs - now >= TWENTY_FOUR_H_MS) return null;

  const parts = calcCountdownHms(endMs, now);
  if (parts.expired) return null;

  return (
    <div className="flex items-center gap-1">
      <TimeBlock value={parts.hours} unit={unitLabels.hours} />
      <Colon />
      <TimeBlock value={parts.minutes} unit={unitLabels.minutes} />
      <Colon />
      <TimeBlock value={parts.seconds} unit={unitLabels.seconds} />
    </div>
  );
}

function TimeBlock({ value, unit }: { value: number; unit: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-sm px-1.5 py-1.5 min-w-[32px]"
      style={{ background: '#d92d20' }}
    >
      <span className="text-[12px] font-semibold text-white leading-none tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[8px] leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {unit}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-[12px] font-semibold pb-2" style={{ color: '#d92d20' }}>
      :
    </span>
  );
}
