"use client";

import type { RecommendedSpaDto } from "@/types/api";
import { resolveSpaListingImageSrcWithFallback, shouldBypassNextImageOptimization } from "@/libs/spa-image-url";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/helpers/numbers";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";

export function NearbySpaMobileCard({
  spa,
  locale,
}: {
  spa: RecommendedSpaDto;
  locale?: string;
}) {
  const href = `/${locale ?? "vi"}/provider/${spa.slug}`;

  const imageSrc = resolveSpaListingImageSrcWithFallback({
    spaAvatarUrl: spa.spaAvatarUrl,
    photoName: spa.photoName,
  });
  const unoptimized = shouldBypassNextImageOptimization(imageSrc);

  const discountPct = spa.bestDeal
    ? deriveDisplayDiscountPercent({
        discountPercent: spa.bestDeal.discountPercent,
        originalPrice: spa.bestDeal.originalPrice,
        salePrice: spa.bestDeal.salePrice,
      })
    : 0;

  return (
    <Link
      href={href}
      className="group flex items-center h-[94px] w-full gap-3 rounded-[16px] bg-white p-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all active:scale-[0.99] border border-[#E5E9E4] overflow-hidden"
    >
      {/* Thumbnail bên trái (Chuẩn xác 74x74 px, nền #F5F7F4) */}
      <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[12px] bg-[#F5F7F4] aspect-square">
        <Image
          src={imageSrc}
          alt={spa.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="74px"
          quality={85}
          unoptimized={unoptimized}
        />
      </div>

      {/* Thông tin bên phải (Cao chuẩn 74px tương xứng với ảnh, gồm 3 dòng tinh gọn) */}
      <div className="flex flex-1 h-[74px] flex-col justify-between min-w-0 py-0.5">
        {/* Tên Spa: 1 dòng ellipsis */}
        <h3 className="truncate text-[14.5px] leading-[18px] font-bold tracking-tight text-[#093E06] group-hover:text-[#2a5c27] transition-colors">
          {spa.name}
        </h3>

        {/* Dòng meta: Rating | View Count · Distance (Màu sắc và phông chuẩn từ Web) */}
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

          {/* View Count */}
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

        {/* Dòng Giá / Deal: Hiện trực tiếp 1 dòng súc tích, không bọc hộp xanh theo đúng ảnh mẫu */}
        {spa.bestDeal ? (
          <div className="flex items-baseline flex-wrap gap-1.5 min-w-0">
            {spa.bestDeal.salePrice != null ? (
              <>
                <span className="text-[14.5px] leading-[18px] font-extrabold text-[#093E06] truncate">
                  {spa.bestDeal.originalPrice != null && spa.bestDeal.originalPrice > spa.bestDeal.salePrice && !spa.bestDeal.title?.toLowerCase().includes("từ") ? "" : "từ "}
                  {formatPrice(spa.bestDeal.salePrice, { currency: spa.bestDeal.currency || "VND" })}
                </span>
                {spa.bestDeal.originalPrice != null &&
                  spa.bestDeal.originalPrice > spa.bestDeal.salePrice && (
                    <span className="text-[12px] font-medium text-[#9BA898] line-through shrink-0">
                      {formatPrice(spa.bestDeal.originalPrice, { currency: spa.bestDeal.currency || "VND" })}
                    </span>
                  )}
                {discountPct > 0 && (
                  <span className="shrink-0 rounded-[6px] bg-[#FCEDEA] px-[6px] py-[2px] text-[11px] leading-none font-bold text-[#C0392B]">
                    -{discountPct}%
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 w-full min-w-0">
                <span className="truncate text-[13px] font-semibold text-[#093E06] flex-1">
                  {spa.bestDeal.title || "Ưu đãi đặc biệt"}
                </span>
                {discountPct > 0 && (
                  <span className="shrink-0 rounded-[6px] bg-[#FCEDEA] px-[6px] py-[2px] text-[11px] leading-none font-bold text-[#C0392B]">
                    Giảm {discountPct}%
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[18px]" />
        )}
      </div>
    </Link>
  );
}
