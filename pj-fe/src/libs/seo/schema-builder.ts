import { Env } from '@/libs/Env';
import type { SpaDetailDto } from '@/types/api';
import type { DealDetailDto } from '@/types/deal-detail';
import { stripSignedUrl } from '@/helpers/image';
import { type MarketConfig, MARKETS } from '@/constants/market';

// ─── WebSite (site name + Sitelinks Searchbox) ───────────────────────────────

function formatTzDate(date: string | Date | number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
}

function formatInternationalPhone(phone?: string | null, countryCode: string = 'VN'): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (countryCode === 'VN' && cleaned.startsWith('0')) {
    return `+84${cleaned.slice(1)}`;
  }
  return cleaned;
}

/**
 * Minimal WebSite JSON-LD — inject in root layout for every page.
 * Tells Google the site name and enables Sitelinks Searchbox in SERPs.
 * Ref: https://developers.google.com/search/docs/appearance/site-names
 */
export function buildWebSiteJsonLd(): object {
  const base = (Env.NEXT_PUBLIC_APP_URL || 'https://glowexplore.com').replace(/\/+$/, '');
  const name = 'Glow Explore';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: base,
    name,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/vi/massage-spa?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

const LOCAL_BUSINESS_TYPE_MAP: Record<string, string> = {
  massage: 'DaySpa',
  'head-spa': 'DaySpa',
  'ear-spa': 'DaySpa',
  skincare: 'DaySpa',
  nail: 'NailSalon',
  nails: 'NailSalon',
  'lashes-brows': 'BeautySalon',
  'hair-removal': 'BeautySalon',
  dental: 'Dentist',
  hair: 'HairSalon',
  fitness: 'ExerciseGym',
  restaurant: 'Restaurant',
  'hotel-resort': 'LodgingBusiness',
  golf: 'GolfCourse',
};

export function resolveLocalBusinessTypes(services?: { slugGlobal: string }[] | null): string | string[] {
  if (!services || services.length === 0) return 'HealthAndBeautyBusiness';

  const types = Array.from(new Set(
    services.map(s => LOCAL_BUSINESS_TYPE_MAP[s.slugGlobal] || 'HealthAndBeautyBusiness')
  ));

  if (types.length > 1 && types.includes('HealthAndBeautyBusiness')) {
    const filtered = types.filter(t => t !== 'HealthAndBeautyBusiness');
    return filtered.length === 1 ? filtered[0]! : filtered;
  }

  return types.length === 1 ? types[0]! : types;
}

// ─── Deal / Service schema ────────────────────────────────────────────────────

export interface DealServiceJsonLdParams {
  baseUrl: string;
  locale: string;
  market?: MarketConfig;
  /** Canonical path, e.g. /organization_services/some-slug */
  path: string;
  deal: DealDetailDto;
  /** Resolved title in current locale */
  title: string;
  /** Resolved short description in current locale */
  description?: string | null;
  /** Service type: string or array, e.g. ["Foot Massage", "Body Massage"] */
  serviceType?: string | string[] | null;
  /** Service category, e.g. "Spa massage" */
  category?: string | null;
  /** Spa city name for areaServed (more specific than Vietnam) */
  cityName?: string | null;
  /** Spa district name for address.addressRegion */
  districtName?: string | null;
  /** Spa street address */
  streetAddress?: string | null;
  /** Spa phone number for LocalBusiness.telephone */
  telephone?: string | null;
  /** Latitude for GeoCoordinates */
  lat?: number | null;
  /** Longitude for GeoCoordinates */
  lng?: number | null;
  /** Spa logo/avatar URL for LocalBusiness.image */
  spaLogoUrl?: string | null;
  /** Override default business type */
  businessType?: string | string[] | null;
  /** Spa photo URLs to include as Service.image[] */
  spaPhotos?: string[];
  /** Spa AggregateRating */
  ratingValue?: number;
  reviewCount?: number;
  /** Spa reviews to include as Review nodes */
  reviews?: Array<{
    id: string | number;
    authorName: string;
    rating: number;
    content?: string | null;
    reviewedAt?: string | null;
  }>;
}

/**
 * Build JSON-LD array for deal/service detail pages.
 * Emits: Service (with Offer + AggregateRating + Review[]) + WebPage
 * NOTE: BreadcrumbList is intentionally omitted — handled by <BreadcrumbsJsonLd> component.
 */
export function buildDealServiceJsonLd({
  baseUrl,
  locale,
  path,
  deal,
  title,
  description,
  serviceType,
  category,
  cityName,
  districtName,
  streetAddress,
  telephone,
  lat,
  lng,
  spaLogoUrl,
  businessType,
  spaPhotos = [],
  ratingValue,
  reviewCount,
  reviews = [],
  market = MARKETS.vn,
}: DealServiceJsonLdParams): object[] {
  // Normalize baseUrl — strip trailing slash to avoid double-slash
  const base = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${base}/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  const spaUrl = `${base}/${locale}/provider/${deal.spa.slug}`;

  // ── Images ───────────────────────────────────────────────────────────────────
  // Priority: deal.coverImageUrl → deal.media IMAGE urls → spaPhotos
  // Strip GCS signed URL query params (X-Goog-Expires=900 = 15min TTL → 403 for crawlers)
  const toAbsUrl = (u: string) => {
    const abs = u.startsWith('http') ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`;
    return abs.includes('storage.googleapis.com') && abs.includes('X-Goog-')
      ? abs.split('?')[0]!
      : abs;
  };

  const mediaImages = (deal.media ?? [])
    .filter((m) => m.type === 'IMAGE')
    .toSorted((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => toAbsUrl(m.url));

  const spaPhotoUrls = spaPhotos.map(toAbsUrl);

  const imageSet = new Set<string>();
  if (deal.coverImageUrl) imageSet.add(toAbsUrl(deal.coverImageUrl));
  mediaImages.forEach((u) => imageSet.add(u));
  spaPhotoUrls.slice(0, 3).forEach((u) => imageSet.add(u)); // up to 3 spa photos as supplement

  const imageArray = [...imageSet]; // unique, ordered

  // ── Postal code — try to extract 5-6 digit code from address string ──────────
  const postalMatch = streetAddress?.match(/\b(\d{5,6})\b/);
  const postalCode = postalMatch?.[1] ?? null;

  // ── Clean streetAddress — strip city, postal code, country suffix ─────────────
  // Raw API address: "3 Tô Hiến Thành, An Hải, Sơn Trà, Đà Nẵng 50000, Việt Nam"
  // → cleaned:       "3 Tô Hiến Thành, An Hải, Sơn Trà"
  const cleanedStreetAddress = (() => {
    if (!streetAddress?.trim()) return null;
    let s = streetAddress.trim();
    // Remove postal code
    s = s.replace(/\s*\b\d{5,6}\b\s*/g, ' ');
    // Remove country suffix (Việt Nam / Vietnam / VN)
    s = s.replace(/,?\s*(Việt Nam|Vietnam|VN)\s*$/i, '');
    // Remove city name at the end (if cityName is known)
    const city = cityName ?? deal.spa.cityName;
    if (city) {
      s = s.replace(new RegExp(`,?\\s*${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'), '');
    }
    return s.replace(/,\s*$/, '').trim() || streetAddress.trim();
  })();

  // ── serviceType auto-extraction from variant names (when not passed) ─────────
  const resolvedServiceType: string | string[] | null | undefined = serviceType
    ?? (() => {
      const names = (deal.variants ?? [])
        .map((v) => v.name?.trim())
        .filter((n): n is string => Boolean(n) && n.length < 50);
      return names.length > 0 ? names : null;
    })();


  // ── Offer(s) ─────────────────────────────────────────────────────────────────
  // Collect all prices across all variants; fall back to top-level price fields.
  interface RawPrice { salePrice: number; originalPrice?: number; currency?: string; variantName?: string; }

  const allPrices: RawPrice[] = [];

  // 1. Prices from variants
  for (const variant of deal.variants ?? []) {
    for (const p of variant.prices ?? []) {
      const hasSale = p.salePrice != null && p.salePrice > 0;
      const hasOriginal = p.originalPrice != null && p.originalPrice > 0;
      if (hasSale || hasOriginal) {
        allPrices.push({
          salePrice: hasSale ? p.salePrice : p.originalPrice!,
          originalPrice: p.originalPrice ?? undefined,
          currency: p.currency,
          variantName: variant.name ?? undefined,
        });
      }
    }
  }

  // 2. Fallback to top-level deal price
  if (allPrices.length === 0) {
    const hasSale = deal.salePrice != null && deal.salePrice > 0;
    const hasOriginal = deal.originalPrice != null && deal.originalPrice > 0;
    if (hasSale || hasOriginal) {
      allPrices.push({
        salePrice: hasSale ? deal.salePrice : deal.originalPrice!,
        originalPrice: deal.originalPrice ?? undefined,
        currency: deal.currency,
      });
    }
  }

  const buildOffer = (p: RawPrice | null): Record<string, unknown> => {
    const finalPrice = p != null
      ? p.salePrice
      : ((deal.salePrice != null && deal.salePrice > 0) ? deal.salePrice : ((deal.originalPrice != null && deal.originalPrice > 0) ? deal.originalPrice : 0));

    const o: Record<string, unknown> = {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: p?.currency ?? deal.currency ?? market.currency,
      availability: (deal.isSoldOut || deal.isExpired)
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${spaUrl}#localbusiness` },
      priceValidUntil: deal.endAt
        ? formatTzDate(deal.endAt, market.timezone)
        : formatTzDate(Date.now() + 30 * 864e5, market.timezone),
      price: String(finalPrice),
    };
    if (p != null) {
      if (p.variantName) o.name = p.variantName;

      // Offer.description — formatted price summary for clarity
      const fmtPrice = (n: number, cur: string) => {
        const localeString = cur === 'VND' ? 'vi-VN' : cur === 'PHP' ? 'en-PH' : cur === 'THB' ? 'th-TH' : 'en-US';
        return new Intl.NumberFormat(localeString).format(n) + ` ${cur}`;
      };
      const cur = p.currency ?? deal.currency ?? market.currency;

      if (p.originalPrice && p.originalPrice > p.salePrice) {
        const offerDesc = locale === 'en'
          ? `Sale price ${fmtPrice(p.salePrice, cur)}, original ${fmtPrice(p.originalPrice, cur)}`
          : locale === 'ko'
            ? `할인가 ${fmtPrice(p.salePrice, cur)}, 정가 ${fmtPrice(p.originalPrice, cur)}`
            : `Giá ưu đãi ${fmtPrice(p.salePrice, cur)}, giá gốc ${fmtPrice(p.originalPrice, cur)} khi đặt lịch trước`;
        o.description = offerDesc;

        const originalLabel = locale === 'en'
          ? 'Original price before discount'
          : locale === 'ko'
            ? '할인 전 원래 가격'
            : 'Giá gốc trước ưu đãi';
        o.priceSpecification = {
          '@type': 'UnitPriceSpecification',
          price: String(p.originalPrice),
          priceCurrency: cur,
          description: originalLabel,
        };
      }
    }
    return o;
  };

  const validPrices = allPrices.map((p) => p.salePrice).filter((p) => p > 0);
  let offers: unknown;

  if (validPrices.length > 1) {
    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    if (minPrice !== maxPrice) {
      const cur = allPrices[0]?.currency ?? deal.currency ?? market.currency;
      offers = {
        '@type': 'AggregateOffer',
        url: canonicalUrl,
        priceCurrency: cur,
        lowPrice: String(minPrice),
        highPrice: String(maxPrice),
        offerCount: validPrices.length,
        availability: (deal.isSoldOut || deal.isExpired)
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
        seller: { '@id': `${spaUrl}#localbusiness` },
        priceValidUntil: deal.endAt
          ? formatTzDate(deal.endAt, market.timezone)
          : formatTzDate(Date.now() + 30 * 864e5, market.timezone),
        offers: allPrices.map((p) => buildOffer(p)),
      };
    } else {
      offers = allPrices.map((p) => buildOffer(p));
    }
  } else if (allPrices.length > 0) {
    offers = allPrices.length === 1 ? buildOffer(allPrices[0]!) : allPrices.map((p) => buildOffer(p));
  } else {
    offers = undefined; // no valid price data — omit offer to avoid 'price: 0' error
  }

  const provider: Record<string, unknown> = {
    '@type': businessType || 'HealthAndBeautyBusiness',
    '@id': `${spaUrl}#localbusiness`,
    name: deal.spa.name,
    url: spaUrl,
    address: {
      '@type': 'PostalAddress',
      ...(cleanedStreetAddress ? { streetAddress: cleanedStreetAddress } : {}),
      ...(districtName?.trim() ? { addressRegion: districtName.trim() } : {}),
      ...(cityName ?? deal.spa.cityName ? { addressLocality: cityName ?? deal.spa.cityName } : {}),
      ...(postalCode ? { postalCode } : {}),
      addressCountry: market.countryCode,
    },
  };

  // Telephone
  const formattedPhone = formatInternationalPhone(telephone, market.countryCode);
  if (formattedPhone) provider.telephone = formattedPhone;

  // Geo coordinates — important for local SEO
  const resolvedLat = lat ?? deal.spa.lat;
  const resolvedLng = lng ?? deal.spa.lng;
  if (resolvedLat != null && resolvedLng != null) {
    provider.geo = {
      '@type': 'GeoCoordinates',
      latitude: resolvedLat,
      longitude: resolvedLng,
    };
  }

  // Logo/avatar image for the LocalBusiness entity
  const spaLogoAbsUrl = spaLogoUrl
    ? (spaLogoUrl.startsWith('http') ? spaLogoUrl : `${baseUrl}${spaLogoUrl}`)
    : null;
  if (spaLogoAbsUrl) provider.image = spaLogoAbsUrl;

  // ── Service ──────────────────────────────────────────────────────────────────
  const service: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonicalUrl}#service`,
    name: title,
    description: description ?? title,
    url: canonicalUrl,
    provider,
    // areaServed: use city when known, fall back to Country
    areaServed: (cityName ?? deal.spa.cityName)
      ? { '@type': 'City', name: cityName ?? deal.spa.cityName }
      : { '@type': 'Country', name: market.countryCode },
    offers,
  };

  // serviceType — use resolved value (auto from variants or explicit param)
  if (resolvedServiceType) {
    const st = Array.isArray(resolvedServiceType) ? resolvedServiceType : [resolvedServiceType];
    const filtered = st.map((s) => s.trim()).filter(Boolean);
    if (filtered.length > 0) service.serviceType = filtered.length === 1 ? filtered[0] : filtered;
  }

  // category — avoid HTML entities by normalizing the string
  if (category?.trim()) service.category = category.trim().replace(/&amp;/g, '&');

  // Image array — Google prefers multiple images; fallback to spa logo if no deal images
  if (imageArray.length > 0) {
    service.image = imageArray.length === 1 ? imageArray[0] : imageArray;
  } else if (spaLogoAbsUrl) {
    service.image = spaLogoAbsUrl;
  }

  // Review[] — up to 5 most recent internal reviews (filter out Google Maps reviews to comply with policies)
  const internalReviews = reviews.filter(r => !(r as any).googleMapsUri);

  // AggregateRating
  let finalReviewCount = reviewCount ?? deal.spa.reviewCount ?? 0;
  let finalRatingValue = ratingValue ?? deal.spa.ratingValue ?? 0;

  if (finalReviewCount === 0 && internalReviews.length > 0) {
    finalReviewCount = internalReviews.length;
    finalRatingValue = internalReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / internalReviews.length;
  }

  if (finalReviewCount > 0 && finalRatingValue > 0) {
    provider.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(finalRatingValue.toFixed(1)),
      reviewCount: finalReviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (internalReviews.length > 0 && provider.aggregateRating) {
    provider.review = internalReviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.authorName },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
        bestRating: 5,
        worstRating: 1,
      },
      ...(r.content?.trim() ? { reviewBody: r.content.trim() } : {}),
      ...(r.reviewedAt ? { datePublished: r.reviewedAt.split('T')[0] } : {}),
    }));
  }

  // ── WebPage ──────────────────────────────────────────────────────────────────
  const webPage: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: title,
    description: description ?? title,
    isPartOf: { '@id': `${base}/#website` },
    about: { '@id': `${canonicalUrl}#service` },
    inLanguage: locale,
  };

  if (imageArray.length > 0) {
    webPage.primaryImageOfPage = { '@type': 'ImageObject', url: imageArray[0] };
  }

  // BreadcrumbList intentionally omitted — <BreadcrumbsJsonLd> emits it.
  return [service, webPage];
}




export interface BreadcrumbParams {
  baseUrl: string;
  locale: string;

  product: any;

  t: any;
}

export interface ProductJsonLdParams {
  baseUrl: string;
  locale: string;
  market?: MarketConfig;

  product: any;

  t: any;
}

/**
 * Build BreadcrumbList JSON-LD for the phone detail page.
 */
export function buildBreadcrumbJsonLd({ baseUrl, locale, product, t }: BreadcrumbParams): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': t('breadcrumb_home', 'Home'),
        'item': {
          '@id': `${baseUrl}/${locale}`,
        },
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': t('breadcrumb_phone', 'Phone'),
        'item': {
          '@id': `${baseUrl}/${locale}/phones/`,
        },
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': `${product?.name || 'Phone'}${product?.brand?.name ? ` (${product.brand.name})` : ''}`,
        'item': {
          '@id': `${baseUrl}/${locale}/phones/${product?.slug}`,
        },
      },
    ],
  };
}

/**
 * Get price valid until date (1 year from now).
 */
function getPriceValidUntil(timeZone: string): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return formatTzDate(d, timeZone);
}

/**
 * Build Product JSON-LD for the phone detail page.
 * Includes offers, aggregateRating, and review.
 */
export function buildProductJsonLd({ baseUrl, locale, market = MARKETS.vn, product, t }: ProductJsonLdParams): object {
  const pageUrl = `${baseUrl}/${locale}/phones/${product?.slug}`;
  const productId = `${baseUrl}/phones/${product?.slug}#product`;

  const fallbackDesc = t(
    'schema_product.fallbackDescription',
    `${product?.name || 'Smartphone'} — ${product?.short_description || 'Available at GlowExplore'}`,
    { name: product?.name, desc: product?.short_description },
  );

  const primaryImg: string = product?.image || product?.media?.[0]?.original_url || '/common/logo.svg';
  const imageAbs: string = primaryImg.startsWith('http') ? primaryImg : `${Env.NEXT_PUBLIC_APP_URL}${primaryImg}`;

  const priceValidUntil = getPriceValidUntil(market.timezone);

  const offers = (product?.variants || []).map((variant: any) => ({
    '@type': 'Offer',
    'url': pageUrl,
    'priceCurrency': market.currency,
    'price': String(Number(variant?.ne_price ?? 0)),
    'priceValidUntil': priceValidUntil,
    'availability': variant?.is_out_of_stock
      ? 'https://schema.org/OutOfStock'
      : 'https://schema.org/InStock',
    'itemCondition': 'https://schema.org/NewCondition',
    'seller': {
      '@type': 'Organization',
      'name': 'GlowExplore',
      'url': baseUrl,
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': market.countryCode,
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'availableLanguage': ['English', 'Spanish'],
      },
      'sameAs': [
        'https://www.facebook.com/GlowExplore',
        'https://twitter.com/GlowExplore',
      ],
    },
  }));

  const additionalProperty = [
    product?.camera && {
      '@type': 'PropertyValue',
      'name': 'Camera',
      'value': product.camera,
    },
    product?.battery && {
      '@type': 'PropertyValue',
      'name': 'Battery',
      'value': product.battery,
    },
    product?.memory && {
      '@type': 'PropertyValue',
      'name': 'RAM',
      'value': product.memory,
    },
    product?.display && {
      '@type': 'PropertyValue',
      'name': 'Display',
      'value': product.display,
    },
    product?.system?.name && {
      '@type': 'PropertyValue',
      'name': 'Operating System',
      'value': product.system.name,
    },
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productId,
    'name': product?.name || 'Smartphone',
    'description': product?.short_description || fallbackDesc,
    'image': [imageAbs],
    'brand': {
      '@type': 'Brand',
      'name': product?.brand?.name || 'Unknown',
    },
    'offers': offers,
    'additionalProperty': additionalProperty,
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': 4.8,
      'reviewCount': 12,
    },
    'review': {
      '@type': 'Review',
      'datePublished': '2025-08-20T22:50:08',
      'reviewBody': 'customer review',
      'author': {
        '@type': 'Person',
        'name': 'Customer name',
      },
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': 1,
      },
    },
  };
}

export interface HomeJsonLdParams {
  baseUrl: string;
  locale: string;
  market?: MarketConfig;
  tMain: any; // translate function for 'main-menu' namespace
  tHome: any; // translate function for 'home' namespace
}

export interface SpaLocalBusinessJsonLdParams {
  baseUrl: string;
  locale: string;
  market?: MarketConfig;
  path: string;
  spa: SpaDetailDto;
  /** Up to N reviews to embed as Review[] nodes (default: use spa.reviews) */
  reviews?: Array<{
    id: string | number;
    authorName: string;
    rating: number;
    content?: string | null;
    reviewedAt?: string | null;
  }>;
}

/** Decode HTML entities (&amp; → &, &lt; → <, etc.) for use in JSON-LD text fields. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function toAbsoluteUrl(baseUrl: string, value: string) {
  return value.startsWith('http') ? value : `${baseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
}

function buildOpeningHoursSpecification(spa: SpaDetailDto) {
  const dayMap = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Filter out placeholder "00:00–00:00" entries, then dedupe by day
  // (keep last valid entry per day in case BE sends duplicates)
  const validEntries = (spa.openingHours || []).filter(
    (item) => !(item.openTime === '00:00' && item.closeTime === '00:00'),
  );
  const byDay = new Map<number, typeof validEntries[number]>();
  for (const item of validEntries) {
    byDay.set(item.day, item);
  }

  return Array.from(byDay.values()).map((item) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: dayMap[item.day],
    opens: item.openTime,
    closes: item.closeTime,
  }));
}

export function buildSpaLocalBusinessJsonLd({
  baseUrl,
  locale,
  market = MARKETS.vn,
  path,
  spa,
  reviews,
}: SpaLocalBusinessJsonLdParams): object[] {
  // Normalize baseUrl — strip trailing slash to avoid double-slash in URLs
  const base = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${base}/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  const fallbackImage = `${base}/common/logo_header.png`;

  const photos: string[] = Array.isArray(spa.photos) ? spa.photos : [];
  const primaryImage = photos[0]
    ? stripSignedUrl(toAbsoluteUrl(base, photos[0]))
    : fallbackImage;

  // ── description — fallback uses deal titles + location + rating when spa.description is null
  const spaDescription = (() => {
    const raw = spa.description?.trim();
    if (raw) return raw;

    const parts: string[] = [spa.name];

    // Location context
    const loc = [spa.location?.districtName, spa.location?.cityName].filter(Boolean).join(', ');
    if (loc) parts.push(`– ${loc}`);

    // Deal titles with discount %
    const dealSnippets = (spa.deals ?? [])
      .slice(0, 3) // up to 3 deals to keep description concise
      .map((d) => {
        const pct = d.discountPercent ? ` -${String(d.discountPercent).replace(/^-/, '')}` : '';
        return `${d.title}${pct}`;
      })
      .filter(Boolean);
    if (dealSnippets.length > 0) parts.push(dealSnippets.join(', '));

    // Rating — locale-aware
    if (spa.reviewCount > 0) {
      const ratingLabel: Record<string, string> = {
        vi: `Đánh giá ${spa.ratingValue}/5 (${spa.reviewCount} reviews).`,
        en: `Rated ${spa.ratingValue}/5 (${spa.reviewCount} reviews).`,
        ko: `평점 ${spa.ratingValue}/5 (${spa.reviewCount}개 리뷰).`,
      };
      parts.push(ratingLabel[locale] ?? ratingLabel['en']!);
    }

    return parts.join('. ') || undefined;
  })();

  // ── priceRange — derived from deal salePrice list ─────────────────────────
  const priceRange = (() => {
    const deals = spa.deals || [];
    const prices = deals
      .map((d) => (d.salePrice != null && d.salePrice > 0) ? d.salePrice : d.originalPrice)
      .filter((p): p is number => p != null && p > 0);
    if (prices.length === 0) return undefined;
    const currency = deals.find((d) => d.salePrice != null || d.originalPrice != null)?.currency ?? market.currency;
    const localeString = currency === 'VND' ? 'vi-VN' : currency === 'PHP' ? 'en-PH' : currency === 'THB' ? 'th-TH' : 'en-US';
    const fmt = (n: number) => new Intl.NumberFormat(localeString).format(n);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${fmt(min)} ${currency}` : `${fmt(min)} – ${fmt(max)} ${currency}`;
  })();

  // ── offers — build from spa.deals[] for Google rich snippets ───────────────
  const buildSpaOffer = (deal: (typeof spa.deals)[number]) => {
    const pct = deal.discountPercent
      ? ` -${String(deal.discountPercent).replace(/^-/, '')}`
      : '';
    const dealSlug = deal.canonicalSlug || deal.slug;
    const offerUrl = `${base}/${locale}/organization_services/${dealSlug}`;

    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      name: `${deal.title}${pct}`,
      url: offerUrl,
      priceCurrency: deal.currency ?? market.currency,
      availability: 'https://schema.org/InStock',
      price: (deal.salePrice != null && deal.salePrice > 0) ? String(deal.salePrice) : ((deal.originalPrice != null && deal.originalPrice > 0) ? String(deal.originalPrice) : '0'),
    };

    if (deal.startAt) {
      offer.validFrom = formatTzDate(deal.startAt, market.timezone);
    }
    offer.priceValidUntil = deal.endAt
      ? formatTzDate(deal.endAt, market.timezone)
      : formatTzDate(Date.now() + 30 * 864e5, market.timezone);

    return offer;
  };

  const spaOffers = (() => {
    const validDeals = (spa.deals ?? []).filter(
      (d) => (d.salePrice != null && d.salePrice > 0) || (d.originalPrice != null && d.originalPrice > 0)
    );
    if (validDeals.length === 0) return undefined;
    if (validDeals.length === 1) return buildSpaOffer(validDeals[0]!);
    return validDeals.map(buildSpaOffer);
  })();


  const businessType = resolveLocalBusinessTypes(spa.services);

  const localBusiness: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': businessType,
    '@id': `${canonicalUrl}#localbusiness`,
    name: decodeHtmlEntities(spa.name),
    url: canonicalUrl,
    logo: primaryImage,
    image: photos.length > 0
      ? photos.map((p) => stripSignedUrl(toAbsoluteUrl(base, p)))
      : [fallbackImage],
    telephone: formatInternationalPhone(spa.contact.phone, market.countryCode),
    ...(priceRange ? { priceRange } : {}),
    ...(spaOffers ? { offers: spaOffers } : {}),
    ...(spaDescription ? { description: decodeHtmlEntities(spaDescription) } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: spa.address ?? spa.location?.addressLine ?? undefined,
      addressLocality: spa.location?.districtName ?? undefined,
      addressRegion: spa.location?.cityName ?? undefined,
      addressCountry: market.countryCode,
    },
    geo: spa.location?.lat != null && spa.location?.lng != null
      ? {
        '@type': 'GeoCoordinates',
        latitude: spa.location?.lat,
        longitude: spa.location?.lng,
      }
      : undefined,
    openingHoursSpecification: buildOpeningHoursSpecification(spa),
    hasMap: spa.googleMapsUri ? decodeHtmlEntities(spa.googleMapsUri) : undefined,
    // sameAs — helps Google verify business identity
    sameAs: [
      spa.googleMapsUri,
      spa.googleMapsLinks?.placeUri,
      spa.contact.facebook,
      spa.contact.instagram,
      spa.contact.zalo,
      spa.contact.whatsapp,
      spa.contact.kakaotalk,
    ]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .map(decodeHtmlEntities),
  };

  // Review[] — embed up to 5 individual reviews for Rich Results snippets
  const reviewSource = reviews ?? (spa.reviews as Array<{
    id: string | number;
    authorName: string;
    rating?: number;
    ratingValue?: number;
    content?: string | null;
    reviewedAt?: string | null;
    createdAt?: string | null;
  }> | undefined);

  const reviewNodes = (reviewSource || [])
    .filter((r) => !(r as any).googleMapsUri && r.content?.trim()) // Exclude Google Maps reviews and require non-empty body
    .slice(0, 5)
    .map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.authorName },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Math.min(
          5,
          Math.max(1, Math.round(Number((r as any).rating ?? (r as any).ratingValue ?? 5))),
        ),
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.content!.trim(),
      ...(r.reviewedAt ?? (r as any).createdAt
        ? { datePublished: (r.reviewedAt ?? (r as any).createdAt)!.split('T')[0] }
        : {}),
    }));

  let finalReviewCount = spa.reviewCount || 0;
  let finalRatingValue = spa.ratingValue || 0;

  if (finalReviewCount === 0 && reviewNodes.length > 0) {
    finalReviewCount = reviewNodes.length;
    finalRatingValue = reviewNodes.reduce((acc, r) => acc + (Number(r.reviewRating.ratingValue) || 5), 0) / reviewNodes.length;
  }

  if (finalReviewCount > 0 && finalRatingValue > 0) {
    localBusiness.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(finalRatingValue.toFixed(1)),
      reviewCount: finalReviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (reviewNodes.length > 0 && localBusiness.aggregateRating) {
    localBusiness.review = reviewNodes;
  }

  // WebPage.description: use spa description (not physical address)
  const pageDescription = spaDescription
    ? decodeHtmlEntities(spaDescription)
    : decodeHtmlEntities(spa.name);

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: decodeHtmlEntities(spa.name),
    description: pageDescription,
    isPartOf: {
      '@id': `${base}/#website`,
    },
    about: {
      '@id': `${canonicalUrl}#localbusiness`,
    },
    inLanguage: locale,
  };

  return [localBusiness, webPage];
}

export interface CollectionPageJsonLdParams {
  baseUrl: string;
  locale: string;
  path: string;
  title: string;
  description: string;
  items?: Array<{
    '@type'?: 'Offer' | 'DaySpa' | 'HealthAndBeautyBusiness' | 'LocalBusiness' | string;
    name: string;
    url: string;

    // For Offer
    price?: string;
    priceCurrency?: string;
    priceValidUntil?: string;
    availability?: string;
    seller?: { '@type': string; name: string };

    // For Spa/LocalBusiness
    image?: string;
    aggregateRating?: {
      '@type': 'AggregateRating';
      ratingValue: number;
      reviewCount: number;
    };
  }>;
}

/**
 * Build CollectionPage JSON-LD for category/list pages.
 * Includes an ItemList of the results.
 */
export function buildCollectionPageJsonLd({
  baseUrl,
  locale,
  path,
  title,
  description,
  items,
}: CollectionPageJsonLdParams): object {
  const base = baseUrl.replace(/\/+$/, '');
  const canonicalUrl = `${base}/${locale}${path.startsWith('/') ? path : `/${path}`}`;

  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    isPartOf: {
      '@id': `${base}/#website`,
    },
    inLanguage: locale,
  };

  if (items && items.length > 0) {
    baseSchema.mainEntity = {
      '@type': 'ItemList',
      itemListElement: items.map((item, idx) => {
        const itemUrl = item.url.startsWith('http') ? item.url : `${base}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
        if (item['@type'] === 'Offer') {
          return {
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Offer',
              name: decodeHtmlEntities(item.name),
              url: itemUrl,
              price: item.price,
              priceCurrency: item.priceCurrency,
              priceValidUntil: item.priceValidUntil,
              availability: item.availability,
              ...(item.seller ? { seller: item.seller } : {}),
            }
          };
        }
        return {
          '@type': 'ListItem',
          position: idx + 1,
          item: {
            '@type': item['@type'] || 'LocalBusiness',
            name: decodeHtmlEntities(item.name),
            url: itemUrl,
            ...(item.image ? { image: item.image } : {}),
            ...(item.aggregateRating ? { aggregateRating: item.aggregateRating } : {}),
          }
        };
      }),
    };
  }

  return baseSchema;
}


/**
 * Build WebSite and Organization JSON-LD for the Home Page.
 */
export function buildHomeOrganizationJsonLd({ baseUrl, locale, market = MARKETS.vn, tMain, tHome }: HomeJsonLdParams): object[] {
  const base = baseUrl.replace(/\/+$/, ''); // strip trailing slash
  const url = `${base}/${locale}`;
  const address = tMain('footer.main_footer.information.address', 'Xuân Thủy, Cầu Giấy, Hà Nội');
  const phone = tMain('footer.main_footer.information.phone', '0123 456 789');
  const email = tMain('footer.main_footer.information.email', 'Support@glowexplore.com');
  const desc = tMain('footer.main_footer.description', '');

  const companyName = 'GlowExplore';

  const brandOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#brand`,
    'name': 'Glow',
    'url': base,
    'logo': `${base}/common/logo_header.png`,
    'sameAs': [
      'https://www.facebook.com/GlowExplore',
      'https://twitter.com/GlowExplore'
    ]
  };

  const localOrgId = `${base}/#organization-${market.countryCode.toLowerCase()}`;
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': localOrgId,
    'name': `${companyName} ${market.countryCode}`,
    'url': `${base}/${locale}`,
    'description': desc,
    'telephone': phone,
    'email': email,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': address,
      'addressCountry': market.countryCode,
      'addressRegion': 'Hanoi',
    },
    'sameAs': [
      'https://www.facebook.com/GlowExplore',
      'https://twitter.com/GlowExplore'
    ]
  };

  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}/#webpage`,
    'url': url,
    // decode HTML entities (e.g. &amp; → &) — JSON-LD must use plain text
    'name': tHome('seo.title', `${companyName} - Home`).replace(/&amp;/g, '&'),
    'description': tHome('seo.description', desc),
    'isPartOf': {
      '@id': `${base}/#website`,
    },
    'about': {
      '@id': localOrgId,
    },
  };

  // WebSite is emitted by the root layout (buildWebSiteJsonLd) for every page.
  // Return only Organization + WebPage here to avoid duplicate @id.
  return [brandOrganization, organization, webpage];
}
