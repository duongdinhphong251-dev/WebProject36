"use client";

import type { RecommendedSpaDto } from "@/types/api";
import { resolveSpaListingImageSrcWithFallback, shouldBypassNextImageOptimization } from "@/libs/spa-image-url";
import Image from "next/image";
import Link from "next/link";
import { SaveSpaButton } from "@/components/common/save-spa-button/SaveSpaButton";

import { formatDistanceKm } from "@/libs/distance-formatter";

export function RecommendedSpaCard({
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

  return (
    <Link
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7A4F] focus-visible:ring-offset-2 rounded-2xl"
    >
      <div className="relative flex min-h-[163px] w-full flex-col rounded-2xl border border-[#DDE4D9]/60 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#C6D0C2] overflow-hidden">
        <div className="relative mx-1.5 mt-1.5 aspect-[140/111] w-[calc(100%-12px)] shrink-0 overflow-hidden rounded-xl">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--brand-500)" }}
          />
          <Image
            src={imageSrc}
            alt={spa.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 45vw, 25vw"
            quality={80}
            unoptimized={unoptimized}
          />
        </div>

        {/* Save Button top-left */}
        <div className="absolute z-20 left-2.5 top-2.5">
          <SaveSpaButton spaId={spa.slug || spa.id} size={14} className="p-1.5 shadow-xs bg-white/90 backdrop-blur-xs rounded-full border border-black/5 hover:scale-105 transition-transform" />
        </div>

        {spa.activeDealCount > 0 && (
          <div className="absolute right-[8px] top-[8px] z-10 flex h-[22px] items-center justify-center rounded-lg bg-[#5B7A4F] px-2 shadow-xs">
            <span className="whitespace-nowrap text-[9.5px] font-semibold leading-none text-white md:text-[11px]">
              {spa.activeDealCount} deals
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center px-2 pb-2 pt-1.5">
          <p className="line-clamp-2 text-xs font-semibold text-zinc-950 md:text-base lg:text-lg">
            {spa.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="#f59e0b"
              aria-hidden="true"
              className="shrink-0 md:h-3 md:w-3"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[10px] font-medium text-zinc-600 md:text-sm">
              {Number(spa.ratingValue || 0).toFixed(1)}
            </span>
            {spa.cityName && (
              <span className="line-clamp-1 text-[10px] text-zinc-400 md:text-xs">
                · {spa.cityName}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
