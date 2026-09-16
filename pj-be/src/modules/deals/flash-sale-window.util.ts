/**
 * Flash sale theo “khung áp dụng” ngắn (thường 1–2 giờ): deal_time_slots hoặc start_at/end_at deal.
 * Thị trường thường dùng 1–3 giờ; sản phẩm Tuoi chốt 60–120 phút để đồng bộ countdown với khung giờ hiển thị.
 */
export const FLASH_APPLICABLE_MIN_MINUTES = 60;
export const FLASH_APPLICABLE_MAX_MINUTES = 120;
/** Top cửa hàng trên home / block flash */
export const FLASH_HOME_TOP_SPAS = 10;

/** Pad "9:0" → "09:00:00" để so sánh chuỗi & nhóm khung giờ */
export function padTimeOfDay(raw: string): string {
  const parts = raw.trim().split(':').map((p) => parseInt(p.trim(), 10) || 0);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const s = parts[2] ?? 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Phút từ 00:00 trong ngày (có thể là số thập phân nhỏ nếu có giây). */
export function timeOfDayToMinutesFromMidnight(padded: string): number {
  const [hs, ms, ss] = padded.split(':');
  const h = parseInt(hs ?? '0', 10);
  const m = parseInt(ms ?? '0', 10);
  const s = parseInt(ss ?? '0', 10);
  return h * 60 + m + s / 60;
}

/** Độ dài khung HH:mm–HH:mm cùng ngày; nếu end <= start coi là qua nửa đêm (+24h). */
export function slotWallClockDurationMinutes(startRaw: string, endRaw: string): number {
  const a = timeOfDayToMinutesFromMidnight(padTimeOfDay(startRaw));
  let b = timeOfDayToMinutesFromMidnight(padTimeOfDay(endRaw));
  if (b <= a) b += 24 * 60;
  return b - a;
}

/** Giờ hiện tại có nằm trong [start, end] theo phút trong ngày không (hỗ trợ qua nửa đêm). */
export function nowInWallClockWindow(now: Date, startRaw: string, endRaw: string): boolean {
  const nowM = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const sM = timeOfDayToMinutesFromMidnight(padTimeOfDay(startRaw));
  let eM = timeOfDayToMinutesFromMidnight(padTimeOfDay(endRaw));
  if (eM > sM) {
    return nowM >= sM && nowM <= eM;
  }
  return nowM >= sM || nowM <= eM;
}

/**
 * Gắn giờ trong ngày (local server) vào calendar của `base`.
 * Nếu end wall-clock <= start (cùng calendar), cộng 1 ngày cho end (khung qua nửa đêm đơn giản).
 */
export function combineLocalDateWithTimeOfDay(base: Date, timeRaw: string): Date {
  const p = padTimeOfDay(timeRaw).split(':').map((x) => parseInt(x, 10));
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, 0);
  return d;
}

export function slotWindowBoundsLocal(
  base: Date,
  startRaw: string,
  endRaw: string,
): { startsAt: Date; endsAt: Date } {
  let startsAt = combineLocalDateWithTimeOfDay(base, startRaw);
  let endsAt = combineLocalDateWithTimeOfDay(base, endRaw);
  const sM = timeOfDayToMinutesFromMidnight(padTimeOfDay(startRaw));
  const eM = timeOfDayToMinutesFromMidnight(padTimeOfDay(endRaw));
  if (eM <= sM) {
    endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startsAt, endsAt };
}

export function formatWindowLabel(startRaw: string, endRaw: string): string {
  const s = padTimeOfDay(startRaw).slice(0, 5);
  const e = padTimeOfDay(endRaw).slice(0, 5);
  return `${s}–${e}`;
}
