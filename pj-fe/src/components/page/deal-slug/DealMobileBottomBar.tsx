"use client";

import { useState } from "react";
import { Navigation } from "lucide-react";
import useTranslate from "@/hooks/useTranslate";
import dynamic from "next/dynamic";

const BookingMessageSheet = dynamic(
  () => import("@/components/page/spa-detail/BookingMessageSheet").then((mod) => mod.BookingMessageSheet),
  { ssr: false }
);

interface DealMobileBottomBarProps {
  spaName: string;
  phone?: string | null;
  chatUrls: {
    whatsappUrl?: string | null;
    zaloUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
  };
  mapsUrl?: string | null;
  dealTitle?: string | null;
  dealPrice?: string | null;
}

export function DealMobileBottomBar({
  spaName,
  phone,
  chatUrls,
  mapsUrl,
  dealTitle,
  dealPrice,
}: DealMobileBottomBarProps) {
  const t = useTranslate("deal-detail");
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleChatClick = () => {
    setSheetOpen(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex w-full max-w-[1136px] flex-col gap-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-3">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-[50px] shrink-0 items-center justify-center rounded-2xl border border-[#DDE4D9]"
              aria-label={t("get_directions") || "Chỉ đường"}
            >
              <Navigation className="size-5 text-[#40813D]" />
            </a>
          )}
          <button
            type="button"
            onClick={handleChatClick}
            className="flex h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#40813D] transition-opacity hover:opacity-90 cursor-pointer"
          >
            <span className="text-sm font-semibold text-white">
              {t("schedule_consultation") || "Chat để đặt lịch"}
            </span>
            <span className="text-[10px] text-[#E8FDE7]">
              {t("chat_hint") || "spa thường trả lời trong ~5 phút"}
            </span>
          </button>
        </div>
      </div>

      <BookingMessageSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        spaName={spaName}
        phone={phone}
        chatUrls={chatUrls}
        dealTitle={dealTitle}
        dealPrice={dealPrice}
      />
    </div>
  );
}
