import MapPin from "@/components/common/icons/MapPin";
import type { DealSpaBasicDto } from "@/types/deal-detail";

import { Star, ChevronRight } from "lucide-react";
import Link from "next/link";

import { getTranslation } from "@/i18n/server-cache";
import { SpaLogoThumb } from "./SpaLogoThumb";
import { SaveSpaButton } from "@/components/common/save-spa-button/SaveSpaButton";

interface SpaCardProps {
  spa: DealSpaBasicDto;
  locale: string;
  /** Fallback image from DealSpaBasicDto when spa.spaAvatarUrl is null */
  photoName?: string | null;
}


import { formatDistanceKm } from "@/libs/distance-formatter";

export async function SpaCard({ spa, locale, photoName }: SpaCardProps) {
  const { t } = await getTranslation(locale, "spa-detail");
  const address = spa.address;
  return (
    <>
      <section className="px-4 sm:px-5">
        <Link
          href={`/${locale}/provider/${spa.slug || spa.id}`}
          className="flex items-center gap-3"
        >
          {/* Logo — priority: logoUrl > spaAvatarUrl > photoName > fallback */}
          <SpaLogoThumb
            logoUrl={spa.spaAvatarUrl ?? null}
            photoName={photoName}
            name={spa.name}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-950 truncate">
              {spa.name}
            </p>

            <div className="mt-1 flex items-start gap-1">
              <MapPin />
              <p className="text-sm text-[#0A0D12] line-clamp-2 leading-snug text-underline">
                {address}
                {spa.distanceKm != null && spa.distanceKm >= 0 && (
                  <span className="ml-1 font-medium text-[#5B7A4F]">· {formatDistanceKm(spa.distanceKm)}</span>
                )}
              </p>
            </div>

            {/* Rating — Figma: star 16×16 Warning/400, 5.0 SemiBold Gray/700, (1024) Regular Gray/600 */}
            <div className="mt-1.5 flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning-400 text-warning-400" />
              <span className="text-xs font-semibold text-gray-700">
                {Number(spa.ratingValue || 0).toFixed(1)}
              </span>
              <span className="text-xs text-[#414651]">
                ({spa.reviewCount.toLocaleString()} {t("reviews")})
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <SaveSpaButton spaId={spa.slug || spa.id} />
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </Link>

        {/* 2 nút Chỉ đường + Xem trang spa */}
        <div className="mt-3 flex gap-2">
          {spa.lat != null && spa.lng != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${spa.lat},${spa.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#DDE4D9] py-2.5 text-xs font-semibold text-[#40813D]"
            >
              {t("get_directions") || "Chỉ đường"}
            </a>
          )}
          <Link
            href={`/${locale}/provider/${spa.slug}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#DDE4D9] py-2.5 text-xs font-semibold text-[#40813D]"
          >
            {t("view_spa_page") || "Xem trang spa"}
          </Link>
        </div>
      </section>
    </>
  );
}
