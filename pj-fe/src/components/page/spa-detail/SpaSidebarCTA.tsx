"use client";


import { Phone, Bookmark, Share2, MessageCircle, ChevronRight, Info } from "lucide-react";
import { cn } from "@/libs/utils";
import useTranslate from "@/hooks/useTranslate";
import { useSavedSpas } from "@/hooks/useSavedSpas";
import type { SpaDealDto } from "@/types/api";
import type { SpaDetailDictionary } from "./DealCard";
import { useParams } from "next/navigation";
import { DealPriceDisplay } from "./DealPriceDisplay";
import { deriveDisplayDiscountPercent } from "@/libs/deal-discount-percent";

type ChannelType = "whatsapp" | "messenger" | "telegram" | "zalo";

const CHANNEL_ICONS: Record<ChannelType, string | null> = {
  whatsapp: "/assets/images/deal-slug/Whatsapp.svg",
  messenger: "/assets/images/deal-slug/Facebook.svg",
  telegram: "/assets/images/deal-slug/telegram.svg",
  zalo: "/assets/images/deal-slug/zalo.svg",
};

const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: "WhatsApp",
  messenger: "Facebook Messenger",
  telegram: "Telegram",
  zalo: "Zalo",
};



const CHANNEL_ORDER: ChannelType[] = ["whatsapp", "messenger", "telegram", "zalo"];

interface SpaSidebarCTAProps {
  spaId?: string | number | null;
  spaName: string;
  phone?: string | null;
  chatUrls: {
    whatsappUrl?: string | null;
    messengerUrl?: string | null;
    telegramUrl?: string | null;
    zaloUrl?: string | null;
  };
  onPrimaryChatClick?: () => void;
  bestDeal?: SpaDealDto | null;
  dictionary?: SpaDetailDictionary | any;
}

export function SpaSidebarCTA({
  spaId,
  spaName,
  phone,
  chatUrls,
  onPrimaryChatClick,
  bestDeal,
  dictionary,
}: SpaSidebarCTAProps) {
  const t = useTranslate("spa-detail");
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const { isSaved, toggleSaveSpa } = useSavedSpas();
  const saved = spaId ? isSaved(spaId) : false;

  const urlByChannel: Record<ChannelType, string | null | undefined> = {
    whatsapp: chatUrls.whatsappUrl,
    messenger: chatUrls.messengerUrl,
    telegram: chatUrls.telegramUrl,
    zalo: chatUrls.zaloUrl,
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: spaName, url });
      } catch {
        // user cancelled
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        alert(t("copied") || "Đã copy link!");
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {bestDeal && dictionary && (
        <div className="mb-1">
          <p className="text-[11px] font-bold text-[#5B6B58] mb-1 uppercase tracking-wide">
            {t("best_deal_label") || dictionary.bestDealLabel || "Ưu đãi tốt nhất tại đây"}
          </p>
          <DealPriceDisplay
            salePrice={bestDeal.salePrice}
            originalPrice={bestDeal.originalPrice}
            discountPercent={deriveDisplayDiscountPercent({
              discountPercent: bestDeal.discountPercent,
              originalPrice: bestDeal.originalPrice,
              salePrice: bestDeal.salePrice,
            })}
            salePriceColorClass="text-[#40813D] text-[24px] font-bold"
          />
          <p className="text-xs text-[#5B6B58] mt-1.5 line-clamp-1">
            {(locale === "en" ? bestDeal.shortDescriptionEn : locale === "ko" ? bestDeal.shortDescriptionKo : bestDeal.shortDescriptionVi) ||
              bestDeal.title}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onPrimaryChatClick}
        className="w-full flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#40813D] transition-opacity hover:opacity-90 cursor-pointer"
      >
        <span className="text-[15px] font-semibold text-white">
          {t("schedule_consultation") || "Chat để đặt lịch"}
        </span>
        <span className="text-[10.5px] text-[#E8FDE7]">
          {t("chat_hint") || "spa thường trả lời trong ~5 phút"}
        </span>
      </button>

      {/* Ghi chú GlowExplore không thu tiền */}
      <div className="flex items-start gap-1.5 rounded-xl bg-[#DDE4D9] p-3 text-[11px] leading-relaxed text-[#5B6B58]">
        <Info className="mt-[2px] size-3.5 shrink-0" />
        <span>
          {t("no_payment_notice") ||
            "GlowExplore không thu tiền — bạn đặt và thanh toán trực tiếp với spa."}
        </span>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-[#5B6B58]">
          {t("contact_channels") || "KÊNH LIÊN HỆ"}
        </p>
        <div className="flex flex-col gap-2">
          {CHANNEL_ORDER.map((channel) => {
            const url = urlByChannel[channel]?.trim();
            const isDisabled = !url;
            const iconSrc = CHANNEL_ICONS[channel];
            
            const Tag = isDisabled ? "div" : "a";
            const hrefProps = isDisabled ? {} : { href: url, target: "_top", rel: "noopener noreferrer" };

            return (
              <Tag
                key={channel}
                {...hrefProps}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-[#DDE4D9] px-3 py-2.5 transition-colors",
                  isDisabled
                    ? "opacity-50 cursor-not-allowed bg-[#F9FAFB]"
                    : "hover:border-[#40813D] hover:bg-[#F5F7F4]"
                )}
              >
                {iconSrc ? (
                  <img src={iconSrc} alt="" className="h-[34px] w-[34px] shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-gray-200">
                    <MessageCircle className="size-5 text-gray-500" />
                  </div>
                )}
                
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-[#181d27]">
                    {CHANNEL_LABELS[channel]}
                  </span>

                </div>
                <ChevronRight className="size-4 text-[#a4a7ae]" />
              </Tag>
            );
          })}
          {(() => {
            const hasPhone = !!phone;
            const Tag = hasPhone ? "a" : "div";
            const hrefProps = hasPhone ? { href: `tel:${phone}` } : {};
            
            return (
              <Tag
                {...hrefProps}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-[#DDE4D9] px-3 py-2.5 transition-colors",
                  !hasPhone
                    ? "opacity-50 cursor-not-allowed bg-[#F9FAFB]"
                    : "hover:border-[#40813D] hover:bg-[#F5F7F4]"
                )}
              >
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-[#40813D]">
                  <Phone className="size-4 text-white" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-[#181d27]">
                    {hasPhone ? `${t("call") || "Gọi"} ${phone}` : t("call") || "Gọi"}
                  </span>
                </div>
                <ChevronRight className="size-4 text-[#a4a7ae]" />
              </Tag>
            );
          })()}
        </div>
      </div>



      {(() => {
        const hasPhone = !!phone;
        const Tag = hasPhone ? "a" : "div";
        const hrefProps = hasPhone ? { href: `tel:${phone}` } : {};

        return (
          <Tag
            {...hrefProps}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-colors",
              hasPhone
                ? "border-[#40813D] text-[#40813D] hover:bg-[#F5F7F4]"
                : "cursor-not-allowed border-[#e9eaeb] text-[#a4a7ae] opacity-50",
            )}
          >
            <Phone className="size-4" />
            {hasPhone ? phone : t("show_phone") || "Hiện số điện thoại"}
          </Tag>
        );
      })()}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => spaId && toggleSaveSpa(spaId)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors",
            saved
              ? "border-[#40813D] bg-[#E6EBE4] text-[#40813D]"
              : "border-[#DDE4D9] text-[#40813D] hover:bg-[#F5F7F4]",
          )}
        >
          <Bookmark className={cn("size-4", saved && "fill-[#40813D]")} />
          {t("save") || "Lưu"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#DDE4D9] py-2.5 text-xs font-semibold text-[#40813D] transition-colors hover:bg-[#F5F7F4]"
        >
          <Share2 className="size-4" />
          {t("share") || "Chia sẻ"}
        </button>
      </div>
    </div>
  );
}
