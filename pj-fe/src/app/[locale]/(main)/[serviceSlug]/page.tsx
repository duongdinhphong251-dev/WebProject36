import { notFound } from "next/navigation";
import type { LocaleTypes } from "@/i18n/settings";
import type { Metadata } from "next";
import { PageTemplate } from "@/components/page/services-slug/PageTemplate";
import { resolvePage } from "@/services/api/spa-api";
import { parseLonLatFromSearch } from "@/libs/geo-url-params";
import { parseCoordsFromLocationCookie } from "@/libs/geo-server";
import { buildPageMetadataCommon } from "@/libs/seo";
import { SERVICE_SLUGS, ALL_SERVICE_KEYS, resolveServiceKey } from "@/constants/services";
import { getTranslation } from "@/i18n/server-cache";
import type { SeoMetaDto } from "@/types/api";

type Props = {
  params: Promise<{ locale: LocaleTypes; serviceSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Returns true if the slug starts with a known service prefix for the given locale.
 * e.g. "massage-ha-noi" → true (starts with "massage")
 *      "ha-noi"         → false (no service prefix)
 */
function hasServicePrefix(slug: string, locale: LocaleTypes): boolean {
  return ALL_SERVICE_KEYS.some((key) => {
    const serviceSlug = SERVICE_SLUGS[key][locale];
    return slug === serviceSlug || slug.startsWith(`${serviceSlug}-`);
  });
}

async function enrichSeoMetaFallback(
  seoMeta: SeoMetaDto,
  serviceSlug: string,
  locale: LocaleTypes
): Promise<SeoMetaDto> {
  // If it already has breadcrumbs with length >= 2, it's likely a fully populated SEO record from BE
  if (seoMeta.breadcrumbs && seoMeta.breadcrumbs.length >= 2) {
    return seoMeta;
  }

  const serviceKey = resolveServiceKey(serviceSlug, locale);
  if (!serviceKey) return seoMeta;

  const [{ t }, { t: tMain }] = await Promise.all([
    getTranslation(locale, "home"),
    getTranslation(locale, "main-menu")
  ]);

  const categoryName = t(`home.services.${serviceKey}`);
  const homeLabel = tMain("breadcrumb_home", "Home");

  const isGenericTitle = !seoMeta.title || seoMeta.title === "Glow Explore - Home" || seoMeta.title === "GlowExplore";

  const fallbackTitle = `${categoryName} | Glow Explore`;
  const fallbackDesc = locale === 'vi'
    ? `Khám phá các dịch vụ ${categoryName} tốt nhất trên Glow Explore.`
    : locale === 'ko'
      ? `Glow Explore에서 최고의 ${categoryName} 서비스를 발견하세요.`
      : `Discover the best ${categoryName} services on Glow Explore.`;

  return {
    ...seoMeta,
    h1: seoMeta.h1 || categoryName,
    title: isGenericTitle ? fallbackTitle : seoMeta.title,
    metaDescription: seoMeta.metaDescription || fallbackDesc,
    breadcrumbs: [
      { label: homeLabel, url: `/${locale}` },
      { label: categoryName, url: `/${locale}/${serviceSlug}` },
    ],
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale, serviceSlug } = await params;
  const sp = (await searchParams) ?? {};
  const priceSort = sp.priceSort as string | undefined;
  const sortBy = sp.sortBy as string | undefined;
  const minRatingRaw = sp.minRating as string | undefined;
  const minRating = minRatingRaw ? parseFloat(minRatingRaw) : undefined;

  // City-only URL — noindex, no API call
  if (!hasServicePrefix(serviceSlug, locale)) {
    return { robots: { index: false, follow: false } };
  }

  try {
    // Do NOT send lat/lng to generateMetadata — canonical URL must be geo-neutral
    const payload = await resolvePage({
      url: serviceSlug,
      locale,
      ...(priceSort ? { priceSort } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(minRating && minRating > 0 ? { minRating } : {}),
    });

    payload.seoMeta = await enrichSeoMetaFallback(payload.seoMeta, serviceSlug, locale);

    const { title, metaDescription, indexable } = payload.seoMeta;

    const meta = buildPageMetadataCommon({
      locale,
      path: `/${serviceSlug}`,
      title: title ?? "",
      description: metaDescription ?? "",
      ogTitle: title ?? undefined,
      ogDescription: metaDescription ?? undefined,
    });

    if (indexable === false) {
      return { ...meta, robots: { index: false, follow: false } };
    }
    return meta;
  } catch (error) {
    console.error(
      '[generateMetadata] resolvePage failed',
      { serviceSlug, locale, error: error instanceof Error ? error.message : String(error) },
    );
    return {};
  }
}

export default async function ServiceCategoryPage({
  params,
  searchParams,
}: Props) {
  const { locale, serviceSlug } = await params;

  const sp = (await searchParams) ?? {};
  const urlCoords = parseLonLatFromSearch(sp);

  const coords = urlCoords ?? (await parseCoordsFromLocationCookie());
  const priceSort = sp.priceSort as string | undefined;
  const sortBy = sp.sortBy as string | undefined;
  const minRatingRaw2 = sp.minRating as string | undefined;
  const minRating2 = minRatingRaw2 ? parseFloat(minRatingRaw2) : undefined;
  const minPriceRaw = sp.minPrice as string | undefined;
  const minPrice = minPriceRaw ? parseFloat(minPriceRaw) : undefined;
  const maxPriceRaw = sp.maxPrice as string | undefined;
  const maxPrice = maxPriceRaw ? parseFloat(maxPriceRaw) : undefined;
  const isOpenNow = sp.isOpenNow === 'true' || sp.open === 'true';
  const pageRaw = sp.page as string | undefined;
  const pageParsed = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = isNaN(pageParsed) || pageParsed < 1 ? 1 : pageParsed;

  let payload;
  try {
    payload = await resolvePage({
      url: serviceSlug,
      locale,
      page,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      ...(priceSort ? { priceSort } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(minRating2 && minRating2 > 0 ? { minRating: minRating2 } : {}),
      ...(isOpenNow ? { isOpenNow: true } : {}),
      ...(minPrice !== undefined && !isNaN(minPrice) ? { minPrice } : {}),
      ...(maxPrice !== undefined && !isNaN(maxPrice) ? { maxPrice } : {}),
    });

    payload.seoMeta = await enrichSeoMetaFallback(payload.seoMeta, serviceSlug, locale);
  } catch (error: any) {
    console.error(
      '[ServiceCategoryPage] resolvePage failed',
      { serviceSlug, locale, error: error instanceof Error ? error.message : String(error) },
    );
    if (error?.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!payload || payload.pageType === 'not_found') {
    notFound();
  }

  return (
    <PageTemplate
      payload={payload}
      locale={locale}
      resolveUrl={serviceSlug}
      lat={coords?.lat}
      lng={coords?.lng}
    />
  );
}
