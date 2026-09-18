import type { BreadcrumbItemDto, SpaDealDto, SpaDetailDto } from "@/types/api";
import type { LocaleTypes } from "@/i18n/settings";
import dynamic from "next/dynamic";

const MultiPlatformReviews = dynamic(
  () => import("./MultiPlatformReviews").then((mod) => mod.MultiPlatformReviews)
);

import { SpaViewCount } from "@/components/page/spa-detail/SpaViewCount";
import { SmartBackHistory } from "@/components/page/spa-detail/SmartBackHistory";
import MapPin from "lucide-react/dist/esm/icons/map-pin";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { BreadcrumbBannerSection } from "@/components/common/banners/BreadcrumbBanner";
import { Container } from "@/components/ui/container";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { cn } from "@/libs/utils";

import { SpaLocationMeta } from "./SpaLocationMeta";
import { SpaBannerCarousel } from "./SpaBannerCarousel";
import { OpeningHoursToggle } from "./OpeningHoursToggle";
const SpaPricingTable = dynamic(
  () => import("./SpaPricingTable").then((mod) => mod.SpaPricingTable)
);
const DealsForYouCard = dynamic(
  () => import("./DealsForYouCard").then((mod) => mod.DealsForYouCard)
);
import type { SpaDetailDictionary } from "./DealCard";
import { Star } from "lucide-react";


import { getOpeningStatus } from "@/libs/opening-hours";
import { formatDistanceKm } from "@/libs/distance-formatter";
import { SpaDetailMobileHeader } from "./SpaDetailMobileHeader";
import { SpaQuickActions } from "./SpaQuickActions";
import { Env } from "@/libs/Env";

interface SpaDetailPageProps {
  breadcrumbs: BreadcrumbItemDto[];
  dictionary: SpaDetailDictionary;
  locale: LocaleTypes;
  spa: SpaDetailDto;
}

interface AmenityTag {
  key: string;
  label: string;
}

function buildAmenityTags(spa: SpaDetailDto, locale: LocaleTypes, dict: Record<string, string> = {}): AmenityTag[] {
  let source = spa.amenities;

  const enAmenities = spa.amenities_en;
  const koAmenities = spa.amenities_ko;

  if (locale === "en" && enAmenities && enAmenities.length > 0) {
    source = enAmenities;
  } else if (locale === "ko" && koAmenities && koAmenities.length > 0) {
    source = koAmenities;
  }

  if (!source) return [];

  return source.map((val, idx) => ({
    key: `amenity-${idx}`,
    label: dict[val] || val,
  }));
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-[17px] font-bold text-[#0a0d12]", className)}>{children}</h2>;
}

export function SpaDetailPage(props: SpaDetailPageProps) {
  // Strip undefined values using JSON serialization to avoid Next.js Error serializing undefined
  // and to avoid converting undefined to null which might break Client Component default params
  const { breadcrumbs, dictionary, locale, spa } = JSON.parse(JSON.stringify(props)) as SpaDetailPageProps;

  const areaLabel = [spa.location?.districtName, spa.location?.cityName]
    .filter(Boolean)
    .join(", ");
  const locationText =
    spa.address ??
    spa.location?.addressLine ??
    (areaLabel || spa.location?.cityName || "Vietnam");

  const shareUrl = `${Env.NEXT_PUBLIC_APP_URL}/${locale}/provider/${spa.slug || spa.id}`;


  const activeDeals = spa.deals || [];
  const hasServiceItems = Array.isArray(spa.serviceItems) && spa.serviceItems.length > 0;
  const hasDeals = activeDeals.length > 0;

  let bestDealId: number | null = null;
  let bestDeal: SpaDealDto | null = null;
  let sortedDeals: SpaDealDto[] = [];

  interface CategoryGroup {
    id: number | null;
    title: string;
    deals: SpaDealDto[];
  }
  const categoryGroups: CategoryGroup[] = [];

  if (hasDeals) {
    let maxDiscount = 0;
    let maxDiscountIndex = 0;

    activeDeals.forEach((deal, idx) => {
      const disc = deriveDisplayDiscountPercent({
        discountPercent: deal.discountPercent,
        originalPrice: deal.originalPrice,
        salePrice: deal.salePrice,
      });
      if (disc > maxDiscount) {
        maxDiscount = disc;
        maxDiscountIndex = idx;
      }
    });

    sortedDeals = [...activeDeals];
    if (maxDiscountIndex > 0) {
      const bd = sortedDeals.splice(maxDiscountIndex, 1)[0];
      if (bd) {
        sortedDeals.unshift(bd);
      }
    }

    bestDealId = maxDiscount > 0 && sortedDeals.length > 0 ? sortedDeals[0]?.id ?? null : null;
    bestDeal = bestDealId ? sortedDeals[0] || null : null;

    const matchedDealIds = new Set<number>();

    (spa.services || []).forEach((service) => {
      const matchingDeals = sortedDeals.filter(
        (d) =>
          (d.categoryId === service.id ||
            (service.categoryId != null && d.categoryId === service.categoryId)) &&
          !matchedDealIds.has(d.id),
      );
      if (matchingDeals.length > 0) {
        matchingDeals.forEach((d) => matchedDealIds.add(d.id));
        const serviceName =
          locale === "en"
            ? service.nameEn || service.nameVi
            : locale === "ko"
              ? service.nameKo || service.nameVi
              : service.nameVi;
        categoryGroups.push({
          id: service.id,
          title: serviceName,
          deals: matchingDeals,
        });
      }
    });

    const unassignedDeals = sortedDeals.filter((d) => !matchedDealIds.has(d.id));
    if (unassignedDeals.length > 0) {
      const fallbackTitle =
        locale === "en"
          ? "Other Services"
          : locale === "ko"
            ? "기타 서비스"
            : "Dịch vụ khác";
      categoryGroups.push({
        id: null,
        title: fallbackTitle,
        deals: unassignedDeals,
      });
    }
  }

  const primaryServiceName =
    spa.services?.[0]
      ? (locale === "en"
        ? spa.services[0].nameEn || spa.services[0].nameVi
        : locale === "ko"
          ? spa.services[0].nameKo || spa.services[0].nameVi
          : spa.services[0].nameVi)
      : null;

  return (
    <div className="min-h-screen bg-app-bg text-[#0a0d12]">
      <SmartBackHistory services={spa.services} />

      {/* Mobile Top Green Header (Mockup 1c) */}
      <SpaDetailMobileHeader
        name={spa.name}
        categoryName={primaryServiceName ?? null}
        districtName={spa.location?.districtName ?? null}
        cityName={spa.location?.cityName ?? null}
        spaId={spa.slug || spa.id}
      />

      <section className="hidden pb-0 pt-3 lg:block max-sm:pt-2">
        <Container maxWidth="2xl">
          <Breadcrumbs items={breadcrumbs} />
        </Container>
      </section>

      <BreadcrumbBannerSection locale={locale} sectionClassName="hidden py-3 lg:block" maxWidth="2xl" />

      {/* R-5: pb dynamic with safe-area instead of hardcoded pb-44 */}
      <main className="pb-[calc(env(safe-area-inset-bottom,0px)+140px)] lg:pb-12 mt-0 sm:mt-2">
        <Container maxWidth="2xl">
          <div className="w-full space-y-3">

              {/* ── Hero card with banner carousel (Mockup 1c) ── */}
              <section className="-mx-4 sm:mx-0 overflow-hidden rounded-none sm:rounded-[16px] bg-white shadow-[0_10px_40px_rgba(20,52,35,0.08)]">
                <div className="relative">
                  <SpaBannerCarousel photos={spa.photos} name={spa.name} />
                </div>

                <div className="space-y-3 px-3.5 py-3.5 sm:px-6 lg:px-8">
                  {/* Spa Title */}
                  <h1 className="text-[18.5px] sm:text-[25px] font-bold text-[#093E06] leading-snug">
                    {spa.name}
                  </h1>

                  {/* Rating & Meta Row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#5B6B58]">
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-[#F5B816] text-[#F5B816]" />
                      <b className="font-semibold text-[#093E06]">
                        {Number(spa.ratingValue ?? 0).toFixed(1)}
                      </b>
                    </div>
                    <span className="text-[#9BA898]">·</span>
                    <SpaViewCount
                      slug={spa.slug || spa.id || ""}
                      locale={locale}
                      label={dictionary.views}
                    />
                    {/* Khoảng cách */}
                    {spa.distanceKm != null && spa.distanceKm >= 0 && (
                      <>
                        <span className="text-[#9BA898]">·</span>
                        <span>{formatDistanceKm(spa.distanceKm)}</span>
                      </>
                    )}
                    {/* Trạng thái mở cửa */}
                    {(() => {
                      const tOpening = (key: string, options?: { time?: string }) => {
                        let res = (dictionary as any)?.[key];
                        if (!res) {
                          const fallbackMap: Record<string, Record<string, string>> = {
                            en: {
                              is_closed_today: "Closed today",
                              is_open_now: "Open now",
                              is_closed: "Closed",
                              opens_at: "Opens at {{time}}",
                              closes_at: "Closes at {{time}}",
                              closed_for_today: "Closed for today",
                            },
                            ko: {
                              is_closed_today: "오늘 휴무",
                              is_open_now: "영업 중",
                              is_closed: "영업 종료",
                              opens_at: "{{time}}에 영업 시작",
                              closes_at: "{{time}}에 영업 종료",
                              closed_for_today: "오늘 영업 종료",
                            },
                            vi: {
                              is_closed_today: "Đóng cửa hôm nay",
                              is_open_now: "Đang mở",
                              is_closed: "Đóng cửa",
                              opens_at: "Mở lúc {{time}}",
                              closes_at: "Đóng lúc {{time}}",
                              closed_for_today: "Đã đóng cửa hôm nay",
                            },
                          };
                          const localeMap = fallbackMap[locale] || fallbackMap.vi!;
                          res = localeMap[key] || key;
                        }
                        if (options?.time && typeof res === "string") {
                          res = res.replace("{{time}}", options.time);
                        }
                        return res;
                      };
                      const status = getOpeningStatus(spa.openingHours, tOpening);
                      if (!status) return null;
                      return (
                        <>
                          <span className="text-[#9BA898]">·</span>
                          <span className={status.isOpen ? "font-medium text-[#40813D]" : "font-medium text-[#535862]"}>
                            {status.text}
                            {status.openSub && (
                              <span className="font-normal text-[#535862]">
                                {" · "}{status.openSub}
                              </span>
                            )}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Amenities Tags (Horizontal scroll on mobile, wrap on desktop) */}
                  {(() => {
                    const amenityTags = buildAmenityTags(spa, locale, dictionary.features);
                    if (amenityTags.length === 0) return null;
                    return (
                      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:flex-wrap">
                        {amenityTags.map((tag) => (
                          <span
                            key={tag.key}
                            className="whitespace-nowrap rounded-[9px] bg-[#DDE4D9] sm:bg-[#DDE4D9] px-2.5 py-1.5 text-[11.5px] font-medium text-[#093E06] shadow-[0_1px_2px_rgba(9,62,6,0.06)] shrink-0"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 4 Quick Actions (Grid on Mobile matching Mockup 1c) */}
                  <div className="pt-1 md:hidden">
                    <SpaQuickActions
                      spaName={spa.name}
                      spaId={spa.slug || spa.id}
                      phone={spa.contact?.phone ?? null}
                      mapsUrl={spa.googleMapsUri ?? null}
                      shareUrl={shareUrl}
                      dictionary={dictionary as unknown as Record<string, string>}
                    />
                  </div>
                </div>
              </section>

              {/* ── Deals & Pricing Table ── */}
              {(() => {
                if (!hasDeals && !hasServiceItems) return null;

                return (
                  <>
                    {hasDeals && (
                      <DealsForYouCard
                        deals={sortedDeals}
                        bestDealId={bestDealId}
                        locale={locale}
                      />
                    )}
                    <SpaPricingTable
                      serviceItems={spa.serviceItems || []}
                      categoryGroups={categoryGroups}
                      bestDealId={bestDealId}
                      locale={locale as LocaleTypes}
                      dictionary={dictionary}
                    />
                  </>
                );
              })()}

              {/* ── Location ── */}
              <section className="rounded-[24px] bg-white p-4 shadow-[0_10px_40px_rgba(20,52,35,0.06)]">
                <div className="rounded-[18px] px-0 py-0">
                  <SectionTitle className="text-base font-medium">{dictionary.location}</SectionTitle>

                  {/* W3C-7: dùng <address> thay <p> để tránh block-in-inline nesting với SpaLocationMeta */}
                  <address className="mt-3 flex items-start gap-1.5 not-italic">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-[#414651]" aria-hidden />
                    <div className="text-sm leading-6 text-[#0a0d12]">
                      {spa.googleMapsUri ? (
                        <a
                          href={spa.googleMapsUri}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline decoration-[#0a0d12] underline-offset-2"
                        >
                          {locationText}
                        </a>
                      ) : (
                        <span className="underline decoration-[#0a0d12] underline-offset-2">
                          {locationText}
                        </span>
                      )}
                      <SpaLocationMeta
                        lat={spa.location?.lat ?? null}
                        lng={spa.location?.lng ?? null}
                      />
                    </div>
                  </address>
                </div>
              </section>

              {/* ── Opening hours (collapsible) ── */}
              <section className="rounded-[24px] bg-white p-4 shadow-[0_10px_40px_rgba(20,52,35,0.06)]">
                <OpeningHoursToggle
                  openingHours={spa.openingHours}
                  dayLabels={dictionary.dayLabels}
                  closedLabel={dictionary.closed}
                  openHoursLabel={dictionary.openHours}
                  todayLabel={dictionary.today}
                />
              </section>



              {/* ── Multi-platform Reviews ── */}
              <MultiPlatformReviews
                spaName={spa.name}
                googleRating={spa.ratingValue}
                googleReviewCount={spa.reviewCount}
                allReviews={spa.reviews?.map((r) => ({
                  quote: r.content || "",
                  by: r.authorName,
                  rating: r.rating || 0,
                  languageCode: r.languageCode ?? null,
                  source: r.source ?? null,
                  postUrl: r.postUrl ?? null,
                }))}
                googleMapsUri={spa.googlePlaceId ? `https://search.google.com/local/reviews?placeid=${spa.googlePlaceId}` : spa.googleMapsUri || null}
              />

          </div>
        </Container>
      </main>
    </div>
  );
}
