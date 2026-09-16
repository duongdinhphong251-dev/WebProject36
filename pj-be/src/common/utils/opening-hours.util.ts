import { parseOpeningHours } from '../../modules/spas/spas.service';

/**
 * Trích xuất thứ (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7) và tổng số phút từ 00:00 trong ngày
 * theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
 */
export function getVietnamTimeParts(now: Date = new Date()): { dayOfWeek: number; minutes: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  let weekdayStr = '';
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === 'weekday') weekdayStr = p.value;
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
  }
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] ?? now.getDay();
  const h = hour === 24 ? 0 : hour;
  const minutes = h * 60 + minute;
  return { dayOfWeek, minutes };
}

function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Kiểm tra Spa có đang mở cửa tại thời điểm `now` (tính theo giờ Việt Nam - Asia/Ho_Chi_Minh) hay không.
 *
 * Logic xử lý:
 * 1. Parse `openingHoursRaw` (JSONB) thành danh sách `OpeningPeriodDto[]` ({ day, openTime, closeTime }).
 * 2. Xác định `today` và `minutes` hiện tại theo múi giờ VN.
 * 3. Duyệt mảng khung giờ:
 *    - **Trong ngày hiện tại (period.day === today):**
 *      + Khung giờ bình thường (`openTime <= closeTime`): `nowM >= openM && nowM <= closeM`.
 *      + Khung giờ qua đêm trong cùng 1 record (`closeTime < openTime`, ví dụ mở 18:00 đóng 02:00):
 *        `nowM >= openM || nowM <= closeM` (đang nằm trong khoảng từ 18:00->23:59 hoặc 00:00->02:00).
 *    - **Khung giờ qua đêm kéo dài từ HÔM QUA (period.day === yesterday và `closeTime < openTime`):**
 *      + Ví dụ: Hôm qua (Thứ 6) mở 18:00->02:00. Hôm nay là Thứ 7 (01:00 AM) -> `nowM (60) <= closeM (120)` -> Mở.
 */
export function isSpaOpenNow(openingHoursRaw: unknown, now: Date = new Date()): boolean {
  if (!openingHoursRaw) return false;

  const periods = parseOpeningHours(openingHoursRaw);
  if (!periods || periods.length === 0) return false;

  const { dayOfWeek: today, minutes: nowM } = getVietnamTimeParts(now);
  const yesterday = (today - 1 + 7) % 7;

  for (const period of periods) {
    const openM = timeToMinutes(period.openTime);
    const closeM = timeToMinutes(period.closeTime);

    // 1. Kiểm tra khung giờ thuộc đúng ngày hôm nay
    if (period.day === today) {
      if (openM <= closeM) {
        if (nowM >= openM && nowM <= closeM) {
          return true;
        }
      } else {
        // Ca qua đêm nhập thủ công trong cùng 1 record (open 18:00, close 02:00)
        if (nowM >= openM || nowM <= closeM) {
          return true;
        }
      }
    }

    // 2. Kiểm tra ca qua đêm kéo dài từ ngày HÔM QUA (closeM < openM) vắt sang rạng sáng HÔM NAY
    if (period.day === yesterday && closeM < openM) {
      if (nowM <= closeM) {
        return true;
      }
    }
  }

  return false;
}
