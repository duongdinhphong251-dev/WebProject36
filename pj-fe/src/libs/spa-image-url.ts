/**
 * Chuẩn hóa URL ảnh spa cho listing/card.
 * - `spa_avatar` / `photos[].name` có thể là URL https, path `/...`, hoặc resource Google Places (`places/.../photos/...`).
 * - Media Places API (New) yêu cầu percent-encode tên resource trong path.
 */
const FALLBACK_SPA_THUMBNAIL =
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80";

const API_BASE = (process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? "").replace(/\/+$/, "");

function googlePlacesPhotoMediaUrl(photoResourceName: string, maxHeightPx = 300): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!key?.trim()) return null;
  const name = photoResourceName.trim();
  if (!name) return null;
  return `https://places.googleapis.com/v1/${encodeURIComponent(name)}/media?maxHeightPx=${maxHeightPx}&key=${encodeURIComponent(key)}`;
}

/** `true` nếu chuỗi giống resource name Places API (New), không phải URL đầy đủ */
function isGooglePlacesPhotoResource(s: string): boolean {
  return s.startsWith("places/");
}

/**
 * Trả về URL ảnh hiển thị được, hoặc `null` nếu không suy ra được (caller có thể dùng fallback).
 */
export function resolveSpaListingImageSrc(opts: {
  spaAvatarUrl?: string | null;
  photoName?: string | null;
}): string | null {
  const tryOne = (raw: string): string | null => {
    const s = raw.trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("//")) return `https:${s}`;
    if (s.startsWith("/")) return API_BASE ? `${API_BASE}${s}` : s;
    if (isGooglePlacesPhotoResource(s)) return googlePlacesPhotoMediaUrl(s);
    return null;
  };

  const fromAvatar = opts.spaAvatarUrl ? tryOne(opts.spaAvatarUrl) : null;
  if (fromAvatar) return fromAvatar;

  const photo = opts.photoName?.trim() ?? "";
  if (!photo) return null;
  if (/^https?:\/\//i.test(photo)) return photo;
  if (photo.startsWith("//")) return `https:${photo}`;
  if (photo.startsWith("/")) return API_BASE ? `${API_BASE}${photo}` : photo;
  const resourceName = isGooglePlacesPhotoResource(photo) ? photo : `places/${photo}`;
  return googlePlacesPhotoMediaUrl(resourceName);
}

export function resolveSpaListingImageSrcWithFallback(opts: {
  spaAvatarUrl?: string | null;
  photoName?: string | null;
}): string {
  return resolveSpaListingImageSrc(opts) ?? FALLBACK_SPA_THUMBNAIL;
}

export function shouldBypassNextImageOptimization(src: string | null | undefined): boolean {
  if (!src) return false;
  return /(^http:\/\/localhost:)|(^http:\/\/127\.0\.0\.1:)|\/uploads\//.test(src);
}
