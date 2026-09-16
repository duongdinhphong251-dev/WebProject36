import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import type { LocaleTypes } from "@/i18n/settings";
import type { DealDetailDto } from "@/types/deal-detail";

import {
  Breadcrumbs,
  BreadcrumbsJsonLd,
} from "@/components/common/breadcrumbs";
import { BreadcrumbBannerSection } from "@/components/common/banners/BreadcrumbBanner";
import { LocalizedSlugSync } from "@/components/common/LocalizedSlugSync";
import { SpaBannerCarousel } from "@/components/page/spa-detail/SpaBannerCarousel";
import { DealMobileBottomBar } from "@/components/page/deal-slug/DealMobileBottomBar";
import { DealMobileHeader } from "@/components/page/deal-slug/DealMobileHeader";
import { DealInfo } from "@/components/page/deal-slug/DealInfo";
import { OtherDealsAtSpa } from "@/components/page/deal-slug/OtherDealsAtSpa";
import { DealEmptyState } from "@/components/page/deal-slug/EmptyState";

import { SimilarSpas } from "@/components/page/deal-slug/SimilarSpas";
import { YouMayAlsoLike } from "@/components/page/deal-slug/YouMayAlsoLike";
import { DealSidebar } from "@/components/page/deal-slug/DealSidebar";
import { DealMobileSpaInfo } from "@/components/page/deal-slug/DealMobileSpaInfo";
import { EngagementBeacon } from "@/components/tracking/EngagementBeacon";
import { Container } from "@/components/ui/container";

import { getTranslation } from "@/i18n/server-cache";
import { Env } from "@/libs/Env";
import { formatPrice } from "@/helpers/numbers";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { dealSlugForCanonicalMatch, dealTrackingSlug } from "@/libs/deal-slug";
import { buildPageMetadataCommon } from "@/libs/seo";
import { parseCoordsFromLocationCookie } from "@/libs/geo-server";
import { buildDealServiceJsonLd, resolveLocalBusinessTypes } from "@/libs/seo/schema-builder";
import { getDealBySlug } from "@/services/api/deals";
import { getSpaBySlug } from "@/services/api/spa-api";
import { SERVICE_SLUGS } from "@/constants/services";
import { buildSeoUrl } from "@/libs/filter-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ locale: LocaleTypes; dealSlug: string }> };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function redirectIfSlugNotCanonical(
  locale: LocaleTypes,
  dealSlug: string,
  deal: DealDetailDto,
) {
  const canonical = dealSlugForCanonicalMatch(
    deal.canonicalSlug ?? deal.slug ?? String(deal.id),
  );
  const requested = dealSlugForCanonicalMatch(dealSlug);
  if (canonical && requested !== canonical) {
    permanentRedirect(
      `/${locale}/organization_services/${encodeURIComponent(canonical)}`,
    );
  }
}

function resolveBannerPhotos(deal: DealDetailDto): string[] {
  if (deal.photos && deal.photos.length > 0) return deal.photos;
  if (deal.media && deal.media.length > 0) {
    return deal.media
      .filter((m) => m.type === "IMAGE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => m.url);
  }
  if (deal.coverImageUrl) return [deal.coverImageUrl];
  if (deal.spa.photos && deal.spa.photos.length > 0) return deal.spa.photos;
  return [];
}


// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, dealSlug } = await params;
  const deal = await getDealBySlug(dealSlug, locale);

  console.log("deal", deal);

  if (!deal) {
    return { robots: { index: false, follow: false } };
  }

  const title = deal.title ?? dealSlug;
  const rawContent = deal.content?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const description =
    deal.shortDescription?.trim() ||
    (rawContent ? rawContent.slice(0, 160) : null) ||
    title;

  const keywords = [
    title,
    deal.spa.name,
    deal.spa.cityName,
    locale === "vi" ? "deal spa" : locale === "ko" ? "스파 딜" : "spa deal",
    locale === "vi"
      ? "giảm giá làm đẹp"
      : locale === "ko"
        ? "뷰티 할인"
        : "beauty discount",
  ].filter(Boolean) as string[];

  return buildPageMetadataCommon({
    locale,
    path: `/organization_services/${deal.canonicalSlug ?? dealSlug}`,
    title: title ?? "",
    description,
    images: (() => {
      const raw = deal.coverImageUrl ?? deal.spa.spaAvatarUrl ?? undefined;
      if (!raw) return undefined;
      // Strip GCS signed params (X-Goog-Expires=900 → 403 for crawlers)
      return raw.includes('storage.googleapis.com') && raw.includes('X-Goog-')
        ? raw.split('?')[0]
        : raw;
    })(),
    keywords,
    ogTitle: title ?? "",
    ogDescription: description,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DealDetailPage({ params }: Props) {
  const { locale, dealSlug } = await params;

  // getTranslation và getDealBySlug độc lập → chạy song song
  const [{ t }, deal, { t: tMenu }, coords] = await Promise.all([
    getTranslation(locale, "deal-detail"),
    getDealBySlug(dealSlug, locale),
    getTranslation(locale, "main-menu"),
    parseCoordsFromLocationCookie(),
  ]);

  // Log chi tiết deal
  console.log("=== DEAL DETAILS ===", JSON.stringify(deal, null, 2));

  // ── Not found ──
  if (!deal) {
    return (
      <div className="min-h-screen bg-app-bg overflow-x-clip">
        <section className="hidden py-4 lg:block max-sm:py-2">
          <Container maxWidth="xl">
            <Breadcrumbs
              items={[
                { label: t("breadcrumb.home"), url: `/${locale}` },
                { label: dealSlug, url: "#" },
              ]}
            />
          </Container>
        </section>
        <BreadcrumbBannerSection locale={locale} sectionClassName="hidden py-3 lg:block" maxWidth="xl" />
        <Container maxWidth="xl">
          <DealEmptyState variant="not_found" locale={locale} />
          <YouMayAlsoLike locale={locale} />
        </Container>
      </div>
    );
  }

  redirectIfSlugNotCanonical(locale, dealSlug, deal);

  const dealTitle = deal.title;
  const spaDetail = await getSpaBySlug(deal.spa.slug, {
    locale,
    lat: coords?.lat,
    lng: coords?.lng
  });
  const bizType = spaDetail ? resolveLocalBusinessTypes(spaDetail.services) : "HealthAndBeautyBusiness";

  // ── Unavailable (expired / sold out) ──
  const isExpired =
    deal.isExpired ?? (deal.endAt ? new Date(deal.endAt) < new Date() : false);
  const isSoldOut = deal.isSoldOut ?? false;

  if (isExpired || isSoldOut) {
    return (
      <div className="min-h-screen bg-app-bg overflow-x-clip">
        <EngagementBeacon slug={dealTrackingSlug(deal)} entityType="deal" />
        <section className="hidden py-4 lg:block max-sm:py-2">
          <Container maxWidth="xl">
            <Breadcrumbs
              items={[
                { label: t("breadcrumb.home"), url: `/${locale}` },
                {
                  label: deal.spa.name,
                  url: `/${locale}/provider/${deal.spa.slug}`,
                },
                { label: dealTitle, url: "#" },
              ]}
            />
          </Container>
        </section>
        <BreadcrumbBannerSection locale={locale} sectionClassName="hidden py-3 lg:block" maxWidth="xl" />
        <Container maxWidth="xl">
          <DealEmptyState
            variant={isSoldOut ? "sold_out" : "expired"}
            locale={locale}
          />
          <YouMayAlsoLike locale={locale} />
        </Container>
      </div>
    );
  }

  // ── Build structured data — all from deal.spa (enriched by BE) ──
  const spa = deal.spa;
  if (spaDetail?.contact) {
    spa.contact = {
      ...spa.contact,
      ...spaDetail.contact,
    } as any;
  }
  if (spaDetail?.openingHours) {
    (spa as any).openingHours = spaDetail.openingHours;
  }
  if (spaDetail?.distanceKm != null) {
    spa.distanceKm = spaDetail.distanceKm;
  }
  const baseUrl = Env.NEXT_PUBLIC_APP_URL || "https://glowexplore.com";
  const canonicalSlug = deal.canonicalSlug ?? deal.slug ?? String(deal.id);
  const canonicalPath = `/organization_services/${canonicalSlug}`;
  const canonicalUrl = `${baseUrl}/${locale}${canonicalPath}`;

  const breadcrumbs = [
    { label: t("breadcrumb.home"), url: `/${locale}` },
  ];

  if (spaDetail?.services && spaDetail.services.length > 0) {
    const menuDict = (tMenu("services", { returnObjects: true }) as Record<string, string>) || {};
    const matchedService = spaDetail.services.find((s: any) => s.slugGlobal === deal.serviceSlug) || spaDetail.services[0];

    if (matchedService) {
      let serviceName =
        locale === "en"
          ? matchedService.nameEn || matchedService.nameVi || ""
          : locale === "ko"
            ? matchedService.nameKo || matchedService.nameVi || ""
            : matchedService.nameVi || "";

      if (!serviceName) {
        serviceName = menuDict[matchedService.slugGlobal] || "";
      }

      if (serviceName) {
        const localizedServiceSlug = SERVICE_SLUGS[matchedService.slugGlobal as keyof typeof SERVICE_SLUGS]?.[locale as LocaleTypes] || matchedService.slugGlobal;
        breadcrumbs.push({
          label: serviceName,
          url: buildSeoUrl(locale, localizedServiceSlug),
        });
      }
    }
  }

  breadcrumbs.push(
    { label: spa.name, url: `/${locale}/provider/${spa.slug}` },
    { label: dealTitle ?? "", url: canonicalUrl }
  );

  const dealDescription = deal.shortDescription ?? dealTitle;

  const serviceJsonLd = buildDealServiceJsonLd({
    baseUrl,
    locale,
    path: canonicalPath,
    deal,
    title: dealTitle ?? "",
    description: dealDescription,
    serviceType:
      dealTitle
        ?.replace(/\s*([-–—]\s*\d+%.*|giảm.*|discount.*|off.*)/i, "")
        .trim() ?? null,
    businessType: Array.isArray(bizType) ? bizType[0] : bizType,
    cityName: spa.cityName ?? null,
    districtName: spa.districtName ?? null,
    streetAddress: spa.address ?? null,
    telephone: spa.contact?.phone ?? null,
    lat: spa.lat ?? null,
    lng: spa.lng ?? null,
    spaLogoUrl: spa.spaAvatarUrl ?? null,
    spaPhotos: spa.photos ?? [],
    category: "Spa & Wellness",
    ratingValue: spa.ratingValue,
    reviewCount: spa.reviewCount,
    reviews: (spa.reviews ?? []).map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.ratingValue ?? r.rating ?? 0,
      content: r.content ?? null,
      reviewedAt: r.createdAt ?? r.reviewedAt ?? null,
    })),
  });

  return (
    <div className="min-h-screen bg-app-bg pb-[140px] lg:pb-12 overflow-x-clip">
      <LocalizedSlugSync
        localizedSlugs={{
          vi: deal.localizedSlugs?.vi ?? canonicalSlug,
          en: deal.localizedSlugs?.en ?? canonicalSlug,
          ko: deal.localizedSlugs?.ko ?? canonicalSlug,
        }}
      />
      <EngagementBeacon slug={dealTrackingSlug(deal)} entityType="deal" />
      <BreadcrumbsJsonLd items={breadcrumbs} baseUrl={baseUrl} />
      {serviceJsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/&/g, "\\u0026"),
          }}
        />
      ))}

      <DealMobileHeader
        dealTitle={dealTitle ?? ""}
        spaName={spa.name}
        shareUrl={canonicalUrl}
        locale={locale}
      />

      <section className="hidden pb-0 pt-3 lg:block max-sm:pt-2">
        <Container maxWidth="2xl">
          <Breadcrumbs items={breadcrumbs} />
        </Container>
      </section>
      <BreadcrumbBannerSection locale={locale} sectionClassName="hidden py-3 lg:block" maxWidth="2xl" />

      <Container maxWidth="2xl" className="mt-0 sm:mt-2 pb-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            {(() => {
              const firstPrice = (deal as any).variants?.[0]?.prices?.[0];
              const discountPercent = deriveDisplayDiscountPercent({
                discountPercent: deal.discountPercent,
                originalPrice: deal.originalPrice ?? firstPrice?.originalPrice ?? 0,
                salePrice: deal.salePrice ?? firstPrice?.salePrice ?? 0,
              });
              return (
                <div className="relative -mx-4 sm:mx-0">
                  <SpaBannerCarousel
                    photos={resolveBannerPhotos(deal)}
                    name={deal.title}
                  />
                  {discountPercent > 0 && (
                    <span className="absolute left-4 top-4 z-10 rounded-lg bg-[#C0392B] px-2.5 py-1.5 text-sm font-bold text-white">
                      Giảm {discountPercent}%
                    </span>
                  )}
                </div>
              );
            })()}
            <DealInfo deal={deal} locale={locale} />
            {spa.description && (
              <section className="overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_1px_10px_-6px_rgba(20,52,35,0.30)] sm:px-5">
                <h2 className="mb-3 text-base font-bold text-[#093E06] sm:text-lg">
                  {t("about") !== "about" ? t("about") : "Giới thiệu"}
                </h2>
                <p className="text-sm leading-6 text-[#5B6B58] whitespace-pre-line">
                  {spa.description}
                </p>
              </section>
            )}
            {deal.otherDealsAtSpa && deal.otherDealsAtSpa.length > 0 && (
              <div className="hidden lg:block">
                <OtherDealsAtSpa
                  deals={deal.otherDealsAtSpa}
                  title={
                    t("empty_state.other_deals_at_spa") !== "empty_state.other_deals_at_spa"
                      ? t("empty_state.other_deals_at_spa")
                      : "Ưu đãi khác tại spa này"
                  }
                />
              </div>
            )}

            <DealMobileSpaInfo deal={deal} t={t} locale={locale} />

            <div className="hidden lg:block">
              <SimilarSpas
                locale={locale}
                currentSpaId={spa.id}
                serviceSlug={deal.serviceSlug ?? spaDetail?.services?.[0]?.slugGlobal ?? null}
                lat={spa.lat}
                lng={spa.lng}
              />
            </div>

          </div>
          <DealSidebar deal={deal} t={t} />
        </div>
      </Container>

      <div className="lg:hidden">
        <DealMobileBottomBar
          spaName={spa.name}
          phone={spa.contact?.phone ?? null}
          chatUrls={{
            whatsappUrl: (spa.contact as any)?.whatsappUrl || (spa.contact as any)?.whatsapp || null,
            zaloUrl: (spa.contact as any)?.zaloUrl || (spa.contact as any)?.zalo || null,
            facebookUrl: (spa.contact as any)?.facebookUrl || (spa.contact as any)?.messenger || (spa.contact as any)?.facebook || null,
            telegramUrl: (spa.contact as any)?.telegramUrl || (spa.contact as any)?.telegram || null,
          }}
          mapsUrl={
            spa.lat != null && spa.lng != null
              ? `https://www.google.com/maps/dir/?api=1&destination=${spa.lat},${spa.lng}`
              : null
          }
          dealTitle={deal.title}
          dealPrice={
            (deal.salePrice ?? (deal as any).variants?.[0]?.prices?.[0]?.salePrice) != null
              ? formatPrice((deal.salePrice ?? (deal as any).variants?.[0]?.prices?.[0]?.salePrice)!)
              : null
          }
        />
      </div>
    </div>
  );
}
