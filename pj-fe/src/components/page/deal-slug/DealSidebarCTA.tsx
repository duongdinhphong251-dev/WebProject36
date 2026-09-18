"use client";

import { useState } from "react";
import { Phone, Info } from "lucide-react";
import { cn } from "@/libs/utils";
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
}

export function DealSidebarCTA({
  spaId: _spaId,
  spaName,
  phone,
  chatUrls,
  dealTitle,
  dealPrice,
}: DealSidebarCTAProps) {
  const t = useTranslate("deal-detail");
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  const handleChatClick = () => {
    setBookingSheetOpen(true);
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
            "Nhom36 không thu tiền — bạn đặt và thanh toán trực tiếp với spa."}
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
