/**
 * % giảm hiển thị: khi có giá gốc & giá sale hợp lệ và gốc > sale,
 * luôn tính từ hai mức giá để badge khớp số tiền (tránh lệch với `discountPercent` trong DB).
 */
export function deriveDisplayDiscountPercent(opts: {
  discountPercent?: string | number | null;
  originalPrice?: number | null;
  salePrice?: number | null;
}): number {
  const orig =
    opts.originalPrice != null ? Number(opts.originalPrice) : Number.NaN;
  const sale = opts.salePrice != null ? Number(opts.salePrice) : Number.NaN;
  if (
    Number.isFinite(orig) &&
    Number.isFinite(sale) &&
    orig > 0 &&
    sale >= 0 &&
    orig > sale
  ) {
    return Math.round(((orig - sale) / orig) * 100);
  }

  const raw = opts.discountPercent;
  if (raw == null || String(raw).trim() === "") return 0;
  const parsed = Number(String(raw).replace(/%/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}
