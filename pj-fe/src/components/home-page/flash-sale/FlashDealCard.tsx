import type { DealCardDto } from "@/types/api";
import { TrackedDealLink } from "@/components/tracking/TrackedDealLink";
import { dealPathSegment, dealTrackingSlug } from "@/libs/deal-slug";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";

interface FlashDealCardProps {
  deal: DealCardDto;
  locale?: string;
}

/** Figma Nhom36 card: Error/500 badge — https://www.figma.com/design/B1AVv2kzIpwP4QawmsQoSb/Tuoi.ai?node-id=426-9796 */
function formatDiscountLabel(deal: DealCardDto): string | null {
  const pct = deriveDisplayDiscountPercent({
    discountPercent: deal.discountPercent,
    originalPrice: deal.originalPrice,
    salePrice: deal.salePrice,
  });
  return pct > 0 ? `-${pct}%` : null;
}

/**
 * RSC — Flash sale deal card.
 * Figma: card ~148×163, ảnh + badge %-góc-phải-trên + title + location (node 426:9796).
 * href: vào provider/spa.slug nếu có spa, fallback về deal slug.
 */
export function FlashDealCard({ deal, locale }: FlashDealCardProps) {
  // Nếu có spa.slug → vào trang spa provider; fallback về trang deal
  const href = deal.spa?.slug
    ? `/${locale ?? "vi"}/provider/${deal.spa.slug}`
    : `/${locale ?? "vi"}/organization_services/${dealPathSegment(deal)}`;

  const discountLabel = formatDiscountLabel(deal);

  // Location: ưu tiên distanceKm (nếu user share vị trí), rồi cityName, fallback empty string
  const locationText =
    deal.spa?.distanceKm != null
      ? `${Number(deal.spa.distanceKm || 0).toFixed(1)} km`
      : (deal.spa?.cityName ?? "");

  const card = (
    <div className="relative w-full rounded-[12px] bg-white shadow-[0px_1px_10px_-5px_rgba(20,52,35,0.4)] flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      {/* Image area — exact Figma "Subtract" shape via inline SVG clipPath */}
      <div className="relative mx-1 mt-1 w-[calc(100%-8px)] shrink-0">
        <svg
          viewBox="0 0 140 105"
          className="block w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-label={deal.spa?.name || deal.title}
        >
          <defs>
            {/* clipPathUnits="userSpaceOnUse" → same coord system as viewBox (0 0 140 105) */}
            <clipPath id={`clip-${deal.id}`} clipPathUnits="userSpaceOnUse">
              <path d="M97.73 0c6.627 0 11.999 5.373 11.999 12v9c0 6.075 4.925 11 11 11H128c6.627 0 12 5.373 12 12v49c0 6.627-5.373 12-12 12H12c-6.627 0-12-5.373-12-12V12C0 5.373 5.373 0 12 0z" />
            </clipPath>
          </defs>
          {/* Fallback brand color background — 100% fills entire SVG regardless of rendered size */}
          <rect
            width="100%"
            height="100%"
            clipPath={`url(#clip-${deal.id})`}
            fill="var(--brand-500)"
          />
          {/* Image clipped to exact Figma shape — 100% fills entire SVG */}
          {(deal.spa?.spaAvatarUrl || deal.coverImageUrl) && (
            <image
              href={deal.spa?.spaAvatarUrl || deal.coverImageUrl || ""}
              width="100%"
              height="100%"
              clipPath={`url(#clip-${deal.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </svg>

        {/* Badge — sits in the notch carved by the SVG path */}
        {discountLabel && (
          <div
            className="absolute right-0 top-0 z-10 flex h-[30px] w-[27px] flex-col items-center justify-center rounded-lg bg-[#f04438]"
            aria-label={`Giảm ${discountLabel}`}
          >
            <span className="whitespace-nowrap text-[9px] font-semibold leading-[1.4] text-white md:text-[10px]">
              {discountLabel}
            </span>
          </div>
        )}
      </div>

      {/* Info area — fixed height to keep cards uniform */}
      <div className="flex flex-1 flex-col gap-[3px] px-1.5 pb-2 pt-1">
        <p className="line-clamp-2 text-xs font-semibold leading-[1.4] text-[#0a0d12] md:text-sm lg:text-base">
          {deal.title}
        </p>
        {/* Location row — always rendered to keep uniform height */}
        <div className="flex items-center gap-0.5 min-h-[16px]">
          {locationText ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#414651"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 md:h-4 md:w-4"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="line-clamp-1 text-[10px] leading-[1.4] text-[#414651] md:text-xs">
                {locationText}
              </span>
            </>
          ) : (
            <span className="invisible text-[10px] leading-[1.4]">&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TrackedDealLink
      href={href}
      dealSlug={dealTrackingSlug(deal)}
      className="block rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7A4F] focus-visible:ring-offset-2"
    >
      {card}
    </TrackedDealLink>
  );
}
