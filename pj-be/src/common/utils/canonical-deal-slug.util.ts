/**
 * Slug dùng trong URL path: lấy phần trước `#` (fragment không gửi lên server),
 * trim; nếu rỗng thì `deal-{id}`.
 */
export function canonicalDealSlug(slugVi: string | null | undefined, dealId: number): string {
  if (slugVi != null && slugVi !== '') {
    const segment = slugVi.split('#')[0]?.trim() ?? '';
    if (segment.length > 0) return segment;
  }
  return `deal-${dealId}`;
}
