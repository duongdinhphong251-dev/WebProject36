"use client";

import { useState } from "react";
import useTranslate from "@/hooks/useTranslate";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/libs/utils";
import { Phone, MessageCircle, ChevronRight } from "lucide-react";

export type ChannelType = "whatsapp" | "facebook" | "telegram" | "zalo";

const CHANNEL_ICONS: Record<ChannelType, string | null> = {
  whatsapp: "/assets/images/deal-slug/Whatsapp.svg",
  facebook: "/assets/images/deal-slug/Facebook.svg",
  telegram: "/assets/images/deal-slug/telegram.svg",
  zalo: "/assets/images/deal-slug/zalo.svg",
};

const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook Messenger",
  telegram: "Telegram",
  zalo: "Zalo",
};

const CHANNEL_ORDER: ChannelType[] = ["whatsapp", "facebook", "telegram", "zalo"];

export interface BookingMessageSheetProps {
  open: boolean;
  onClose: () => void;
  spaName: string;
  phone?: string | null;
  chatUrls?: {
    whatsappUrl?: string | null;
    zaloUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
  };
  defaultChannel?: ChannelType | "phone";
  dealTitle?: string | null;
  dealPrice?: string | null;
}

export function BookingMessageSheet({
  open,
  onClose,
  spaName,
  phone,
  chatUrls,
  defaultChannel,
  dealTitle,
}: BookingMessageSheetProps) {
  const t = useTranslate("spa-detail");
  const [selectedChannel, setSelectedChannel] = useState<ChannelType | "phone">(defaultChannel || "zalo");

  const cleanPhone = phone?.replace(/\s+/g, "") || "";

  const urlByChannel: Record<ChannelType, string | null | undefined> = {
    whatsapp: chatUrls?.whatsappUrl || (cleanPhone ? `https://wa.me/${cleanPhone}` : null),
    facebook: chatUrls?.facebookUrl,
    telegram: chatUrls?.telegramUrl,
    zalo: chatUrls?.zaloUrl || (cleanPhone ? `https://zalo.me/${cleanPhone}` : null),
  };

  const handleSendMessage = () => {
    if (selectedChannel === "phone") {
      if (cleanPhone) {
        const link = document.createElement("a");
        link.href = `tel:${cleanPhone}`;
        link.click();
      }
    } else {
      const url = urlByChannel[selectedChannel]?.trim();
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_top";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "fixed z-[100] max-h-[90vh] bg-white p-5 shadow-2xl transition-all border border-black/5",
          "inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0 w-full max-w-full min-w-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 border-t",
          "sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:border",
          "[animation:none!important]",
        )}
        showCloseButton
      >
        {/* Mobile Drag Handle */}
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#d5d7da] sm:hidden" />

        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-lg font-bold text-[#181d27]">
            {t("booking_sheet.title") || "Chat để đặt lịch"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-[#535862]">
            {dealTitle ? `Liên hệ ${spaName} để đặt ưu đãi "${dealTitle}"` : `Chọn kênh liên hệ để kết nối trực tiếp với ${spaName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#181d27]">
              {t("booking_sheet.send_via") || "Kênh liên hệ"}
            </label>
            <div className="flex flex-col gap-2">
              {CHANNEL_ORDER.map((ch) => {
                const url = urlByChannel[ch]?.trim();
                const isDisabled = !url;
                const iconSrc = CHANNEL_ICONS[ch];
                const isSelected = selectedChannel === ch;

                return (
                  <button
                    key={ch}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedChannel(ch)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors text-left",
                      isDisabled
                        ? "border-[#DDE4D9] opacity-50 cursor-not-allowed bg-[#F9FAFB]"
                        : isSelected
                          ? "border-[#40813D] bg-[#F5F7F4]"
                          : "border-[#DDE4D9] hover:bg-[#F5F7F4]"
                    )}
                  >
                    {iconSrc ? (
                      <img src={iconSrc} alt="" className="h-[34px] w-[34px] shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-gray-200">
                        <MessageCircle className="size-5 text-gray-500" />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold text-[#181d27]">
                        {CHANNEL_LABELS[ch]}
                      </span>
                    </div>
                    <ChevronRight className={cn("size-4", isSelected ? "text-[#40813D]" : "text-[#a4a7ae]")} />
                  </button>
                );
              })}

              {(() => {
                const hasPhone = !!cleanPhone;
                const isSelected = selectedChannel === "phone";

                return (
                  <button
                    type="button"
                    disabled={!hasPhone}
                    onClick={() => setSelectedChannel("phone")}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors text-left",
                      !hasPhone
                        ? "border-[#DDE4D9] opacity-50 cursor-not-allowed bg-[#F9FAFB]"
                        : isSelected
                          ? "border-[#40813D] bg-[#F5F7F4]"
                          : "border-[#DDE4D9] hover:bg-[#F5F7F4]"
                    )}
                  >
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[#40813D]">
                      <Phone className="size-4 text-white" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold text-[#181d27]">
                        {hasPhone ? `${t("call") || "Gọi"} ${phone}` : t("call") || "Gọi"}
                      </span>
                    </div>
                    <ChevronRight className={cn("size-4", isSelected ? "text-[#40813D]" : "text-[#a4a7ae]")} />
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-1">
            <button
              type="button"
              disabled={
                (selectedChannel === "phone" && !cleanPhone) ||
                (selectedChannel !== "phone" && !urlByChannel[selectedChannel]?.trim())
              }
              onClick={handleSendMessage}
              className="flex h-[46px] w-full items-center justify-center rounded-[14px] bg-[#5B7A4F] px-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {selectedChannel === "phone"
                ? (t("call_now") || "Gọi điện")
                : (t("booking_sheet.send_button", { channel: CHANNEL_LABELS[selectedChannel] }) || `Gửi tin nhắn qua ${CHANNEL_LABELS[selectedChannel]}`)}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
