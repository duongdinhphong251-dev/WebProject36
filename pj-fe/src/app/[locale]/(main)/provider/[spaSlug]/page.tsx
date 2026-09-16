import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import type { LocaleTypes } from "@/i18n/settings";
import type {
  BreadcrumbItemDto,
  SpaDetailDto,
} from "@/types/api";

import { BreadcrumbsJsonLd } from "@/components/common/breadcrumbs/BreadcrumbsJsonLd";
import { LocalizedSlugSync } from "@/components/common/LocalizedSlugSync";
import { SpaDetailPage } from "@/components/page/spa-detail/SpaDetailPage";
import { EngagementBeacon } from "@/components/tracking/EngagementBeacon";

import { getTranslation } from "@/i18n/server-cache";
import { Env } from "@/libs/Env";
import { getCoordsFromCookie } from "@/libs/ssr-cookies";
import { buildPageMetadataCommon } from "@/libs/seo";
import { buildSpaLocalBusinessJsonLd } from "@/libs/seo/schema-builder";
import { slugifySpaName } from "@/libs/spa-slug";
import { getSpaBySlug } from "@/services/api/spa-api";
import { buildSeoUrl } from "@/libs/filter-utils";
import { resolveServiceKey, SERVICE_SLUGS, getParentServiceKey, type ServiceKey } from "@/constants/services";
// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isRenderablePhoto(photo: string | null | undefined) {
  return !!photo && /^(https?:\/\/|\/)/.test(photo);
}

function buildBreadcrumbs(
  locale: string,
  spa: SpaDetailDto,
  spaSlug: string,
  homeLabel: string,
  menuDict: Record<string, string>,
  refService?: string | string[],
): BreadcrumbItemDto[] {
  // Ưu tiên slug đã được dịch theo locale, fallback về resolvedSlug
  const localizedSlug = spa.localizedSlugs?.[locale] ?? spaSlug;
  const breadcrumbs: BreadcrumbItemDto[] = [
    { label: homeLabel, url: `/${locale}` },
  ];

  let addedService = false;

  // Function to add a breadcrumb for a service, including its parent group if applicable
  const addServiceBreadcrumbs = (
    service: { code: string; slugGlobal: string; nameVi: string; nameEn?: string | null; nameKo?: string | null } | null,
    fallbackKey: string | null
  ) => {
    let canonicalKey = fallbackKey;
    if (service) {
      canonicalKey = service.slugGlobal;
    }

    if (!canonicalKey) return;

    // Find parent group
    const parentGroupKey = getParentServiceKey(service?.code || service?.slugGlobal || canonicalKey);

    // If there is a parent group and it's different from the current service, add the parent group first
    if (parentGroupKey && parentGroupKey !== canonicalKey) {
      const parentName = menuDict[parentGroupKey] || parentGroupKey;
      const localizedParentSlug = SERVICE_SLUGS[parentGroupKey]?.[locale as LocaleTypes] || parentGroupKey;
      
      breadcrumbs.push({
        label: parentName,
        url: buildSeoUrl(locale, localizedParentSlug),
      });
    }

    // Add the service itself
    let serviceName = "";
    if (service) {
      serviceName =
        locale === "en"
          ? service.nameEn || service.nameVi
          : locale === "ko"
            ? service.nameKo || service.nameVi
            : service.nameVi;
    } else {
      serviceName = menuDict[canonicalKey] || canonicalKey;
    }

    if (serviceName) {
      const localizedServiceSlug = SERVICE_SLUGS[canonicalKey as ServiceKey]?.[locale as LocaleTypes] || canonicalKey;
      breadcrumbs.push({
        label: serviceName,
        url: buildSeoUrl(locale, localizedServiceSlug),
      });
      addedService = true;
    }
  };

  // Nếu có query param ref_service, ưu tiên tìm dịch vụ đó trong spa hoặc từ translations
  if (refService && typeof refService === "string") {
    const canonicalKey = resolveServiceKey(refService, locale as any);
    if (canonicalKey) {
      const matchedService = spa.services?.find(s => s.slugGlobal === canonicalKey);
      addServiceBreadcrumbs(matchedService || null, canonicalKey);
    }
  }

  // Nếu chưa có dịch vụ nào được add, fallback lấy dịch vụ đầu tiên của spa
  if (!addedService && spa.services && spa.services.length > 0) {
    const primaryService = spa.services[0];
    if (primaryService) {
      addServiceBreadcrumbs(primaryService, null);
    }
  }

  breadcrumbs.push({
    label: spa.name,
    url: `/${locale}/provider/${localizedSlug}`,
  });

  return breadcrumbs;
}

function buildTagline(spa: SpaDetailDto) {
  return (
    spa.description?.trim() ||
    `${spa.name} offers curated wellness treatments, attentive staff, and flexible booking for your next reset.`
  );
}

// ─── Data resolver (per-request cached) ──────────────────────────────────────

const resolveSpa = cache(
  async (
    spaSlug: string,
    opts?: { lat?: number; lng?: number; locale?: string },
  ): Promise<{ spa: SpaDetailDto; resolvedSlug: string } | null> => {
    const detail = await getSpaBySlug(spaSlug, opts);
    if (!detail) return null;

    const spa: SpaDetailDto = {
      ...detail,
      photos: (detail.photos || []).filter(isRenderablePhoto).slice(0, 5),
      deals: detail.deals || [],
      services: detail.services || [],
      reviews: detail.reviews || [],
      openingHours: detail.openingHours || [],
    };

    return { spa, resolvedSlug: spa.slug || slugifySpaName(spa.name) };
  },
);

// ─── Route ───────────────────────────────────────────────────────────────────

type Props = { 
  params: Promise<{ locale: LocaleTypes; spaSlug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, spaSlug } = await params;
  const coords = await getCoordsFromCookie();
  const resolved = await resolveSpa(spaSlug, { ...coords, locale });

  if (!resolved) return {};

  const { spa, resolvedSlug } = resolved;
  const areaLabel = [spa.location?.districtName, spa.location?.cityName]
    .filter(Boolean)
    .join(", ");

  const keywords = [spa.name, areaLabel].filter(Boolean) as string[];

  return buildPageMetadataCommon({
    locale,
    path: `/provider/${resolvedSlug}`,
    title: spa.name,
    description: buildTagline(spa),
    images: spa.photos[0],
    keywords,
    ogTitle: spa.name,
    ogDescription: buildTagline(spa),
  });
}

export default async function SpaDetailRoute({ params, searchParams }: Props) {
  const { locale, spaSlug } = await params;
  const sParams = await searchParams;
  const refService = sParams?.ref_service;

  const [{ t }, coords, { t: tMenu }, { t: tHome }] = await Promise.all([
    getTranslation(locale, "spa-detail"),
    getCoordsFromCookie(),
    getTranslation(locale, "main-menu"),
    getTranslation(locale, "home"),
  ]);

  const resolved = await resolveSpa(spaSlug, { ...coords, locale });
  if (!resolved) notFound();

  const { spa, resolvedSlug } = resolved;
  const baseUrl = Env.NEXT_PUBLIC_APP_URL || "https://glowexplore.com";

  const dayLabelsRaw = t("day_labels", { returnObjects: true });
  const dayLabels = Array.isArray(dayLabelsRaw)
    ? dayLabelsRaw
    : FALLBACK_DAY_LABELS;

  const servicesDict = {
    ...((tMenu("services", { returnObjects: true }) as Record<string, string>) || {}),
    ...((tHome("home.services", { returnObjects: true }) as Record<string, string>) || {})
  };

  const breadcrumbs = buildBreadcrumbs(
    locale,
    spa,
    resolvedSlug,
    t("home"),
    servicesDict,
    refService
  );

  const localBusinessJsonLd = buildSpaLocalBusinessJsonLd({
    baseUrl,
    locale,
    path: `/provider/${resolvedSlug}`,
    spa,
  });

  const dictionary = {
    about: t("about"),
    addReview: t("add_review"),
    availableAt: t("available_at"),
    call: t("call"),
    closed: t("closed"),
    customerReviews: t("customer_reviews"),
    dayLabels,
    dealsForYou: t("deals_for_you"),
    daysAgo: t("days_ago"),
    fromDate: t("from_date"),
    startsFrom: t("starts_from"),
    validUntil: t("valid_until"),
    endsAt: t("ends_at"),
    validPeriod: t("valid_period"),
    endsIn: t("ends_in"),
    flashSale: t("flash_sale"),
    getDirections: t("get_directions"),
    justNow: t("just_now"),
    like: t("like"),
    location: t("location"),
    monthsAgo: t("months_ago"),
    openHours: t("open_hours"),
    today: t("today"),
    ownerResponse: t("owner_response"),
    report: t("report"),
    reviews: t("reviews"),
    share: t("share"),
    scheduleConsultation: t("schedule_consultation"),
    viewMoreReviews: t("view_more_reviews"),
    views: t("views"),
    spaDealsSummary: t("spa_deals_summary"),
    spaDealsSummaryNoDiscount: t("spa_deals_summary_no_discount"),
    bestDealLabel: t("best_deal_label"),
    save: t("save"),
    saved: t("saved"),
    copied: t("copied"),
    copyLink: t("copy_link"),
    reportPlace: t("report_place"),
    wrongInfo: t("wrong_info"),
    chatHint: t("chat_hint"),
    noPaymentNotice: t("no_payment_notice"),
    contactChannels: t("contact_channels"),

    showPhone: t("show_phone"),
    locationAndHours: t("location_and_hours"),
    multiPlatformReviews: t("multi_platform_reviews"),
    updatedDaily: t("updated_daily"),
    noData: t("no_data"),
    noReviewsForLanguage: t("no_reviews_for_language"),
    noReviewYet: t("no_review_yet"),
    allLanguages: t("all_languages"),
    viewAllOnGoogle: t("view_all_on_google"),
    viewPostOnReddit: t("view_post_on_reddit"),
    viewAllOnPlatform: t("view_all_on_platform"),
    filterByLanguage: t("filter_by_language"),
    is_closed_today: t("is_closed_today"),
    is_open_now: t("is_open_now"),
    is_closed: t("is_closed"),
    opens_at: t("opens_at"),
    closes_at: t("closes_at"),
    closed_for_today: t("closed_for_today"),
    fullPriceList: t("full_price_list"),
    priceListSubtitleProvided: t("price_list_subtitle_provided"),
    priceListSubtitleSynced: t("price_list_subtitle_synced"),
    priceListFooterProvided: t("price_list_footer_provided"),
    priceListFooterSynced: t("price_list_footer_synced"),
    features: (t("features", { returnObjects: true }) as Record<string, string>) || {},
  };

  return (
    <>
      <LocalizedSlugSync
        localizedSlugs={
          spa.localizedSlugs ?? {
            vi: resolvedSlug,
            en: resolvedSlug,
            ko: resolvedSlug,
          }
        }
      />
      <EngagementBeacon slug={spa.slug || resolvedSlug} entityType="spa" />
      <BreadcrumbsJsonLd items={breadcrumbs} baseUrl={baseUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />
      <SpaDetailPage
        breadcrumbs={breadcrumbs}
        locale={locale}
        spa={spa}
        dictionary={dictionary}
      />
    </>
  );
}
