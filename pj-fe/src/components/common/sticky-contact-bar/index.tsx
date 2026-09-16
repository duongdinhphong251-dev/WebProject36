"use client";

import { useState } from "react";
import useTranslate from "@/hooks/useTranslate";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/libs/utils";

export interface StickyContactBarProps {
  labels?: {
    call?: string;
    chat?: string;
    report?: string;
  };
  spaName?: string;
  phone?: string | null;
  chatUrls?: {
    zaloUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
  };
  onCallClick?: () => void;
  onChatClick?: () => void;
  onChatOptionSelect?: (
    type: "whatsapp" | "facebook" | "zalo" | "telegram",
  ) => void;
  /** 'fixed' (mặc định, hành vi cũ — dính đáy màn hình) hoặc 'static' (hiện như 1 khối bình thường trong layout, dùng cho sidebar desktop) */
  layout?: "fixed" | "static";
  /** Prefix cho id các phần tử con — tránh trùng id khi component này được render 2 lần cùng lúc trên 1 trang */
  idPrefix?: string;
  disableChatPopover?: boolean;
}

type ChannelType = "facebook" | "zalo" | "telegram";

const CHANNEL_ICONS: Record<ChannelType, string> = {
  facebook: "/assets/images/deal-slug/Facebook.svg",
  zalo: "/assets/images/deal-slug/zalo.svg",
  telegram: "/assets/images/deal-slug/telegram.svg",
};

/** Thứ tự giống Figma: Facebook → Zalo → Telegram */
const CHANNEL_ORDER: ChannelType[] = ["facebook", "zalo", "telegram"];

export function StickyContactBar({
  labels,
  spaName = "",
  phone,
  chatUrls,
  onCallClick,
  onChatClick,
  onChatOptionSelect,
  layout = "fixed",
  idPrefix = "sticky-contact",
  disableChatPopover,
}: StickyContactBarProps) {
  const t = useTranslate("deal-detail");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const reportLabel = labels?.report ?? t("contact.report");
  const callLabel = labels?.call ?? t("contact.call");
  const chatLabel = labels?.chat ?? t("contact.chat");

  /** Parent (spa/deal) luôn truyền object → luôn hiện menu 3 kênh; kênh không có URL thì disabled */
  const useChannelPicker = chatUrls != null && !disableChatPopover;

  const urlByChannel: Record<ChannelType, string | null | undefined> = {
    facebook: chatUrls?.facebookUrl,
    zalo: chatUrls?.zaloUrl,
    telegram: chatUrls?.telegramUrl,
  };

  const handleReport = () => {
    window.location.href = "tel:0896895500";
  };

  const handleCall = () => {
    if (onCallClick) onCallClick();
    else if (phone) window.location.href = `tel:${phone}`;
  };

  const handleChat = () => {
    if (onChatClick) {
      onChatClick();
    }
  };

  const handleChatOption = (type: ChannelType, url: string) => {
    if (onChatOptionSelect) {
      onChatOptionSelect(type);
    } else {
      window.location.href = url;
    }
    setIsChatOpen(false);
  };

  const chatButtonClass = cn(
    "flex min-w-0 flex-1 items-center justify-center rounded-[14px] border border-transparent px-3.5 py-2.5 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.2)] transition-opacity hover:opacity-90 active:opacity-80",
    "bg-[#5B7A4F]",
  );

  /** Không gán onClick={undefined} khi dùng PopoverTrigger+asChild — sẽ chặn handler mở popover của Radix */
  const chatButton = useChannelPicker ? (
    <button
      id={`${idPrefix}-chat`}
      type="button"
      className={chatButtonClass}
      aria-label={`${chatLabel} ${spaName}`}
      aria-haspopup="dialog"
      aria-expanded={isChatOpen}
    >
      <span className="text-center text-sm font-medium leading-[1.4] text-white">
        {chatLabel}
      </span>
    </button>
  ) : (
    <button
      id={`${idPrefix}-chat`}
      type="button"
      onClick={handleChat}
      className={chatButtonClass}
      aria-label={`${chatLabel} ${spaName}`}
    >
      <span className="text-center text-sm font-medium leading-[1.4] text-white">
        {chatLabel}
      </span>
    </button>
  );

  return (
    <div
      className={cn(
        layout === "fixed"
          ? "fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.1)]"
          : "rounded-2xl border border-[#D6DDD3] bg-white p-4",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full gap-3",
          layout === "fixed"
            ? "max-w-[1136px] items-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-4"
            : "flex-col",
        )}
      >
        {/* Report — Figma: #fef3f2, border #fee4e2, text #f04438, rounded 14px */}
        <button
          id={`${idPrefix}-report`}
          type="button"
          onClick={handleReport}
          className="flex items-center justify-center shrink-0 rounded-[14px] border border-[#fee4e2] bg-[#fef3f2] px-3.5 py-2.5 transition-opacity hover:opacity-90 active:opacity-80"
          aria-label={`${reportLabel} ${spaName}`}
        >
          <span className="text-sm font-medium leading-[1.4] text-[#f04438]">
            {reportLabel}
          </span>
        </button>

        {/* Call — CRO-2: luôn hiển thị button, disabled khi không có phone */}
        {phone ? (
          <button
            id={`${idPrefix}-call`}
            type="button"
            onClick={handleCall}
            className="flex items-center justify-center shrink-0 rounded-[14px] border border-[#D6DDD3] bg-[#E6EBE4] px-3.5 py-2.5 transition-opacity hover:opacity-90 active:opacity-80"
            aria-label={`${callLabel} ${spaName}`}
          >
            <span className="text-sm font-medium leading-[1.4] text-[#5B7A4F]">
              {callLabel}
            </span>
          </button>
        ) : (
          <button
            id={`${idPrefix}-call`}
            type="button"
            disabled
            title="Chưa có số điện thoại"
            className="flex items-center justify-center shrink-0 rounded-[14px] border border-[#e9eaeb] bg-[#f5f5f5] px-3.5 py-2.5 cursor-not-allowed opacity-50"
            aria-label={`${callLabel} — Chưa có số điện thoại`}
            aria-disabled="true"
          >
            <span className="text-sm font-medium leading-[1.4] text-[#a4a7ae]">
              {callLabel}
            </span>
          </button>
        )}

        {/* Chat + 3 kênh (Figma menu 185px) */}
        {useChannelPicker ? (
          <Popover
            open={isChatOpen}
            onOpenChange={(open) => {
              setIsChatOpen(open);
              if (open) handleChat();
            }}
            modal={false}
          >
            <PopoverTrigger asChild>{chatButton}</PopoverTrigger>
            <PopoverContent
              className={cn(
                "z-[100] w-[185px] rounded-2xl border border-black/[0.05] bg-white p-1 text-gray-950",
                "shadow-[0px_12px_16px_-4px_rgba(10,13,18,0.08),0px_4px_6px_-2px_rgba(10,13,18,0.03),0px_2px_2px_-1px_rgba(10,13,18,0.04)]",
                // Tắt zoom/fade mặc định của ui/popover — scale 95% làm chữ/icon bị mờ trên một số màn
                "[animation:none!important]",
              )}
              side="top"
              align="end"
              sideOffset={12}
              collisionPadding={16}
            >
              <div className="flex flex-col">
                {CHANNEL_ORDER.map((channel) => {
                  const rawUrl = urlByChannel[channel];
                  const url = rawUrl?.trim();

                  const label = t(`contact.channel_${channel}`);
                  const disabled = !url;

                  const innerContent = (
                    <>
                      <img
                        src={CHANNEL_ICONS[channel]}
                        alt=""
                        width={20}
                        height={20}
                        className={cn(
                          "size-5 shrink-0 object-contain",
                          disabled && "opacity-65",
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-base font-medium leading-normal",
                          disabled ? "text-[#a4a7ae]" : "text-[#181d27]",
                        )}
                      >
                        {label}
                      </span>
                    </>
                  );

                  const commonClassName = cn(
                    "flex w-full items-center gap-2 rounded-xl py-2.5 pl-2 pr-2.5 text-left transition-colors",
                    disabled
                      ? "cursor-not-allowed text-[#a4a7ae]"
                      : "text-[#181d27] hover:bg-gray-50 active:bg-gray-100",
                  );

                  return (
                    <div key={channel} className="px-1.5 py-px">
                      {onChatOptionSelect ? (
                        <button
                          id={`${idPrefix}-chat-${channel}`}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            url && handleChatOption(channel, url)
                          }
                          className={commonClassName}
                        >
                          {innerContent}
                        </button>
                      ) : disabled ? (
                        <button
                          id={`${idPrefix}-chat-${channel}`}
                          type="button"
                          disabled
                          className={commonClassName}
                        >
                          {innerContent}
                        </button>
                      ) : (
                        <a
                          id={`${idPrefix}-chat-${channel}`}
                          href={url}
                          target="_top"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (
                              channel === "telegram" &&
                              typeof navigator !== "undefined" &&
                              /FBAN|FBIOS|Zalo|TikTok|Instagram/i.test(navigator.userAgent)
                            ) {
                              e.preventDefault();
                              navigator.clipboard.writeText(url).then(() => {
                                alert("Zalo/Facebook đang chặn mở ứng dụng Telegram.\n\nĐã copy link! Vui lòng mở Safari hoặc Chrome và dán link để nhắn tin nhé.");
                              }).catch(() => {
                                alert("Zalo/Facebook đang chặn mở ứng dụng Telegram.\n\nVui lòng bấm vào biểu tượng 3 chấm ở góc màn hình và chọn 'Mở bằng trình duyệt' (Safari/Chrome) để tiếp tục.");
                              });
                              setIsChatOpen(false);
                              return;
                            }
                            setIsChatOpen(false);
                          }}
                          className={commonClassName}
                        >
                          {innerContent}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          chatButton
        )}
      </div>
    </div>
  );
}
