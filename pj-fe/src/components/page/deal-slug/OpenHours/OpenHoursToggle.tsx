"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SpaOpeningHourDto } from "@/types/deal-detail";

interface OpenHoursToggleProps {
  hours: SpaOpeningHourDto[];
  title: string;
  notAvailable: string;
  closedLabel: string;
  dayLabels: Record<string, string>;
}

export function OpenHoursToggle({
  hours,
  title,
  notAvailable,
  closedLabel,
  dayLabels,
}: OpenHoursToggleProps) {
  const [open, setOpen] = useState(true);

  if (hours.length === 0) {
    return (
      <div className="mx-4 py-3">
        <p className="text-xs text-gray-400">{notAvailable}</p>
      </div>
    );
  }

  return (
    <div className="mx-4 py-3">
      {/* Header */}
      <button
        className="flex w-full items-center justify-between"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-base font-medium text-gray-950">{title}</span>
        <ChevronDown
          className="h-5 w-5 text-gray-500 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Rows */}
      {open && (
        <ul className="mt-3 space-y-2">
          {hours.map((h) => (
            <li key={h.dayOfWeek} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 capitalize">
                {dayLabels[h.dayOfWeek] ?? h.dayOfWeek}
              </span>
              <span className="text-sm font-medium text-gray-800">
                {h.isClosed ? closedLabel : `${h.openTime} – ${h.closeTime}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
