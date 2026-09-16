/**
 * Server-safe utility — có thể dùng trong cả Server Component lẫn Client Component.
 * Tất cả thời gian hiển thị theo timezone Việt Nam (UTC+7).
 */

const VN_TZ = "Asia/Ho_Chi_Minh";

/** Trả về chuỗi YYYY-MM-DD theo giờ Việt Nam để so sánh ngày */
function toVnDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // "2026-05-08"
}

/** Format giờ HH:mm (24h, 00-23) theo giờ Việt Nam */
function fmtTime(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: VN_TZ,
  }).format(d);
}

/** Format ngày tắt DD/MM hoặc DD/MM/YYYY nếu khác năm hiện tại */
function fmtShortDate(d: Date, _locale: string, currentYear: number): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: VN_TZ,
  }).formatToParts(d);
  const day   = parts.find((p) => p.type === "day")?.value   ?? "01";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const year  = parts.find((p) => p.type === "year")?.value  ?? String(currentYear);
  return Number(year) !== currentYear ? `${day}/${month}/${year}` : `${day}/${month}`;
}

/** Trả về giờ (0-23) theo VN timezone */
function vnHour(d: Date): number {
  return parseInt(
    new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: VN_TZ,
    }).format(d),
    10,
  );
}

/** Trả về phút (0-59) theo VN timezone */
function vnMinute(d: Date): number {
  return parseInt(
    new Intl.DateTimeFormat("en", {
      minute: "numeric",
      timeZone: VN_TZ,
    }).format(d),
    10,
  );
}

/**
 * Formats a deal time range with cross-day detection.
 *
 * - Cùng ngày (VN timezone): "21:43 - 23:13"
 * - Khác ngày (qua đêm):     "08/05 21:43 → 09/05 01:00"
 *
 * @param fromLabel - Label i18n hiển thị khi chỉ có startAt (vd: "Từ" / "From" / "시작")
 * @param locale    - BCP-47 locale để format ngày/giờ (vd: "vi", "en", "ko")
 * @returns null nếu input không hợp lệ hoặc thiếu.
 */
export function formatDealTimeRange(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  fromLabel: string = "From",
  locale: string = "vi-VN",
): string | null {
  if (!startAt) return null;

  const startDate = new Date(startAt);
  if (isNaN(startDate.getTime())) return null;

  const currentYear = new Date().getFullYear();

  // Chỉ có startAt — hiển thị "{fromLabel} dd/MM [HH:mm]"
  if (!endAt) {
    const h = vnHour(startDate);
    const m = vnMinute(startDate);
    const isMidnight = h === 0 && m === 0;
    if (isMidnight) {
      return `${fromLabel} ${fmtShortDate(startDate, locale, currentYear)}`;
    }
    return `${fromLabel} ${fmtShortDate(startDate, locale, currentYear)} ${fmtTime(startDate, locale)}`;
  }

  const endDate = new Date(endAt);

  if (isNaN(endDate.getTime())) return null;

  const startDay = toVnDateStr(startDate);
  const endDay = toVnDateStr(endDate);

  if (startDay === endDay) {
    // Cùng ngày — format mặc định
    return `${fmtTime(startDate, locale)} - ${fmtTime(endDate, locale)}`;
  }

  // Khác ngày — hiển thị kèm ngày
  return (
    `${fmtShortDate(startDate, locale, currentYear)} ${fmtTime(startDate, locale)}` +
    ` → ${fmtShortDate(endDate, locale, currentYear)} ${fmtTime(endDate, locale)}`
  );
}


// ─── Smart campaign time ──────────────────────────────────────────────────────

/**
 * Campaign time status — used to pick the right label in the UI.
 *
 * - `upcoming`  → "Bắt đầu từ: 20/05"  (deal chưa bắt đầu)
 * - `active`    → "Hiệu lực: 10/05 – 24/05"  (đang diễn ra, multi-day)
 * - `ending`    → "Hạn dùng: Đến 24/05"  (đang diễn ra, sắp hết ≤ 3 ngày)
 * - `same_day`  → "HH:mm – HH:mm"  (same-day flash sale, keep raw time)
 */
export type CampaignTimeStatus = "upcoming" | "active" | "ending" | "same_day" | "expiry_only";

export interface SmartCampaignTimeResult {
  /** Status to pick the right i18n label in UI */
  status: CampaignTimeStatus;
  /** Pre-formatted time/date string (without label prefix) */
  text: string;
}

/** Threshold (in days) to switch from "valid period" to "ending soon" */
const ENDING_SOON_DAYS = 3;

/**
 * Smart campaign time — returns structured info for better UX labels.
 *
 * Instead of always returning "Từ dd/mm" (which clashes with "Có sẵn lúc"),
 * this returns a status + text so the UI can pick the right label:
 *
 * | Status    | Example text          | Recommended label (vi)        |
 * |-----------|-----------------------|-------------------------------|
 * | upcoming  | "20/05"               | "Bắt đầu từ: 20/05"          |
 * | ending    | "24/05"               | "Hạn dùng: Đến 24/05"        |
 * | active    | "10/05 – 24/05"       | "Hiệu lực: 10/05 – 24/05"    |
 * | same_day  | "14:00 – 18:00"       | "14:00 – 18:00"               |
 *
 * Returns null if:
 * - Input invalid/missing
 * - Already ended
 * - Active with no endAt (no useful info to show)
 */
export function formatSmartCampaignTime(
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  _fromLabel: string = "From", // kept for backward-compat but no longer used
  locale: string = "vi-VN",
): SmartCampaignTimeResult | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  const endDate = endAt ? new Date(endAt) : null;
  if (endDate && isNaN(endDate.getTime())) return null;

  // ── Case: startAt is null but endAt exists ────────────────────────────
  // e.g. birthday deals, event deals with only an expiry date
  if (!startAt) {
    if (!endDate || endDate <= now) return null; // already ended or no info
    const endH = vnHour(endDate);
    const endM = vnMinute(endDate);
    const isEndMidnight = (endH === 23 && endM === 59) || (endH === 0 && endM === 0);
    const text = isEndMidnight
      ? fmtShortDate(endDate, locale, currentYear)
      : `${fmtShortDate(endDate, locale, currentYear)} ${fmtTime(endDate, locale)}`;

    // expiry_only: show end date with a clearer "Hết hạn" label (not "Đến")
    return { status: "expiry_only", text };
  }

  const startDate = new Date(startAt);
  if (isNaN(startDate.getTime())) return null;

  // ── Start in the future → "upcoming" ─────────────────────────────────
  if (startDate > now) {
    const h = vnHour(startDate);
    const m = vnMinute(startDate);
    const isMidnight = h === 0 && m === 0;
    const text = isMidnight
      ? fmtShortDate(startDate, locale, currentYear)
      : `${fmtShortDate(startDate, locale, currentYear)} ${fmtTime(startDate, locale)}`;
    return { status: "upcoming", text };
  }

  // ── Start is past — only useful if endAt is still in the future ──────
  if (!endDate || endDate <= now) return null;

  const startDay = toVnDateStr(startDate);
  const endDay = toVnDateStr(endDate);

  // Same-day flash sale → raw time range "HH:mm – HH:mm"
  if (startDay === endDay) {
    return {
      status: "same_day",
      text: `${fmtTime(startDate, locale)} – ${fmtTime(endDate, locale)}`,
    };
  }

  // Multi-day active campaign:
  // Check if ending soon (≤ ENDING_SOON_DAYS days)
  const msLeft = endDate.getTime() - now.getTime();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);

  if (daysLeft <= ENDING_SOON_DAYS) {
    // Ending soon → show only end date (FOMO: "Hạn dùng: Đến 24/05")
    const endH = vnHour(endDate);
    const endM = vnMinute(endDate);
    const isEndMidnight = (endH === 23 && endM === 59) || (endH === 0 && endM === 0);
    const text = isEndMidnight
      ? fmtShortDate(endDate, locale, currentYear)
      : `${fmtShortDate(endDate, locale, currentYear)} ${fmtTime(endDate, locale)}`;
    return { status: "ending", text };
  }

  // Still plenty of time → show full range "dd/MM – dd/MM"
  return {
    status: "active",
    text: `${fmtShortDate(startDate, locale, currentYear)} – ${fmtShortDate(endDate, locale, currentYear)}`,
  };
}

/** Giờ áp dụng trong ngày (BE: applicableTimeLabel hoặc cặp start/end). */
export function formatApplicableDailyWindow(
  label: string | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
): string | null {
  const l = label?.trim();
  if (l) return l;
  const s = start?.trim()?.slice(0, 5);
  const e = end?.trim()?.slice(0, 5);
  if (s && e) return `${s} – ${e}`;
  return null;
}
