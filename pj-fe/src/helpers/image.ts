/**
 * Strip expiring query params from Google Cloud Storage signed URLs.
 * GCS signed URLs with X-Goog-Expires expire (typically 900s = 15min).
 * If Next.js Image component tries to fetch these after expiration, it gets a 403.
 * Strip everything after '?' for GCS storage URLs so Next.js fetches the public URL instead.
 */
export const stripSignedUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.includes('storage.googleapis.com') && url.includes('X-Goog-')) {
    return url.split('?')[0]!;
  }
  return url;
};
