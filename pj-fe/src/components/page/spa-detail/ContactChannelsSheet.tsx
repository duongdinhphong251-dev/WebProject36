"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Phone, MessageCircle, ChevronRight } from "lucide-react";
import { cn } from "@/libs/utils";
import useTranslate from "@/hooks/useTranslate";

export interface ContactChannelsSheetProps {
  open: boolean;
  onClose: () => void;
  phone?: string | null;
  chatUrls: {
    whatsappUrl?: string | null;
    messengerUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
    zaloUrl?: string | null;
  };
}

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

export function ContactChannelsSheet({
  open,
  onClose,
  phone,
  chatUrls,
}: ContactChannelsSheetProps) {
  const t = useTranslate("spa-detail");

  const urlByChannel: Record<ChannelType, string | null | undefined> = {
    whatsapp: chatUrls.whatsappUrl,
    messenger: chatUrls.messengerUrl || chatUrls.facebookUrl,
    telegram: chatUrls.telegramUrl,
    zalo: chatUrls.zaloUrl,
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

        <DialogHeader className="mb-2 text-left">
          <DialogTitle className="text-lg font-bold text-[#181d27]">
            {t("tap_to_message_spa") || "Nhấn cho spa"}
          </DialogTitle>
          <DialogDescription className="hidden">
            {t("tap_to_message_spa_desc") || "Liên hệ spa"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">


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
      </DialogContent>
    </Dialog>
  );
}
