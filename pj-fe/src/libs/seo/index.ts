import type { Metadata } from 'next';
import { locales } from '@/i18n/settings';
import { type MarketConfig, MARKETS } from '@/constants/market';
import { Env } from '@/libs/Env';
import 'server-only';

const BASE = Env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
const APP_NAME = Env.NEXT_PUBLIC_APP_NAME ?? 'Nhom36';

/** OG image — string URL hoặc rich object với dimensions */
export type OgImage =
  | string
  | { url: string; width?: number; height?: number; alt?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map locale → Open Graph locale string */
const toOgLocale = (loc: string) => {
  if (loc === 'vi') return 'vi_VN';
  if (loc === 'ko') return 'ko_KR';
  return 'en_US';
};

const withLeadingSlash = (p: string) => (p?.startsWith('/') ? p : `/${p}`);

const ensureArray = <T>(v?: T | T[], fallback: T[] = []): T[] =>
  Array.isArray(v) ? v : v ? [v] : fallback;

/** Normalize images → OG-compatible object array */
const normalizeImages = (
  images?: OgImage | OgImage[],
): { url: string; width?: number; height?: number; alt?: string }[] => {
  const raw = ensureArray<OgImage>(images, [
    { url: '/common/og_default.png', width: 1200, height: 630, alt: APP_NAME },
  ]);
  return raw.map((img) =>
    typeof img === 'string' ? { url: img } : img,
  );
};

/**
 * Build canonical URL.
 *
 * Nhom36 mounts ALL locales under their prefix:
 *   /vi/... , /en/... , /ko/...
 * There is NO prefix-less fallback (no redirect /vi/ → /).
 * Therefore canonical always includes the locale segment.
 */
const buildCanonicalUrl = (locale: string, path: string): string => {
  const cleanPath = withLeadingSlash(path);
  // Strip trailing slash to keep canonical consistent: /vi not /vi/
  return `/${locale}${cleanPath}`.replace(/\/$/, '') || `/${locale}`;
};

// ─── MetaOpts ────────────────────────────────────────────────────────────────

interface MetaOpts {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Current locale, e.g. 'vi' | 'en' | 'ko' */
  locale: string;
  /** Path WITHOUT locale prefix, e.g. '/organization_services/some-slug' */
  path: string;
  /** OG / Twitter image(s) — string URL hoặc rich object với width/height/alt */
  images?: OgImage | OgImage[];
  /** Keywords for <meta name="keywords"> */
  keywords?: string | string[];
  /** Locales to build hreflang links for */
  hreflangLocales?: string[];
  /** Explicit OG overrides */
  ogTitle?: string;
  ogDescription?: string;
  ogType?: 'website' | 'article' | 'product';
  /** Twitter overrides */
  twitterTitle?: string;
  twitterDescription?: string;
  /** Override OG locale string */
  ogLocaleOverride?: string;
  /** Market configuration */
  market?: MarketConfig;
}

// ─── buildPageMetadataCommon ──────────────────────────────────────────────────

export function buildPageMetadataCommon({
  title,
  description,
  locale,
  path,
  images,
  keywords,
  hreflangLocales = locales as unknown as string[],
  ogTitle,
  ogDescription,
  ogType = 'website',
  twitterTitle,
  twitterDescription,
  ogLocaleOverride,
  market = MARKETS.vn,
}: MetaOpts): Metadata {
  const cleanTitle = title.replace(/\s*\|\s*Glow\s*Explore/ig, '').trim();
  const absoluteTitle = cleanTitle ? `${cleanTitle} | Glow Explore` : APP_NAME;
  
  const finalOgTitle = (ogTitle ?? title).replace(/\s*\|\s*Glow\s*Explore/ig, '').trim();
  const finalTwitterTitle = (twitterTitle ?? title).replace(/\s*\|\s*Glow\s*Explore/ig, '').trim();

  const cleanPath = withLeadingSlash(path);
  const canonical = buildCanonicalUrl(locale, cleanPath);
  const imgs = normalizeImages(images);

  // hreflang: every locale under its prefix; x-default → default language of market
  const toHreflang = (loc: string) =>
    (`/${loc}${cleanPath}`.replace(/\/$/, '') || `/${loc}`);
  const languages = hreflangLocales.reduce<Record<string, string>>((acc, loc) => {
    // Generate full language-region tag e.g., 'vi-VN'
    const hreflangCode = `${loc}-${market.countryCode}`;
    acc[hreflangCode] = toHreflang(loc);
    return acc;
  }, {});

  languages['x-default'] = toHreflang(market.defaultLanguage);

  const kwArray = ensureArray<string>(keywords as string | string[]);

  return {
    metadataBase: new URL(BASE),
    title: { absolute: absoluteTitle },
    description,
    // Meta keywords (not a Google ranking factor but used by other crawlers)
    ...(kwArray.length > 0 ? { keywords: kwArray } : {}),
    alternates: {
      canonical,
      languages: languages as Record<string, string>,
    },
    openGraph: {
      type: ogType === 'product' ? 'website' : ogType, // OG doesn't support 'product'
      siteName: APP_NAME,
      url: canonical,
      locale: ogLocaleOverride ?? toOgLocale(locale),
      title: finalOgTitle,
      description: ogDescription ?? description,
      images: imgs,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@Nhom36',       // Twitter/X account handle
      creator: '@Nhom36',
      title: finalTwitterTitle,
      description: twitterDescription ?? description,
      images: imgs.map((img) => img.url),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    // Publisher / author metadata
    other: {
      publisher: APP_NAME,
      'article:author': APP_NAME,
    },
  };
}
