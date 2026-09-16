"use client";

import type { SpaDealDto } from "@/types/api";
import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";
import { dealPathSegment, dealTrackingSlug } from "@/libs/deal-slug";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { useCurrencyPreference } from "@/hooks/useCurrencyPreference";
import { formatApplicableDailyWindow } from "@/libs/deal-time";

interface DealsForYouCardProps {
  deals: SpaDealDto[];
  bestDealId: number | null;
  locale: string;
}

export function DealsForYouCard({
  deals,
  bestDealId,
  locale,
}: DealsForYouCardProps) {
  const { formatPrice } = useCurrencyPreference();

  if (!deals || deals.length === 0) return null;

  const countText =
    locale === "en"
      ? `${deals.length} ${deals.length > 1 ? "deals available" : "deal available"}`
      : locale === "ko"
        ? `${deals.length}개 혜택 적용 trong`
        : `${deals.length} ưu đãi đang áp dụng`;

  const titleText =
    locale === "en"
      ? "Deals for you"
      : locale === "ko"
        ? "당신을 위한 혜택"
        : "Ưu đãi dành cho bạn";

  const viewDetailText =
    locale === "en"
      ? "View details"
      : locale === "ko"
        ? "자세히 보기"
        : "Xem chi tiết";

  return (
    <section className="rounded-[24px] bg-white p-4 md:p-5 shadow-[0_10px_40px_rgba(20,52,35,0.06)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#F0F2F5] pb-3.5">
        <h2 className="text-[17px] font-bold text-[#093E06]">
          {titleText}
        </h2>
        <span className="text-xs font-normal text-[#5B6B58]">
          {countText}
        </span>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {deals.map((deal) => {
          const isBestDeal = deal.id === bestDealId;
          const discountPercent = deriveDisplayDiscountPercent({
            discountPercent: deal.discountPercent,
            originalPrice: deal.originalPrice,
            salePrice: deal.salePrice,
          });

          // Short description / duration priority:
          // 1. shortDescription (by locale)
          // 2. durationMin (e.g. "60 phút")
          // 3. applicableTimeLabel / dailyWindow
          const localeShortDesc = locale === "en" ? deal.shortDescriptionEn : locale === "ko" ? deal.shortDescriptionKo : deal.shortDescriptionVi;
          const shortDesc =
            localeShortDesc ||
            (deal.durationMin != null && deal.durationMin > 0
              ? `${deal.durationMin} phút`
              : formatApplicableDailyWindow(deal.applicableTimeLabel, deal.applicableStartTime, deal.applicableEndTime) ||
                null);

          const dealHref = `/${locale}/organization_services/${dealPathSegment(deal)}`;
          const showOriginalPrice =
            deal.originalPrice != null &&
            (deal.salePrice == null || deal.originalPrice !== deal.salePrice);

          return (
            <div
              key={deal.id}
              className={`rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all ${
                isBestDeal
                  ? "border border-[#DDE4D9] bg-[#DDE4D9] shadow-sm"
                  : "border border-[rgba(9,62,6,0.09)] bg-white shadow-xs hover:border-[#D6DDD3]"
              }`}
            >
              {/* Top row: Title + Discount Badge */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-semibold text-[#0a0d12] leading-snug">
                    {deal.title}
                  </h3>
                  {discountPercent > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none ${
                        isBestDeal
                          ? "bg-[#C0392B] text-white"
                          : "bg-[#FCEDEA] text-[#C0392B]"
                      }`}
                    >
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {/* Short description / duration */}
                {shortDesc && (
                  <p className="line-clamp-1 text-xs font-normal text-[#5B6B58]">
                    {shortDesc}
                  </p>
                )}
              </div>

              {/* Bottom row: Price + CTA Button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/5">
                <div className="min-w-0">
                  {deal.salePrice != null && (
                    <p className={`text-[19px] font-bold leading-none ${isBestDeal ? "text-[#093E06]" : "text-[#d92d20]"}`}>
                      {formatPrice(deal.salePrice)}
                    </p>
                  )}
                  {showOriginalPrice && (
                    <p className="mt-1 text-xs font-normal text-[#a4a7ae] line-through leading-none">
                      {formatPrice(deal.originalPrice)}
                    </p>
                  )}
                </div>

                <TrackedDealLink
                  href={dealHref}
                  dealSlug={dealTrackingSlug(deal)}
                  aria-label={`${deal.title} — ${viewDetailText}`}
                  className={`inline-flex shrink-0 items-center justify-center rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    isBestDeal
                      ? "bg-[#40813D] text-white hover:bg-[#346a32] shadow-xs"
                      : "border border-[#40813D] bg-transparent text-[#40813D] hover:bg-[#F5F7F4]"
                  }`}
                >
                  {viewDetailText}
                </TrackedDealLink>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
