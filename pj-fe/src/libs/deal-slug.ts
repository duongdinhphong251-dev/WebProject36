export function normalizeDealPathParam(
  slugOrId: string | number | null | undefined,
): string {
  const raw = String(slugOrId ?? "").trim();
  if (!raw) return "";
  const safe = raw.split("#")[0]?.trim() ?? raw;
  return encodeURIComponent(safe || raw);
}

/** Một segment path `/deals/...`: ưu tiên canonicalSlug từ BE, encode an toàn. */
export function dealPathSegment(deal: {
  canonicalSlug?: string | null;
  slug?: string | null;
  id: number | string;
}): string {
  const raw = deal.canonicalSlug ?? deal.slug ?? String(deal.id);
  const safe = String(raw).split("#")[0]?.trim() ?? String(deal.id);
  return encodeURIComponent(safe || String(deal.id));
}

/** Slug thô dùng cho tracking API (không encode URI). */
export function dealTrackingSlug(deal: {
  canonicalSlug?: string | null;
  slug?: string | null;
  id: number | string;
}): string {
  const raw = deal.canonicalSlug ?? deal.slug ?? String(deal.id);
  return (String(raw).split("#")[0]?.trim() || String(deal.id));
}

/** So sánh segment URL với slug BE (decode, bỏ `#`). */
export function dealSlugForCanonicalMatch(segment: string): string {
  const s = String(segment ?? "").trim();
  if (!s) return "";
  try {
    return (decodeURIComponent(s).split("#")[0] ?? "").trim();
  } catch {
    return (s.split("#")[0] ?? "").trim();
  }
}
