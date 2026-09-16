import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/libs/Helpers';

const base = getBaseUrl().replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/dashboard',
    },
    // Submit the sitemap index — Google will discover all per-locale sitemaps from it
    sitemap: `${base}/sitemap.xml`,
  };
}
