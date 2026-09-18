"use client";

import type { RecommendedSpaDto } from "@/types/api";
import { getOpeningStatus } from "@/libs/opening-hours";
import { resolveSpaListingImageSrcWithFallback, shouldBypassNextImageOptimization } from "@/libs/spa-image-url";
import Image from "next/image";
import Link from "next/link";
import { SaveSpaButton } from "@/components/common/save-spa-button/SaveSpaButton";
import { formatPrice } from "@/helpers/numbers";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { useTranslation } from "@/i18n/client";
import type { LocaleTypes } from "@/i18n/settings";

export function NearbySpaCard({
  spa,
  locale = "vi",
}: {
  spa: RecommendedSpaDto;
  locale?: string;
}) {
  const { t } = useTranslation(locale as LocaleTypes, "home");
  const href = `/${locale}/provider/${spa.slug}`;

  const imageSrc = resolveSpaListingImageSrcWithFallback({
    spaAvatarUrl: spa.spaAvatarUrl,
    photoName: spa.photoName,
  });
  const unoptimized = shouldBypassNextImageOptimization(imageSrc);

  const openingStatus = getOpeningStatus(spa.openingHours, t);

  const discountPct = spa.bestDeal
    ? deriveDisplayDiscountPercent({
        discountPercent: spa.bestDeal.discountPercent,
        originalPrice: spa.bestDeal.originalPrice,
        salePrice: spa.bestDeal.salePrice,
      })
    : 0;

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[20px] bg-white border border-[#E5E9E4] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Image Block (298x150 aspect ratio) */}
      <Link
        href={href}
        className="group relative aspect-[298/150] w-full shrink-0 overflow-hidden bg-zinc-100 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7A4F] focus-visible:ring-offset-2"
      >
        <Image
          src={imageSrc}
          alt={spa.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 298px"
          quality={85}
          unoptimized={unoptimized}
        />
        {/* Save Button top-right */}
        <div className="absolute z-20 right-3.5 top-3.5" onClick={(e) => e.stopPropagation()}>
          <SaveSpaButton spaId={spa.slug || spa.id} size={16} className="p-1.5 shadow-md bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors" />
        </div>
      </Link>

      {/* Content info & best deal below image (Padding 13px) */}
      <div className="flex flex-col flex-1 p-[13px] justify-between gap-2.5">
        <Link
          href={href}
          className="group/info flex flex-col gap-1.5 focus-visible:outline-none"
        >
          <p className="truncate text-[14.5px] font-bold tracking-tight text-[#093E06] group-hover/info:text-[#2a5c27] transition-colors">
            {spa.name}
          </p>

          {/* Meta Row: Rating | View Count · Distance (Height 13px) */}
          <div className="flex flex-wrap items-center gap-1 text-[12.5px] leading-[13px] text-[#5B6B58]">
            {/* Rating */}
            <span className="flex items-center gap-1 font-bold text-[#093E06] shrink-0">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="#f59e0b"
                aria-hidden="true"
                className="shrink-0 -mt-0.5"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {spa.ratingValue ? Number(spa.ratingValue || 0).toFixed(1) : "0.0"}
            </span>

            {/* View Count (Color #5B6B58) */}
            {typeof spa.viewCount === "number" && spa.viewCount > 0 && (
              <>
                <span className="text-[#9BA898] font-normal shrink-0">|</span>
                <span className="flex items-center gap-1 font-medium text-[#5B6B58] shrink-0" title="Số lượt xem">
                  <svg className="w-3.5 h-3.5 text-[#5B6B58] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {new Intl.NumberFormat("de-DE").format(spa.viewCount)}
                </span>
              </>
            )}
          </div>

          {/* Opening Hours Status (Dot 6x6, #40813D) */}
          {openingStatus && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[12.5px]">
              <span
                className={`inline-block w-[6px] h-[6px] rounded-full shrink-0 ${
                  openingStatus.isOpen ? "bg-[#40813D]" : "bg-amber-500"
                }`}
              />
              {openingStatus.isOpen ? (
                <div className="flex items-center gap-1 truncate font-normal text-[#5B6B58]">
                  <span className="font-semibold text-[#40813D]">{openingStatus.text}</span>
                  {openingStatus.openSub && (
                    <span>· {openingStatus.openSub}</span>
                  )}
                </div>
              ) : (
                <span className="font-semibold text-amber-600 truncate">
                  {openingStatus.text}
                  {openingStatus.openSub && ` · ${openingStatus.openSub}`}
                </span>
              )}
            </div>
          )}
        </Link>

        {/* Best Deal Box at bottom with uniform fixed height (272x66, bg #DDE4D9, p 11px) */}
        {spa.bestDeal && (
          <div className="mt-auto pt-0.5">
            <Link
              href={`/${locale ?? "vi"}/organization_services/${spa.bestDeal.canonicalSlug || spa.bestDeal.slug || spa.bestDeal.id}`}
              className="flex flex-col justify-center h-[66px] w-full rounded-[12px] bg-[#DDE4D9] p-[11px] transition-all duration-200 hover:bg-[#d1dacb]"
            >
              <p className={`text-[12.5px] font-semibold text-[#093E06] ${
                spa.bestDeal.salePrice != null || discountPct > 0 ? "line-clamp-1" : "line-clamp-2"
              }`}>
                {spa.bestDeal.title || "Ưu đãi đặc biệt"}
              </p>
              {(spa.bestDeal.salePrice != null || discountPct > 0) && (
                <div className="flex items-baseline flex-wrap gap-2 mt-0.5">
                  {spa.bestDeal.salePrice != null ? (
                    <>
                      <span className="text-[15px] font-extrabold text-[#093E06]">
                        {formatPrice(spa.bestDeal.salePrice, { currency: spa.bestDeal.currency || "VND" })}
                      </span>
                      {spa.bestDeal.originalPrice != null &&
                        spa.bestDeal.originalPrice > spa.bestDeal.salePrice && (
                          <span className="text-[12.5px] font-medium text-[#9BA898] line-through">
                            {formatPrice(spa.bestDeal.originalPrice, { currency: spa.bestDeal.currency || "VND" })}
                          </span>
                        )}
                      {discountPct > 0 && (
                        <span className="shrink-0 rounded-[6px] bg-[#FCEDEA] px-[6px] py-[4px] text-[11px] leading-none font-bold text-[#C0392B]">
                          -{discountPct}%
                        </span>
                      )}
                    </>
                  ) : (
                    discountPct > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#FCEDEA] px-[6px] py-[4px] text-[11px] leading-none font-bold text-[#C0392B]">
                        Giảm {discountPct}%
                      </span>
                    )
                  )}
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
