/**
 * Hoist regex outside the function — compiled once, reused on every call.
 * \p{M} matches ALL Unicode combining marks (Mn, Mc, Me), which correctly
 * covers Vietnamese diacritics AND the combining stroke in Đ/đ (U+0110/U+0111)
 * that \p{Diacritic} misses.
 */
const COMBINING_MARKS_RE = /\p{M}/gu;

/**
 * Returns the localized display name for a location entity.
 *
 * Priority:
 *   locale "en" → nameEn  (if provided and non-empty)
 *   locale "ko" → nameKo  (if provided and non-empty)
 *   locale "vi" → nameVi  (no-op, no allocation)
 *   fallback    → romanize nameVi via NFD diacritic-stripping
 *                 e.g. "Hà Nội" → "Ha Noi", "Đà Nẵng" → "Da Nang"
 *
 * Callers that only pass nameVi + locale continue to work unchanged.
 *
 * Performance notes:
 * - The regex is hoisted (compiled once).
 * - For "vi" locale the function returns the original string reference — zero cost.
 * - normalize("NFD") + replace is the fastest JS approach for diacritic removal.
 */
export function localizeLocationName(
  nameVi: string | null | undefined,
  locale?: string,
  nameEn?: string | null,
  nameKo?: string | null,
): string {
  const fallback = nameVi || "";
  if (!locale || locale === "vi") return fallback;

  if (locale === "en" && nameEn) return nameEn;
  if (locale === "ko" && nameKo) return nameKo;

  if (!fallback) return "";

  try {
    return fallback
      .normalize("NFD")
      .replace(COMBINING_MARKS_RE, "")
      .replace(/\u0111/g, "d")
      .replace(/\u0110/g, "D");
  } catch {
    return fallback;
  }
}

/** Chuẩn hóa chuỗi để tìm kiếm (không dấu, thường, gộp khoảng trắng). */
export function normalizeLocationSearchKey(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  try {
    return text
      .normalize("NFD")
      .replace(COMBINING_MARKS_RE, "")
      .replace(/\u0111/g, "d")
      .replace(/\u0110/g, "D")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return text.toLowerCase().trim();
  }
}
