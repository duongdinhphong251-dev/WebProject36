"use client";

import { useState } from "react";
import { Phone, Bookmark, Share2, Info } from "lucide-react";
import { cn } from "@/libs/utils";
import { useSavedSpas } from "@/hooks/useSavedSpas";
import useTranslate from "@/hooks/useTranslate";
import dynamic from "next/dynamic";

const BookingMessageSheet = dynamic(
  () => import("@/components/page/spa-detail/BookingMessageSheet").then((mod) => mod.BookingMessageSheet),
  { ssr: false }
);

interface DealSidebarCTAProps {
  spaId?: string | number | null;
  spaName: string;
  phone?: string | null;
  chatUrls: {
    whatsappUrl?: string | null;
    zaloUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
  };
  dealTitle?: string | null;
  dealPrice?: string | null;
  onSaveClick?: () => void;
  onShareClick?: () => void;
}

export function DealSidebarCTA({
  spaId,
  spaName,
  phone,
  chatUrls,
  dealTitle,
  dealPrice,
  onSaveClick,
  onShareClick,
}: DealSidebarCTAProps) {
  const t = useTranslate("deal-detail");
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);
  const { isSaved, toggleSaveSpa } = useSavedSpas();

  const saved = spaId ? isSaved(spaId) : false;

  const handleChatClick = () => {
    setBookingSheetOpen(true);
  };

  const handleSave = () => {
    if (onSaveClick) {
      onSaveClick();
    } else if (spaId) {
      toggleSaveSpa(spaId);
    }
  };

  const handleShare = async () => {
    if (onShareClick) {
      onShareClick();
      return;
    }
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: spaName, url });
      } catch {
        // user cancelled share sheet
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
      {/* Chat để đặt lịch */}
      <button
        type="button"
        onClick={handleChatClick}
        className="w-full flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#40813D] transition-opacity hover:opacity-90 cursor-pointer"
      >
        <span className="text-[15px] font-semibold text-white">
          {t("schedule_consultation") || "Chat để đặt lịch"}
        </span>
        <span className="text-[10.5px] text-[#E8FDE7]">
          {t("chat_hint") || "tin nhắn kèm sẵn tên ưu đãi này"}
        </span>
      </button>

      {/* Ghi chú */}
      <div className="flex items-start gap-1.5 rounded-xl bg-[#DDE4D9] p-3 text-[11px] leading-relaxed text-[#5B6B58]">
        <Info className="mt-[2px] size-3.5 shrink-0" />
        <span>
          {t("no_payment_notice") ||
            "GlowExplore không thu tiền — bạn đặt và thanh toán trực tiếp với spa."}
        </span>
      </div>

      {/* Hiện số điện thoại */}
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

      {/* Lưu + Chia sẻ */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition-colors",
            saved
              ? "border-[#40813D] bg-[#E6EBE4] text-[#40813D]"
              : "border-[#DDE4D9] text-[#40813D] hover:bg-[#F5F7F4]",
          )}
        >
          <Bookmark className={cn("size-4", saved && "fill-[#40813D]")} />
          {t("save_deal") || "Lưu ưu đãi"}
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

      <BookingMessageSheet
        open={bookingSheetOpen}
        onClose={() => setBookingSheetOpen(false)}
        spaName={spaName}
        phone={phone}
        chatUrls={chatUrls}
        dealTitle={dealTitle}
        dealPrice={dealPrice}
      />
    </div>
  );
}
