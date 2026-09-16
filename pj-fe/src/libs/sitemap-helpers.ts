/**
 * Shared helpers for locale-specific sitemaps.
 * Used by sitemap-vi, sitemap-en, sitemap-ko route handlers.
 */

import { getBaseUrl } from '@/libs/Helpers';
import { locales, fallbackLng } from '@/i18n/settings';
import { ALL_SERVICE_KEYS, SERVICE_SLUGS } from '@/constants/services';
import { resolvePage, getSeoUrls } from '@/services/api/spa-api';

// Strip trailing slash once to avoid double-slash URLs
export const base = getBaseUrl().replace(/\/+$/, '');

// ─── Safety limits ─────────────────────────────────────────────────────────────
export const MAX_PAGES_PER_CATEGORY = 10;
export const ITEMS_PER_PAGE = 100;

// ─── URL builder ───────────────────────────────────────────────────────────────
// Every locale now gets an explicit prefix in the URL:
//   vi  → https://Nhom36.com/vi/massage
//   en  → https://Nhom36.com/en/massage
//   ko  → https://Nhom36.com/ko/masaji
// This ensures Google sees distinct, canonical URLs per language.
export const localeUrl = (locale: string, path: string): string =>
  `${base}/${locale}${path === '/' ? '' : path}`;

// ─── Entry factory ─────────────────────────────────────────────────────────────
export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
  alternates?: {
    languages?: Record<string, string>;
  };
  images?: { url: string; title?: string }[];
}

/**
 * Build a sitemap entry for a given locale, with full hreflang alternates.
 *
 * @param locale     - The locale this entry belongs to (determines the canonical `url`)
 * @param viPath     - The Vietnamese path (used as fallback for locales without a specific path)
 * @param localePaths - Optional per-locale overrides, e.g. { ko: '/masaji' }
 * @param opts       - changeFrequency, priority, lastModified
 */
export function makeEntry(
  locale: string,
  viPath: string,
  localePaths: Partial<Record<string, string>> = {},
  opts?: {
    changeFrequency?: SitemapEntry['changeFrequency'];
    priority?: number;
    lastModified?: Date;
    images?: SitemapEntry['images'];
  },
): SitemapEntry {
  const {
    changeFrequency = 'weekly',
    priority = 0.7,
    lastModified = new Date(),
    images,
  } = opts ?? {};

  // Canonical URL for this locale
  const localePath = localePaths[locale] ?? viPath;
  const canonicalUrl = localeUrl(locale, localePath);

  // Build full hreflang map across all locales
  const viUrl = localeUrl('vi', viPath);
  const hreflang: Record<string, string> = {
    'x-default': viUrl, // x-default always points to vi
    ...Object.fromEntries(
      locales.map((l) => [l, localeUrl(l, localePaths[l] ?? viPath)]),
    ),
  };

  return {
    url: canonicalUrl,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: hreflang },
    images,
  };
}

// ─── Dynamic entries (spas + deals) ───────────────────────────────────────────
export async function collectDynamicEntries(locale: string, pageId: number = 1): Promise<{
  dealEntries: SitemapEntry[];
  spaEntries: SitemapEntry[];
}> {
  const seenDeals = new Set<string>();
  const seenSpas = new Set<string>();
  const dealEntries: SitemapEntry[] = [];
  const spaEntries: SitemapEntry[] = [];

  // Use vi slug to resolve pages (slug is locale-agnostic on the BE side)
  for (const key of ALL_SERVICE_KEYS) {
    const viSlug = SERVICE_SLUGS[key][fallbackLng];
    // We only fetch the specific page requested by pageId to support dynamic sitemap chunking
    const page = pageId;
    try {
        const payload = await resolvePage({
          url: viSlug,
          locale: fallbackLng,
          page,
          limit: ITEMS_PER_PAGE,
        });

        for (const group of payload.deals?.data ?? []) {
          // ── Spa ──────────────────────────────────────────────────────────────
          const spaSlug = group.spa?.slug;
          if (spaSlug && !seenSpas.has(spaSlug)) {
            seenSpas.add(spaSlug);
            const spaImages = group.spa?.spaAvatarUrl ? [{ url: group.spa.spaAvatarUrl, title: group.spa?.name }] : undefined;
            spaEntries.push(
              makeEntry(locale, `/provider/${spaSlug}`, {}, {
                changeFrequency: 'weekly',
                priority: 0.7,
                images: spaImages,
              }),
            );
          }

          // ── Deals ─────────────────────────────────────────────────────────
          for (const deal of group.deals ?? []) {
            const dealSlug = deal.canonicalSlug ?? deal.slug;
            if (dealSlug && !seenDeals.has(dealSlug)) {
              seenDeals.add(dealSlug);
              const dealImages = deal.coverImageUrl ? [{ url: deal.coverImageUrl, title: deal.title }] : undefined;
              dealEntries.push(
                makeEntry(
                  locale,
                  `/organization_services/${dealSlug}`,
                  {},
                  {
                    changeFrequency: 'daily',
                    priority: 0.9,
                    lastModified: deal.endAt ? new Date(deal.endAt) : new Date(),
                    images: dealImages,
                  },
                ),
              );
            }
          }
        }
      } catch (err) {
        console.error(
          `[sitemap-${locale}] resolvePage failed — category="${viSlug}" page=${page}`,
          err,
        );
      }
  }

  return { dealEntries, spaEntries };
}

// ─── SEO URL entries (category × city) ────────────────────────────────────────
export async function collectSeoUrlEntries(locale: string, pageId: number = 1): Promise<SitemapEntry[]> {
  const items = await getSeoUrls({
    nodeType: 'category,city',
    locale: 'vi,en,ko',
    page: pageId, // pass pageId here
    limit: 2000,
  });

  type GroupedEntry = { paths: Record<string, string>; updatedAt: string | null };
  const grouped = new Map<string, GroupedEntry>();

  for (const item of items) {
    const key = JSON.stringify({
      categoryId: item.categoryId ?? null,
      cityId: item.cityId ?? null,
      districtId: item.districtId ?? null,
      wardId: item.wardId ?? null,
      placeId: item.placeId ?? null,
    });

    if (!grouped.has(key)) {
      grouped.set(key, { paths: {}, updatedAt: null });
    }
    const group = grouped.get(key)!;
    group.paths[item.locale] = `/${item.url}`;
    if (item.updatedAt && (!group.updatedAt || item.updatedAt > group.updatedAt)) {
      group.updatedAt = item.updatedAt;
    }
  }

  return [...grouped.values()]
    .filter((g) => g.paths.vi && g.paths[locale]) // must have both vi (canonical) and target locale
    .map((g) =>
      makeEntry(
        locale,
        g.paths.vi!,
        Object.fromEntries(
          locales.filter((l) => g.paths[l]).map((l) => [l, g.paths[l]!]),
        ),
        {
          changeFrequency: 'weekly',
          priority: 0.85,
          lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
        },
      ),
    );
}

// ─── Static pages per locale ───────────────────────────────────────────────────
export function getStaticEntries(locale: string): SitemapEntry[] {
  return [
    makeEntry(locale, '/', {}, { changeFrequency: 'daily', priority: 1.0 }),
    makeEntry(locale, '/flash-sale', {}, { changeFrequency: 'daily', priority: 0.9 }),
  ];
}

// ─── Assemble full sitemap for one locale ──────────────────────────────────────
export async function buildLocaleSitemap(locale: string, pageId: number = 1): Promise<SitemapEntry[]> {
  const [{ dealEntries, spaEntries }, seoUrlEntries] = await Promise.all([
    collectDynamicEntries(locale, pageId),
    collectSeoUrlEntries(locale, pageId),
  ]);

  return [
    ...getStaticEntries(locale),
    ...seoUrlEntries,
    ...spaEntries,
    ...dealEntries,
  ];
}

// ─── XML serialiser ────────────────────────────────────────────────────────────
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderSitemapXml(entries: SitemapEntry[]): string {
  const urlset = entries
    .map((entry) => {
      const alternateLinks = entry.alternates?.languages
        ? Object.entries(entry.alternates.languages)
            .map(
              ([lang, href]) =>
                `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}"/>`,
            )
            .join('\n')
        : '';
        
      const imageTags = entry.images?.length
        ? entry.images.map(img => `    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
${img.title ? `      <image:title>${escapeXml(img.title)}</image:title>` : ''}
    </image:image>`).join('\n')
        : '';

      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${entry.lastModified ? `<lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>` : ''}
    ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
${alternateLinks}${imageTags ? '\n' + imageTags : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${urlset}
</urlset>`;
}

// ─── Sitemap index XML ─────────────────────────────────────────────────────────
export function renderSitemapIndexXml(sitemapUrls: string[]): string {
  const sitemaps = sitemapUrls
    .map(
      (url) => `  <sitemap>
    <loc>${escapeXml(url)}</loc>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}
