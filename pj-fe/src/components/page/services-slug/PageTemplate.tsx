import type { LocaleTypes } from "@/i18n/settings";
import type { PagePayloadDto } from "@/types/api";
import { Suspense } from "react";
import { BreadcrumbsJsonLd } from "@/components/common/breadcrumbs/BreadcrumbsJsonLd";
import { CollectionPageJsonLd } from "@/components/common/json-Ld/CollectionPageJsonLd";
import { resolveLocalBusinessTypes } from "@/libs/seo/schema-builder";
import { getTranslation } from "@/i18n/server-cache";
import { MAIN_SERVICE_GROUPS, getParentServiceKey, resolveServiceKey } from "@/constants/services";
import { PageHero } from "./PageHero";
import { CategoryMobileHeader } from "./CategoryMobileHeader";
import { GroupTabs } from "./GroupTabs";
import { InfiniteSpaDealsListing } from "./InfiniteSpaDealsListing";
import { UserGeoForHubDistance } from "./UserGeoForHubDistance";
import { Container } from "@/components/ui/container";
import { BackToTop } from "@/components/common/back-to-top/BackToTop";
import { cityDisplayName, districtDisplayName } from "@/libs/parse-seo-service-path";

interface PageTemplateProps {
  payload: PagePayloadDto;
  locale: LocaleTypes;
  resolveUrl: string;
  lat?: number;
  lng?: number;
  children?: React.ReactNode;
}

export async function PageTemplate({
  payload,
  locale,
  resolveUrl,
  lat,
  lng,
  children,
}: PageTemplateProps) {
  const { t } = await getTranslation(locale, "home");
  const { t: tFilter } = await getTranslation(locale, "filter");
  const groupLabels = Object.fromEntries(
    MAIN_SERVICE_GROUPS.map((key) => [key, t(`home.services.${key}`) || key]),
  );

  const { seoMeta, deals, filters: originalFilters, pageType, flashSale, flashSaleHub } =
    payload;

  const filters = { ...originalFilters };

  if (!filters.currentService && resolveUrl && Array.isArray(filters.services)) {
    const sortedServices = [...filters.services].sort((a, b) => (b.slugGlobal?.length || 0) - (a.slugGlobal?.length || 0));
    filters.currentService = sortedServices.find((s) => {
      const slugLower = s.slugGlobal?.toLowerCase();
      if (!slugLower) return false;
      return resolveUrl === slugLower || resolveUrl.startsWith(`${slugLower}-`);
    }) || null;
  }

  if ((!filters.subServices || filters.subServices.length === 0) && filters.currentService && Array.isArray(filters.services)) {
    const parentId = filters.currentService.categoryId ?? filters.currentService.id;
    filters.subServices = filters.services.filter((s) => s.categoryId === parentId);
  }

  const geoDistanceHub = pageType !== "not_found";

  const mainGroupKey = (() => {
    if (filters.currentService) {
      const parentId = filters.currentService.categoryId;
      let targetCode = filters.currentService.code?.toLowerCase();
      let targetSlug = filters.currentService.slugGlobal?.toLowerCase();

      if (parentId && Array.isArray(filters.services)) {
        const parentService = filters.services.find(s => s.id === parentId);
        if (parentService) {
          targetCode = parentService.code?.toLowerCase() || targetCode;
          targetSlug = parentService.slugGlobal?.toLowerCase() || targetSlug;
        }
      }

      const directMatch = MAIN_SERVICE_GROUPS.find(
        (key) =>
          key.toLowerCase() === targetCode || key.toLowerCase() === targetSlug,
      );
      if (directMatch) return directMatch;

      const parentKey = getParentServiceKey(targetCode || targetSlug || "");
      if (parentKey) return parentKey;
    }

    if (resolveUrl) {
      const resolvedKey = resolveServiceKey(resolveUrl, locale);
      if (resolvedKey) {
        const parentKey = getParentServiceKey(resolvedKey);
        if (parentKey) return parentKey;
      }
    }

    return null;
  })();

  const parentGroupTitle =
    mainGroupKey && groupLabels[mainGroupKey]
      ? groupLabels[mainGroupKey]
      : "Dịch vụ";

  const pageTitle = filters.currentService
    ? (locale === 'en' && filters.currentService.nameEn ? filters.currentService.nameEn :
       locale === 'ko' && filters.currentService.nameKo ? filters.currentService.nameKo :
       filters.currentService.nameVi)
    : seoMeta.h1 || parentGroupTitle;

  const currentCityName = filters.currentCity ? cityDisplayName(filters.currentCity, locale) : "";
  const currentDistrictName = filters.currentDistrict ? districtDisplayName(filters.currentDistrict, locale) : "";

  const locationText =
    currentDistrictName && currentCityName
      ? `${currentDistrictName}, ${currentCityName}`
      : currentCityName;

  return (
    <main className="min-h-screen bg-app-bg">
      {/* Category Mobile Header (Mockup 1b) */}
      <CategoryMobileHeader
        title={pageTitle}
        total={deals.meta?.total}
        locationText={locationText}
        locale={locale}
      />

      {/* JSON-LD breadcrumb schema — Server Component, renders in initial HTML */}
      {pageType !== "not_found" && (
        <>
          <BreadcrumbsJsonLd 
            items={seoMeta.breadcrumbs.map(bc => {
              let url = bc.url;
              if (url.startsWith('/') && !url.startsWith(`/${locale}/`) && url !== `/${locale}`) {
                url = `/${locale}${url}`;
              }
              return { ...bc, url };
            })}
          />
          {deals.data.length > 0 && (
            <CollectionPageJsonLd
              locale={locale}
              path={`/${resolveUrl}`}
              title={seoMeta.h1 || seoMeta.title}
              description={seoMeta.metaDescription}
              items={
                resolveUrl === 'deals' || resolveUrl === 'flash-sale'
                  ? deals.data.flatMap(group => 
                      group.deals.map(deal => {
                        const dealSlug = deal.canonicalSlug || deal.slug;
                        const priceVal = (deal.salePrice != null && deal.salePrice > 0) ? deal.salePrice : deal.originalPrice;
                        const bizType = resolveLocalBusinessTypes(filters.currentService ? [filters.currentService] : null);
                        
                        return {
                          '@type': 'Offer' as const,
                          name: deal.title,
                          url: `/${locale}/organization_services/${dealSlug}`,
                          price: priceVal != null && priceVal > 0 ? String(priceVal) : undefined,
                          priceCurrency: deal.currency,
                          priceValidUntil: deal.endAt ? deal.endAt.split('T')[0] : undefined,
                          availability: 'https://schema.org/InStock',
                          seller: {
                            '@type': Array.isArray(bizType) ? (bizType[0] || 'HealthAndBeautyBusiness') : bizType,
                            name: group.spa.name,
                          }
                        };
                      })
                    ).filter(item => item.price != null)
                  : deals.data.map(group => {
                      const bizType = resolveLocalBusinessTypes(filters.currentService ? [filters.currentService] : null);
                      return {
                        '@type': (Array.isArray(bizType) ? (bizType[0] || 'HealthAndBeautyBusiness') : bizType) as string,
                        name: group.spa.name,
                        url: `/${locale}/provider/${group.spa.slug}`,
                        ...(group.spa.spaAvatarUrl ? { image: group.spa.spaAvatarUrl } : {}),
                        ...(group.spa.reviewCount > 0 ? {
                          aggregateRating: {
                            '@type': 'AggregateRating' as const,
                            ratingValue: group.spa.ratingValue,
                            reviewCount: group.spa.reviewCount
                          }
                        } : {})
                      };
                    })
              }
            />
          )}
        </>
      )}

      <div className="hidden md:block">
        <PageHero
          title={seoMeta.indexable ? pageTitle : undefined}
          breadcrumbs={seoMeta.breadcrumbs}
          locale={locale}
        />
      </div>

      {/* GroupTabs & FilterBar */}
      <div className="md:sticky md:top-20 z-30 bg-app-bg relative">
        <Container maxWidth={false} className="max-w-[1240px] px-4 md:px-5">
          <div className="max-md:-mx-4 max-md:px-4">
            <div>
              <GroupTabs
                locale={locale}
                labels={groupLabels}
                currentCitySlug={filters.currentCity?.slug}
              />
            </div>
          </div>
        </Container>
      </div>

      {/* Main Container */}
      <div className="pt-4 pb-6 max-md:py-4">
        <Container maxWidth={false} className="max-w-[1240px] px-4 md:px-5">
          <div className="w-full flex flex-col gap-6">
            {/* Header Content Area trên Desktop: Tiêu đề */}
            <div className="hidden md:flex items-center justify-between gap-4 w-full">
              <div className="flex flex-col gap-1">
                <h2 className="text-[28px] font-bold text-[#093E06] leading-tight">
                  {pageTitle}
                </h2>
                <div className="text-[15px] font-normal text-[#5B6B58]">
                  <span className="font-semibold text-[#093E06]">
                    {deals.meta?.total ?? 0} {tFilter("places_total") || "địa điểm"}
                  </span>
                  {currentCityName
                    ? ` ${tFilter("in_city", { city: currentCityName })}`
                    : ""}
                </div>
              </div>
            </div>

            {children}
            <InfiniteSpaDealsListing
              initialGroups={deals.data}
              initialPagination={deals.meta}
              locale={locale}
              resolveUrl={resolveUrl}
              lat={lat}
              lng={lng}
              flashSale={flashSale}
              flashSaleHub={!!flashSaleHub}
            />
          </div>
        </Container>
      </div>
      <BackToTop />
    </main>
  );
}
