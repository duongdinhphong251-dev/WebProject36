"use client";

import { useMemo, useState } from "react";
import useTranslate from "@/hooks/useTranslate";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/libs/utils";
import { Phone, MessageCircle, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";

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

const DAY_NAMES_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function fmt2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDayLocal(date: Date, dayNames: string[]): string {
  return `${dayNames[date.getDay()]} ${fmt2(date.getDate())}/${fmt2(date.getMonth() + 1)}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(base.getDate() + n);
  return d;
}

function buildDateGroups(now: Date = new Date()) {
  const today = now;
  const tomorrow = addDays(now, 1);

  // "Ngày kia": luôn đúng 3 ngày liên tiếp sau "Mai" (+2, +3, +4)
  const midGroup = [addDays(now, 2), addDays(now, 3), addDays(now, 4)];

  // "Cuối tuần": Thứ 7 gần nhất tính từ ngày+5 trở đi
  let sat = addDays(now, 5);
  while (sat.getDay() !== 6) {
    sat = addDays(sat, 1);
  }
  const sun = addDays(sat, 1);
  const weekendGroup = [sat, sun];

  return {
    today,
    tomorrow,
    midGroup,
    weekendGroup,
  };
}

type DateSelection =
  | { type: "today" }
  | { type: "tomorrow" }
  | { type: "mid"; dayIndex: number }
  | { type: "weekend"; dayIndex: number };

function getSelectedDateLabel(
  selection: DateSelection,
  groups: ReturnType<typeof buildDateGroups>,
  labels: { today: string; tomorrow: string; dayNames: string[] }
): string {
  switch (selection.type) {
    case "today":
      return `${labels.today} (${fmt2(groups.today.getDate())}/${fmt2(groups.today.getMonth() + 1)})`;
    case "tomorrow":
      return `${labels.tomorrow} (${fmt2(groups.tomorrow.getDate())}/${fmt2(groups.tomorrow.getMonth() + 1)})`;
    case "mid": {
      const d = groups.midGroup[selection.dayIndex] || groups.midGroup[0]!;
      return formatDayLocal(d, labels.dayNames);
    }
    case "weekend": {
      const d = groups.weekendGroup[selection.dayIndex] || groups.weekendGroup[0]!;
      return formatDayLocal(d, labels.dayNames);
    }
  }
}

const TIME_OPTIONS = [
  { id: "morning", labelKey: "booking_sheet.time_options.morning", defaultLabel: "Sáng 9–12h" },
  { id: "afternoon", labelKey: "booking_sheet.time_options.afternoon", defaultLabel: "Chiều 14–17h" },
  { id: "evening", labelKey: "booking_sheet.time_options.evening", defaultLabel: "Tối 18–21h" },
  { id: "flexible", labelKey: "booking_sheet.time_options.flexible", defaultLabel: "Linh động" },
] as const;

const PAX_OPTIONS = [
  { id: "pax_1", labelKey: "booking_sheet.pax_options.pax_1", defaultLabel: "1 người" },
  { id: "pax_2", labelKey: "booking_sheet.pax_options.pax_2", defaultLabel: "2 người" },
  { id: "pax_3_plus", labelKey: "booking_sheet.pax_options.pax_3_plus", defaultLabel: "3+ người" },
] as const;

export function BookingMessageSheet({
  open,
  onClose,
  spaName,
  phone,
  chatUrls,
  defaultChannel,
  dealTitle,
  dealPrice,
}: BookingMessageSheetProps) {
  const t = useTranslate("spa-detail");
  const params = useParams();
  const locale = (params?.locale as string) || "vi";

  const dateGroups = useMemo(() => buildDateGroups(), []);
  const [dateSelection, setDateSelection] = useState<DateSelection>({ type: "today" });
  const [openGroup, setOpenGroup] = useState<"mid" | "weekend" | null>(null);

  const [selectedChannel, setSelectedChannel] = useState<ChannelType | "phone">(defaultChannel || "zalo");

  const [selectedTimeId, setSelectedTimeId] = useState<string>("morning");
  const [selectedPaxId, setSelectedPaxId] = useState<string>("pax_2");


  const dayNamesLocal = t("booking_sheet.short_day_labels", { returnObjects: true }) as string[];
  const dayNames = Array.isArray(dayNamesLocal) ? dayNamesLocal : DAY_NAMES_VI;

  const todayLabel = t("booking_sheet.date_options.today") !== "booking_sheet.date_options.today" ? t("booking_sheet.date_options.today") : "Hôm nay";
  const tomorrowLabel = t("booking_sheet.date_options.tomorrow") !== "booking_sheet.date_options.tomorrow" ? t("booking_sheet.date_options.tomorrow") : "Mai";
  const nextDayLabel = t("booking_sheet.date_options.next_day") !== "booking_sheet.date_options.next_day" ? t("booking_sheet.date_options.next_day") : "Ngày kia";
  const weekendLabel = t("booking_sheet.date_options.weekend") !== "booking_sheet.date_options.weekend" ? t("booking_sheet.date_options.weekend") : "Cuối tuần";

  const dateLabelLocal = getSelectedDateLabel(dateSelection, dateGroups, {
    today: todayLabel,
    tomorrow: tomorrowLabel,
    dayNames,
  });

  const dateLabelVI = getSelectedDateLabel(dateSelection, dateGroups, {
    today: "Hôm nay",
    tomorrow: "Mai",
    dayNames: DAY_NAMES_VI,
  });

  const timeLabelLocal =
    t(`booking_sheet.time_options.${selectedTimeId}`) !== `booking_sheet.time_options.${selectedTimeId}`
      ? t(`booking_sheet.time_options.${selectedTimeId}`)
      : TIME_OPTIONS.find((tItem) => tItem.id === selectedTimeId)?.defaultLabel || "Sáng 9–12h";

  const timeLabelVI = TIME_OPTIONS.find((tItem) => tItem.id === selectedTimeId)?.defaultLabel || "Sáng 9–12h";

  const paxLabelLocal =
    t(`booking_sheet.pax_options.${selectedPaxId}`) !== `booking_sheet.pax_options.${selectedPaxId}`
      ? t(`booking_sheet.pax_options.${selectedPaxId}`)
      : PAX_OPTIONS.find((p) => p.id === selectedPaxId)?.defaultLabel || "2 người";

  const paxLabelVI = PAX_OPTIONS.find((p) => p.id === selectedPaxId)?.defaultLabel || "2 người";

  // Pre-composed auto message
  const messageVI = dealTitle
    ? `Chào ${spaName}, mình muốn dùng ưu đãi "${dealTitle}"${dealPrice ? ` (${dealPrice})` : ""} — ${dateLabelVI}, ${timeLabelVI}, ${paxLabelVI}. Spa còn chỗ không ạ?`
    : `Chào ${spaName}, mình muốn đặt lịch — ${dateLabelVI}, ${timeLabelVI}, ${paxLabelVI}. Spa còn chỗ không ạ?`;

  const messageLocalT = dealTitle
    ? t("booking_sheet.message_deal", { 
        spaName, 
        dealTitle, 
        dealPrice: dealPrice ? ` (${dealPrice})` : "", 
        dateLabel: dateLabelLocal, 
        timeLabel: timeLabelLocal, 
        paxLabel: paxLabelLocal,
        interpolation: { escapeValue: false }
      })
    : t("booking_sheet.message_no_deal", { 
        spaName, 
        dateLabel: dateLabelLocal, 
        timeLabel: timeLabelLocal, 
        paxLabel: paxLabelLocal,
        interpolation: { escapeValue: false }
      });

  const messageLocal = (messageLocalT && typeof messageLocalT === "string" && !messageLocalT.startsWith("booking_sheet.message_"))
    ? messageLocalT 
    : messageVI;

  const composedMessage = locale === "vi" 
    ? messageVI 
    : `${messageLocal}\n\n(${messageVI})`;

  const urlByChannel: Record<ChannelType, string | null | undefined> = {
    whatsapp: chatUrls?.whatsappUrl,
    facebook: chatUrls?.facebookUrl,
    telegram: chatUrls?.telegramUrl,
    zalo: chatUrls?.zaloUrl,
  };

  const handleSendMessage = () => {
    if (selectedChannel === "phone") {
      if (phone) {
        const link = document.createElement("a");
        link.href = `tel:${phone}`;
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
            {t("booking_sheet.subtitle") || "Chọn thông tin đặt lịch để gửi tin nhắn nhanh cho spa"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Group 1: Chọn ngày */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#181d27]">
              {t("booking_sheet.date_group_label") || "Chọn ngày"}
            </label>

            {/* 1 hàng ngang cuộn ngang cho 4 nút chính (rounded-full) */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Hôm nay */}
              <button
                type="button"
                onClick={() => {
                  setDateSelection({ type: "today" });
                  setOpenGroup(null);
                }}
                className={cn(
                  "flex-none whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer text-center",
                  dateSelection.type === "today"
                    ? "bg-[#5B7A4F] text-white shadow-xs"
                    : "border border-[#DDE4D9] bg-[#F5F7F4] text-[#181d27] hover:bg-[#E6EBE4]",
                )}
              >
                {`${todayLabel} (${dayNames[dateGroups.today.getDay()]})`}
              </button>

              {/* Mai */}
              <button
                type="button"
                onClick={() => {
                  setDateSelection({ type: "tomorrow" });
                  setOpenGroup(null);
                }}
                className={cn(
                  "flex-none whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer text-center",
                  dateSelection.type === "tomorrow"
                    ? "bg-[#5B7A4F] text-white shadow-xs"
                    : "border border-[#DDE4D9] bg-[#F5F7F4] text-[#181d27] hover:bg-[#E6EBE4]",
                )}
              >
                {`${tomorrowLabel} (${dayNames[dateGroups.tomorrow.getDay()]})`}
              </button>

              {/* Ngày kia — nhóm mở rộng */}
              <button
                type="button"
                onClick={() => {
                  if (openGroup === "mid") {
                    setOpenGroup(null);
                  } else {
                    setOpenGroup("mid");
                    setDateSelection({ type: "mid", dayIndex: 0 });
                  }
                }}
                className={cn(
                  "flex-none whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer text-center",
                  openGroup === "mid" || dateSelection.type === "mid"
                    ? "bg-[#5B7A4F] text-white shadow-xs"
                    : "border border-[#DDE4D9] bg-[#F5F7F4] text-[#181d27] hover:bg-[#E6EBE4]",
                )}
              >
                {nextDayLabel}
              </button>

              {/* Cuối tuần — nhóm mở rộng */}
              <button
                type="button"
                onClick={() => {
                  if (openGroup === "weekend") {
                    setOpenGroup(null);
                  } else {
                    setOpenGroup("weekend");
                    setDateSelection({ type: "weekend", dayIndex: 0 });
                  }
                }}
                className={cn(
                  "flex-none whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-150 cursor-pointer text-center",
                  openGroup === "weekend" || dateSelection.type === "weekend"
                    ? "bg-[#5B7A4F] text-white shadow-xs"
                    : "border border-[#DDE4D9] bg-[#F5F7F4] text-[#181d27] hover:bg-[#E6EBE4]",
                )}
              >
                {weekendLabel}
              </button>
            </div>

            {/* Accordion mở rộng khi chọn Ngày kia hoặc Cuối tuần */}
            {openGroup && (
              <div className="mt-2 flex flex-wrap gap-2 rounded-xl bg-[#F5F7F4] p-2.5 border border-[#DDE4D9]/60">
                {(openGroup === "mid" ? dateGroups.midGroup : dateGroups.weekendGroup).map((d, idx) => {
                  const isSelected =
                    (openGroup === "mid" && dateSelection.type === "mid" && dateSelection.dayIndex === idx) ||
                    (openGroup === "weekend" && dateSelection.type === "weekend" && dateSelection.dayIndex === idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDateSelection({ type: openGroup, dayIndex: idx })}
                      className={cn(
                        "flex-none whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                        isSelected
                          ? "bg-[#5B7A4F] text-white shadow-xs"
                          : "border border-[#DDE4D9] bg-white text-[#181d27] hover:bg-[#E6EBE4]",
                      )}
                    >
                      {formatDayLocal(d, dayNames)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Group 2: Khung giờ */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#181d27]">
              {t("booking_sheet.time_group_label") || "Khung giờ"}
            </label>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((item) => {
                const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel;
                const isSelected = selectedTimeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTimeId(item.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-[#5B7A4F] text-white shadow-xs"
                        : "border border-[#DDE4D9] bg-[#F5F7F4] text-[#181d27] hover:bg-[#E6EBE4]",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 3: Số người */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#181d27]">
              {t("booking_sheet.pax_group_label") || "Số lượng khách"}
            </label>
            <div className="flex flex-wrap gap-2">
              {PAX_OPTIONS.map((item) => {
                const label = t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.defaultLabel;
                const isSelected = selectedPaxId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPaxId(item.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-[#5B7A4F] text-white shadow-xs"
                        : "border border-[#DDE4D9] bg-[#F5F7F4] text-[#181d27] hover:bg-[#E6EBE4]",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Read-only Pre-composed Message Box */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#535862]">
              {t("booking_sheet.message_preview_label") || "Nội dung tin nhắn tự động"}
            </label>
            <textarea
              readOnly
              rows={3}
              value={composedMessage}
              className="w-full resize-none rounded-xl border border-[#DDE4D9] bg-[#F8FAF8] p-3 text-xs leading-relaxed text-[#181d27] focus:outline-none"
            />
          </div>

          <div className="border-t border-[#EAECF0] pt-4 mt-2">
            <label className="mb-2 block text-xs font-semibold text-[#181d27]">
              {t("booking_sheet.send_via") || "Gửi qua"}
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
                const hasPhone = !!phone;
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

          {/* Action Buttons */}
          <div className="mt-1">
            <button
              type="button"
              disabled={
                (selectedChannel === "phone" && !phone) ||
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
    </Dialog >
  );
}
