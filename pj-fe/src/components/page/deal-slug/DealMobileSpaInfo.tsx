import type { DealDetailDto } from "@/types/deal-detail";
import { Eye, Navigation } from "lucide-react";
import Link from "next/link";
import { formatDistanceKm } from "@/libs/distance-formatter";
import { getOpeningStatus } from "@/libs/opening-hours";
import Image from "next/image";
import { resolveSpaListingImageSrcWithFallback, shouldBypassNextImageOptimization } from "@/libs/spa-image-url";

interface DealMobileSpaInfoProps {
  deal: DealDetailDto;
  t: (key: string) => string;
  locale: string;
}

export function DealMobileSpaInfo({ deal, t, locale }: DealMobileSpaInfoProps) {
  const spa = deal.spa;
  const openingStatus = (spa as any).openingHours ? getOpeningStatus((spa as any).openingHours, t) : null;

  const mapsUrl =
    spa.lat != null && spa.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${spa.lat},${spa.lng}`
      : null;

  return (
    <section className="lg:hidden mt-3 overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_1px_10px_-6px_rgba(20,52,35,0.30)] sm:px-5">
      <h2 className="mb-3 text-[14.5px] font-bold text-[#093E06]">
        {t("deal_at_spa") !== "deal_at_spa" ? t("deal_at_spa") : "Ưu đãi tại"}
      </h2>
      
      <div className="flex gap-3">
        {spa.spaAvatarUrl || spa.photoName ? (
          <Image
            src={resolveSpaListingImageSrcWithFallback({ spaAvatarUrl: spa.spaAvatarUrl, photoName: spa.photoName })}
            alt={spa.name || "Spa"}
            width={48}
            height={48}
            unoptimized={shouldBypassNextImageOptimization(spa.spaAvatarUrl ?? spa.photoName)}
            className="size-12 flex-none rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-12 flex-none items-center justify-center rounded-xl bg-[#F5F7F4] text-[10px] text-[#7C8A78]">
            ảnh
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-bold text-[#093E06]">{spa.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11.5px] leading-tight text-[#5B6B58]">
            <span className="font-semibold">{spa.ratingValue ? Number(spa.ratingValue || 0).toFixed(1) : "0.0"}</span>
            
            {typeof ((spa as any).viewCount ?? deal.viewCount) === "number" && ((spa as any).viewCount ?? deal.viewCount) > 0 && (
              <>
                <span className="text-[#9BA898] font-normal">|</span>
                <span className="flex items-center gap-1 font-medium">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                  {new Intl.NumberFormat("de-DE").format((spa as any).viewCount ?? deal.viewCount)}
                </span>
              </>
            )}

            {spa.distanceKm != null && spa.distanceKm >= 0 && (
              <>
                <span className="text-[#9BA898] font-normal">·</span>
                <span className="font-medium">{formatDistanceKm(spa.distanceKm)}</span>
              </>
            )}

            {openingStatus && (
              <>
                <span className="text-[#9BA898] font-normal">·</span>
                {openingStatus.isOpen ? (
                  <span className="font-semibold text-[#40813D]">
                    {t("is_open_now") !== "is_open_now" ? t("is_open_now") : "Đang mở"}
                    {openingStatus.openSub ? <span className="font-normal text-[#5B6B58]"> · {openingStatus.openSub}</span> : null}
                  </span>
                ) : (
                  <span className="font-semibold text-amber-600">
                    {openingStatus.text}
                    {openingStatus.openSub ? <span className="font-normal text-[#5B6B58]"> · {openingStatus.openSub}</span> : null}
                  </span>
                )}
              </>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-[#5B6B58]">
            {spa.address}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[36px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#DDE4D9] text-[12.5px] font-semibold text-[#093E06] transition-colors hover:bg-[#F5F7F4]"
          >
            <Navigation className="w-4 h-4" />
            {t("get_directions") !== "get_directions" ? t("get_directions") : "Chỉ đường"}
          </a>
        )}
        <Link
          href={`/${locale}/provider/${spa.slug || spa.id}`}
          className="flex h-[36px] flex-1 items-center justify-center rounded-xl border border-[#DDE4D9] text-[12.5px] font-semibold text-[#093E06] transition-colors hover:bg-[#F5F7F4]"
        >
          {t("view_spa_page") !== "view_spa_page" ? t("view_spa_page") : "Xem trang spa"}
        </Link>
      </div>
    </section>
  );
}
