import type { DealDetailDto } from "@/types/deal-detail";
import { DealSidebarCTA } from "./DealSidebarCTA";
import { formatPrice } from "@/helpers/numbers";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";
import { Eye } from "lucide-react";
import { formatDistanceKm } from "@/libs/distance-formatter";
import { getOpeningStatus } from "@/libs/opening-hours";
import Image from "next/image";
import { resolveSpaListingImageSrcWithFallback, shouldBypassNextImageOptimization } from "@/libs/spa-image-url";

interface DealSidebarProps {
  deal: DealDetailDto;
  t: (key: string) => string;
}

export function DealSidebar({ deal, t }: DealSidebarProps) {
  const spa = deal.spa;
  const firstPrice = (deal as any).variants?.[0]?.prices?.[0];
  const salePrice = deal.salePrice ?? firstPrice?.salePrice ?? null;
  const originalPrice = deal.originalPrice ?? firstPrice?.originalPrice ?? null;
  const discountPercent = deriveDisplayDiscountPercent({
    discountPercent: deal.discountPercent,
    originalPrice: originalPrice ?? 0,
    salePrice: salePrice ?? 0,
  });

  const openingStatus = (spa as any).openingHours ? getOpeningStatus((spa as any).openingHours, t) : null;

  return (
    <aside className="hidden lg:block w-[320px] shrink-0">
      <div className="sticky top-4 flex flex-col gap-3">
        {/* Giá + CTA */}
        <div className="rounded-2xl border border-[#D6DDD3] bg-white p-4 shadow-[0_4px_18px_rgba(9,62,6,0.1)]">
          {salePrice != null && (
            <div className="mb-3 flex flex-col gap-1">
              <span className="text-xs text-[#5B6B58]">
                {t("best_deal_at_spa") || "Ưu đãi tốt nhất tại đây"}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#40813D]">
                  {formatPrice(salePrice)}
                </span>
                {originalPrice != null && originalPrice > salePrice && (
                  <span className="text-sm text-[#5B6B58] line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <span className="w-fit rounded-md bg-[#fee4e2] px-1.5 py-0.5 text-xs font-semibold text-[#d92d20]">
                  -{discountPercent}%
                </span>
              )}
            </div>
          )}

          {/* Mini-card thông tin spa */}
          <div className="mb-3 flex items-center gap-3 border-t border-[#EAECF0] pt-3">
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
              <p className="truncate text-[13px] font-semibold text-[#093E06]">{spa.name}</p>
              <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[11.5px] leading-tight text-[#5B6B58]">
                <span className="font-semibold">{spa.ratingValue ? Number(spa.ratingValue || 0).toFixed(1) : "0.0"}</span>
                
                {typeof ((spa as any).viewCount ?? deal.viewCount) === "number" && ((spa as any).viewCount ?? deal.viewCount) > 0 && (
                  <>
                    <span className="text-[#9BA898] font-normal">|</span>
                    <span className="flex items-center gap-1 font-medium" title="Số lượt xem">
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      {new Intl.NumberFormat("de-DE").format((spa as any).viewCount ?? deal.viewCount)}
                    </span>
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
            </div>
          </div>
          <DealSidebarCTA
            spaId={spa.slug || spa.id}
            spaName={spa.name}
            phone={spa.contact?.phone ?? null}
            chatUrls={{
              whatsappUrl: (spa.contact as any)?.whatsappUrl || (spa.contact as any)?.whatsapp || null,
              zaloUrl: (spa.contact as any)?.zaloUrl || (spa.contact as any)?.zalo || null,
              facebookUrl: (spa.contact as any)?.facebookUrl || (spa.contact as any)?.messenger || (spa.contact as any)?.facebook || null,
              telegramUrl: (spa.contact as any)?.telegramUrl || (spa.contact as any)?.telegram || null,
            }}
            dealTitle={deal.title}
            dealPrice={salePrice != null ? formatPrice(salePrice) : null}
          />
        </div>
      </div>
    </aside>
  );
}
