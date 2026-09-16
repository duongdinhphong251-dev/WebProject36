"use client";

import { cn } from "@/libs/utils";
import type { OpeningPeriodDto } from "@/types/api";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import { useEffect, useState } from "react";

interface OpeningHoursToggleProps {
  openingHours: OpeningPeriodDto[];
  dayLabels: string[];
  closedLabel: string;
  openHoursLabel: string;
  todayLabel: string;
}

/** Thứ tự 7 ngày hiển thị chuẩn trong tuần (Thứ Hai -> Chủ Nhật) */
const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * Helper duy nhất kiểm tra 1 ngày/period có bị coi là đóng cửa hay không.
 * Đóng cửa khi:
 * (a) Không tồn tại dữ liệu cho ngày này (undefined / null / missing)
 * (b) Thiếu openTime / closeTime hoặc openTime === closeTime === "00:00"
 */
export function isClosedPeriod(entry?: OpeningPeriodDto | null): boolean {
  if (!entry) return true;
  if (!entry.openTime || !entry.closeTime) return true;
  const open = entry.openTime.trim();
  const close = entry.closeTime.trim();
  if (open === "" || close === "") return true;
  if (open === "00:00" && close === "00:00") return true;
  return false;
}

/**
 * Xây dựng mảng 7 ngày chuẩn (Thứ 2 -> Chủ Nhật) đã xử lý đầy đủ logic mở/đóng cửa
 */
export function buildWeeklySchedule(
  openingHours: OpeningPeriodDto[] = [],
  dayLabels: string[],
  closedLabel: string,
  todayDay: number,
) {
  // Dedupe & map ngày -> OpeningPeriodDto hợp lệ nhất
  const dayMap = new Map<number, OpeningPeriodDto>();
  for (const entry of openingHours) {
    if (entry && typeof entry.day === "number") {
      const existing = dayMap.get(entry.day);
      if (!existing || isClosedPeriod(existing)) {
        dayMap.set(entry.day, entry);
      }
    }
  }

  return DAYS_ORDER.map((dayIndex) => {
    const entry = dayMap.get(dayIndex);
    const closed = isClosedPeriod(entry);
    const isToday = dayIndex === todayDay;

    const timeText = closed
      ? closedLabel
      : `${entry!.openTime} – ${entry!.closeTime}`;

    const dayName = dayLabels[dayIndex] ?? (dayIndex === 0 ? "Chủ Nhật" : `Thứ ${dayIndex + 1}`);

    return {
      day: dayIndex,
      dayName,
      isToday,
      isClosed: closed,
      timeText,
    };
  });
}

export function OpeningHoursToggle({
  openingHours,
  dayLabels,
  closedLabel,
  openHoursLabel,
  todayLabel,
}: OpeningHoursToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const [todayDay, setTodayDay] = useState<number | null>(null);

  useEffect(() => {
    setTodayDay(new Date().getDay());
  }, []);

  const schedule =
    todayDay !== null
      ? buildWeeklySchedule(openingHours, dayLabels, closedLabel, todayDay)
      : buildWeeklySchedule(openingHours, dayLabels, closedLabel, -1);

  const todayItem =
    todayDay !== null ? schedule.find((item) => item.isToday) : null;

  return (
    <div>
      {/* Clickable header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left focus:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-[#0a0d12]">
            {openHoursLabel}
          </span>
          {/* Summary text khi thu gọn */}
          {!expanded && todayItem && (
            <span
              className={cn(
                "text-xs font-medium",
                todayItem.isClosed ? "text-[#f04438]" : "text-[#4A6340]",
              )}
            >
              · {todayItem.timeText}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="size-4 shrink-0 text-[#a4a7ae]" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-[#a4a7ae]" />
        )}
      </button>

      {/* Expanded 7-day schedule table */}
      {expanded && (
        <div className="mt-3 space-y-1">
          {schedule.map((item) => (
            <div
              key={item.day}
              className={cn(
                "flex items-center justify-between rounded-xl px-2.5 py-2 text-sm transition-colors",
                item.isToday
                  ? "bg-[#F2F5F1] font-semibold text-[#4A6340]"
                  : "text-[#414651] hover:bg-gray-50/50",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn(item.isToday ? "text-[#4A6340] font-semibold" : "text-[#414651]")}>
                  {item.dayName}
                </span>
                {item.isToday && (
                  <span className="rounded-md bg-[#5B7A4F]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#5B7A4F]">
                    {todayLabel}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-medium",
                  item.isClosed
                    ? "text-[#f04438]"
                    : item.isToday
                      ? "text-[#4A6340] font-semibold"
                      : "text-[#0a0d12]",
                )}
              >
                {item.timeText}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
