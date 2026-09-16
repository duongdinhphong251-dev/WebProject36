import { notFound } from "next/navigation";
import type { LocaleTypes } from "@/i18n/settings";
import type { Metadata } from "next";
import { PageTemplate } from "@/components/page/services-slug/PageTemplate";
import { resolvePage } from "@/services/api/spa-api";
import { buildPageMetadataCommon } from "@/libs/seo";
import { parseLonLatFromSearch } from "@/libs/geo-url-params";
import { parseCoordsFromLocationCookie } from "@/libs/geo-server";

type Props = {
  params: Promise<{ locale: LocaleTypes; serviceSlug: string; geo: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, serviceSlug, geo } = await params;

  // Only support city (1 segment) and district (2 segments) level
  if (geo.length === 0 || geo.length > 2) return {};

  try {
    const url = `/${serviceSlug}/${geo.join("/")}`;
    const payload = await resolvePage({ url, locale });

    const { title, metaDescription, indexable } = payload.seoMeta;

    const meta = buildPageMetadataCommon({
      locale,
      path: url,
      title: title ?? "",
      description: metaDescription ?? "",
      ogTitle: title ?? undefined,
      ogDescription: metaDescription ?? undefined,
    });

    if (indexable === false) {
      return { ...meta, robots: { index: false, follow: false } };
    }
    return meta;
  } catch {
    return {};
  }
}

export default async function ServiceGeoCategoryPage({ params, searchParams }: Props) {
  const { locale, serviceSlug, geo } = await params;

  // Only support city (1 segment) and district (2 segments) level
  if (geo.length === 0 || geo.length > 2) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const urlCoords = parseLonLatFromSearch(sp);
  const coords = urlCoords ?? (await parseCoordsFromLocationCookie());
  const priceSort = sp.priceSort as string | undefined;
  const sortBy = sp.sortBy as string | undefined;
  const minRatingRaw = sp.minRating as string | undefined;
  const minRating = minRatingRaw ? parseFloat(minRatingRaw) : undefined;
  const minPriceRaw = sp.minPrice as string | undefined;
  const minPrice = minPriceRaw ? parseFloat(minPriceRaw) : undefined;
  const maxPriceRaw = sp.maxPrice as string | undefined;
  const maxPrice = maxPriceRaw ? parseFloat(maxPriceRaw) : undefined;
  const isOpenNow = sp.isOpenNow === 'true' || sp.open === 'true';
  const pageRaw = sp.page as string | undefined;
  const pageParsed = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = isNaN(pageParsed) || pageParsed < 1 ? 1 : pageParsed;

  const url = `/${serviceSlug}/${geo.join("/")}`;

  let payload;
  try {
    payload = await resolvePage({
      url,
      locale,
      page,
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      ...(priceSort ? { priceSort } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(minRating && minRating > 0 ? { minRating } : {}),
      ...(isOpenNow ? { isOpenNow: true } : {}),
      ...(minPrice !== undefined && !isNaN(minPrice) ? { minPrice } : {}),
      ...(maxPrice !== undefined && !isNaN(maxPrice) ? { maxPrice } : {}),
    });
  } catch (error: any) {
    console.error("[ServiceGeoCategoryPage] resolvePage error:", error);
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
      resolveUrl={`/${serviceSlug}/${geo.join("/")}`}
      lat={coords?.lat}
      lng={coords?.lng}
    />
  );
}
