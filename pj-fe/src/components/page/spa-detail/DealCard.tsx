"use client";

import { useEffect, useState } from "react";
import type { SpaDealDto } from "@/types/api";
import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";
import { dealTrackingSlug, dealPathSegment } from "@/libs/deal-slug";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { formatApplicableDailyWindow, formatSmartCampaignTime, type SmartCampaignTimeResult } from "@/libs/deal-time";
import { DealPriceDisplay } from "./DealPriceDisplay";
import { DealFlashSaleStatus } from "./DealFlashSaleStatus";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

export interface SpaDetailDictionary {
  about?: string;
  addReview: string;
  availableAt: string;
  call: string;
  closed: string;
  customerReviews: string;
  dealsForYou: string;
  dayLabels: string[];
  fromDate: string;
  startsFrom: string;
  validUntil: string;
  endsAt?: string;
  validPeriod: string;
  getDirections: string;
  location: string;
  openHours: string;
  today: string;
  ownerResponse: string;
  endsIn: string;
  flashSale: string;
  daysAgo: string;
  justNow: string;
  monthsAgo: string;
  like: string;
  share: string;
  report: string;
  reviews: string;
  scheduleConsultation: string;
  viewMoreReviews: string;
  views: string;
  spaDealsSummary?: string;
  spaDealsSummaryNoDiscount?: string;
  bestDealLabel?: string;
  save?: string;
  saved?: string;
  copied?: string;
  copyLink?: string;
  reportPlace?: string;
  wrongInfo?: string;
  chatHint?: string;
  noPaymentNotice?: string;
  contactChannels?: string;

  showPhone?: string;
  locationAndHours?: string;
  multiPlatformReviews?: string;
  updatedDaily?: string;
  noData?: string;
  noReviewsForLanguage?: string;
  noReviewYet?: string;
  allLanguages?: string;
  viewAllOnGoogle?: string;
  viewPostOnReddit?: string;
  viewAllOnPlatform?: string;
  filterByLanguage?: string;
  features?: Record<string, string>;
}

export function DealCard({
  deal,
  dictionary,
  locale,
  isBestDeal = false,
}: {
  deal: SpaDealDto;
  dictionary: SpaDetailDictionary;
  locale: string;
  isBestDeal?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const discountPercent = deriveDisplayDiscountPercent({
    discountPercent: deal.discountPercent,
    originalPrice: deal.originalPrice,
    salePrice: deal.salePrice,
  });

  // Priority: daily applicable window (e.g. "10:00-15:00") > campaign time
  // Mirrors the same logic used in DealInfo/index.tsx
  const dailyWindow = formatApplicableDailyWindow(
    deal.applicableTimeLabel,
    deal.applicableStartTime,
    deal.applicableEndTime,
  );
  const campaignTime = mounted
    ? formatSmartCampaignTime(deal.startAt, deal.endAt, dictionary.fromDate, locale)
    : null;
  const hasDailyWindow = !!dailyWindow;
  const availableTimeText = dailyWindow ?? campaignTime?.text ?? null;

  // Pick context-appropriate label based on campaign status
  function resolveLabel(campaign: SmartCampaignTimeResult | null): string {
    if (hasDailyWindow) return dictionary.availableAt;
    if (!campaign) return dictionary.availableAt;
    switch (campaign.status) {
      case "upcoming": return dictionary.startsFrom;
      case "ending": return dictionary.validUntil;
      case "active": return dictionary.validPeriod;
      case "same_day": return dictionary.availableAt;
      case "expiry_only": return dictionary.endsAt ?? dictionary.validUntil;
      default: return dictionary.availableAt;
    }
  }

  const timeLabel = resolveLabel(campaignTime);
  const isEndingSoon = !hasDailyWindow && campaignTime?.status === "ending";
  const dealHref = `/${locale}/organization_services/${dealPathSegment(deal)}`;

  return (
    <TrackedDealLink
      href={dealHref}
      dealSlug={dealTrackingSlug(deal)}
      aria-label={`${deal.title} — Xem chi tiết deal`}
      style={{
        boxShadow: "0 1px 10px -6px rgba(20, 52, 35, 0.40)",
      }}
      className="relative flex items-end gap-0.5 rounded-xl border border-[#d3d8e0] bg-[#fafafa] p-3 pr-7 transition-colors hover:bg-brand-200"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-2 text-xs font-medium leading-[1.4] text-[#0a0d12]">
          {deal.title}
        </p>

        <div className="space-y-1">
          {/* Label cho Ưu đãi tốt nhất tại đây (nếu là best deal) */}
          {isBestDeal && (
            <p className="text-xs font-normal text-[#5B6B58]">
              {dictionary.bestDealLabel ?? "Ưu đãi tốt nhất tại đây"}
            </p>
          )}

          {/* Price row */}
          <DealPriceDisplay
            salePrice={deal.salePrice}
            originalPrice={deal.originalPrice}
            discountPercent={discountPercent}
            salePriceColorClass={isBestDeal ? "text-[#5B7A4F]" : "text-[#d92d20]"}
          />

          {/* Bottom row: time label + flash sale status */}
          <div className="flex flex-col items-start gap-1">
            {availableTimeText ? (
              <div className="text-xs leading-[1.4] text-[#535862]">
                {timeLabel}:{" "}
                <span className={`font-medium ${isEndingSoon ? "text-[#92400e]" : "text-[#4A6340]"}`}>
                  {availableTimeText}
                </span>
              </div>
            ) : null}
            <DealFlashSaleStatus
              deal={deal}
              endsInLabel={dictionary.endsIn}
              flashSaleLabel={dictionary.flashSale}
            />
          </div>
        </div>
      </div>

      {/* Chevron — absolute center-right, outside flex flow */}
      <ChevronRight
        className="absolute right-3 top-[45%] size-4 -translate-y-1/2 text-[#98a2b3]"
        aria-hidden
      />
    </TrackedDealLink>
  );
}
