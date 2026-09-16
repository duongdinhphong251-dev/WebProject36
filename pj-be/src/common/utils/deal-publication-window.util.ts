import { and, gte, isNull, lte, or, SQL } from 'drizzle-orm';
import * as schema from '../../db/schema';

/**
 * Deal đang trong thời gian hiển thị: đã bắt đầu (nếu có start_at) và chưa kết thúc (nếu có end_at).
 * NULL = không giới hạn phía đó — giữ deal “mở” không gắn khung ngày.
 */
export function dealWithinPublicationWindow(now: Date = new Date()): SQL {
  return and(
    or(isNull(schema.deals.startAt), lte(schema.deals.startAt, now)),
    or(isNull(schema.deals.endAt), gte(schema.deals.endAt, now)),
  )!;
}
