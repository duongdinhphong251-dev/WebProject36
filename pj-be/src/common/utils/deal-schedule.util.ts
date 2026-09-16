/**
 * Chuẩn hóa deals.start_at / deals.end_at cho mọi API trả deal.
 * Trả cả camelCase (startAt/endAt) và snake_case (start_at/end_at) — ISO 8601 hoặc null.
 */

export interface DealScheduleFields {
  startAt: string | null;
  endAt: string | null;
  start_at: string | null;
  end_at: string | null;
}

export function toDealIsoTimestamp(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? value.toISOString() : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }
  return null;
}

export function buildDealScheduleFields(
  startAt: Date | string | null | undefined,
  endAt: Date | string | null | undefined,
): DealScheduleFields {
  const start = toDealIsoTimestamp(startAt);
  const end = toDealIsoTimestamp(endAt);
  return {
    startAt: start,
    endAt: end,
    start_at: start,
    end_at: end,
  };
}
