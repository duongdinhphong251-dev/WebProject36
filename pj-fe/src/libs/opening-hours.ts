import type { OpeningPeriodDto } from "@/types/api";

export interface OpeningStatus {
  isOpen: boolean;
  text: string;
  openSub?: string;
}

export function getOpeningStatus(
  openingHours?: OpeningPeriodDto[] | null,
  t?: (key: string, options?: any) => string
): OpeningStatus | null {
  if (!openingHours || !Array.isArray(openingHours) || openingHours.length === 0)
    return null;

  const tr = t || ((key: string, options?: any) => {
    const map: Record<string, string> = {
      "is_closed_today": "Đóng cửa hôm nay",
      "opening_is_open_now": "Đang mở",
      "is_open_now": "Đang mở",
      "is_closed": "Đóng cửa",
      "opens_at": "Mở lúc {{time}}",
      "closes_at": "Đóng lúc {{time}}",
      "closed_for_today": "Đã đóng cửa hôm nay"
    };
    let res = map[key] || key;
    if (options && options.time) {
      res = res.replace("{{time}}", options.time);
    }
    return res;
  });

  const getIsOpenNowText = () => {
    const res = tr("opening_is_open_now");
    if (res && res !== "opening_is_open_now") return res;
    return tr("is_open_now");
  };

  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const currentDay = vietnamTime.getDay(); // 0 = Sun, 1 = Mon...
  const currentMin = vietnamTime.getHours() * 60 + vietnamTime.getMinutes();

  const todayPeriods = openingHours.filter(
    (p): p is OpeningPeriodDto & { openTime: string; closeTime: string } =>
      !!p && typeof p.day === "number" && p.day === currentDay && !!p.openTime && !!p.closeTime,
  );

  if (todayPeriods.length === 0) {
    return { isOpen: false, text: tr("is_closed_today") };
  }

  const parseToMinutes = (timeStr: string) => {
    const parts = timeStr.trim().split(":");
    return parseInt(parts[0] || "0", 10) * 60 + parseInt(parts[1] || "0", 10);
  };

  const is24Hours = todayPeriods.some(
    (p) => p.openTime === "00:00" && p.closeTime === "23:59",
  );
  if (is24Hours) {
    return { isOpen: true, text: getIsOpenNowText(), openSub: "24/24" };
  }

  // 1. Kiểm tra xem currentMin có đang nằm trong bất kỳ ca nào không
  const activePeriod = todayPeriods.find((p) => {
    const openMin = parseToMinutes(p.openTime);
    const closeMin = parseToMinutes(p.closeTime);
    return currentMin >= openMin && currentMin < closeMin;
  });

  if (activePeriod) {
    return {
      isOpen: true,
      text: getIsOpenNowText(),
      openSub: tr("closes_at", { time: activePeriod.closeTime }),
    };
  }

  // 2. Nếu không trong ca nào, tìm ca gần nhất sắp mở trong ngày hôm nay
  const upcomingPeriods = todayPeriods
    .map((p) => ({ period: p, openMin: parseToMinutes(p.openTime) }))
    .filter(({ openMin }) => openMin > currentMin)
    .sort((a, b) => a.openMin - b.openMin);

  if (upcomingPeriods.length > 0) {
    const nextPeriod = upcomingPeriods[0]!.period;
    return {
      isOpen: false,
      text: tr("is_closed"),
      openSub: tr("opens_at", { time: nextPeriod.openTime }),
    };
  }

  // 3. Đã qua tất cả các ca trong ngày hôm nay
  return { isOpen: false, text: tr("closed_for_today") };
}
