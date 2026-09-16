"use client";

import { useState } from "react";
import { SpaSidebarCTA } from "./SpaSidebarCTA";
import { BookingMessageSheet } from "./BookingMessageSheet";
import type { OpeningPeriodDto, SpaDealDto } from "@/types/api";
import useTranslate from "@/hooks/useTranslate";

interface SpaSidebarProps {
  spaId?: string | number | null;
  spaName: string;
  phone?: string | null;
  chatUrls: {
    zaloUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
    whatsappUrl?: string | null;
  };
  labels?: {
    call?: string;
    chat?: string;
    report?: string;
  };
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  openingHours?: OpeningPeriodDto[];
  dayLabels?: string[];
  closedLabel?: string;
  openHoursLabel?: string;
  todayLabel?: string;
  bestDeal?: SpaDealDto | null;
  dictionary?: any;
}

export function SpaSidebar({
  spaId,
  spaName,
  phone,
  chatUrls,
  address,
  lat,
  lng,
  bestDeal,
  dictionary,
}: SpaSidebarProps) {
  const t = useTranslate("spa-detail");
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  const mapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : null;

  const handlePrimaryChatClick = () => {
    setBookingSheetOpen(true);
  };

  return (
    <aside className="hidden lg:block w-[352px] shrink-0">
      <div className="sticky top-4 flex flex-col gap-3">
        <div className="rounded-2xl border border-[#D6DDD3] bg-white p-4 shadow-[0_4px_18px_rgba(9,62,6,0.1)]">
          <SpaSidebarCTA
            spaId={spaId}
            spaName={spaName}
            phone={phone}
            chatUrls={{
              whatsappUrl: chatUrls.whatsappUrl,
              messengerUrl: chatUrls.facebookUrl,
              telegramUrl: chatUrls.telegramUrl,
              zaloUrl: chatUrls.zaloUrl,
            }}
            onPrimaryChatClick={handlePrimaryChatClick}
            bestDeal={bestDeal}
            dictionary={dictionary}
          />
        </div>

        {address && (
          <div className="rounded-2xl border border-[#D6DDD3] bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-[#093E06]">
              {t("location") || "Địa điểm"}
            </h3>

            {/* Map Placeholder */}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex h-[120px] w-full flex-col items-center justify-center rounded-xl transition-colors hover:opacity-90 relative overflow-hidden"
                style={{
                  backgroundColor: "#F2F2F2",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f2f2f2'/%3E%3Cg stroke='%23ffffff' stroke-width='4' opacity='0.8'%3E%3Cline x1='0' y1='100' x2='100' y2='0'/%3E%3Cline x1='0' y1='50' x2='50' y2='0'/%3E%3Cline x1='50' y1='100' x2='100' y2='50'/%3E%3Cline x1='0' y1='0' x2='100' y2='100'/%3E%3Cline x1='0' y1='50' x2='50' y2='100'/%3E%3Cline x1='50' y1='0' x2='100' y2='50'/%3E%3C/g%3E%3Ccircle cx='30' cy='30' r='15' fill='%23dcefd0'/%3E%3Ccircle cx='80' cy='70' r='10' fill='%23dcefd0'/%3E%3C/svg%3E\")",
                  backgroundSize: "100px 100px"
                }}
              >
                <div className="z-10 flex flex-col items-center justify-center relative">
                  <div className="absolute size-14 bg-[#EA4335] rounded-full opacity-[0.08]"></div>
                  <div className="absolute size-8 bg-[#EA4335] rounded-full opacity-[0.15]"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#EA4335" stroke="none" className="drop-shadow-sm relative z-10">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </a>
            ) : (
              <div
                className="mb-3 flex h-[120px] w-full flex-col items-center justify-center rounded-xl relative overflow-hidden"
                style={{
                  backgroundColor: "#F2F2F2",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f2f2f2'/%3E%3Cg stroke='%23ffffff' stroke-width='4' opacity='0.8'%3E%3Cline x1='0' y1='100' x2='100' y2='0'/%3E%3Cline x1='0' y1='50' x2='50' y2='0'/%3E%3Cline x1='50' y1='100' x2='100' y2='50'/%3E%3Cline x1='0' y1='0' x2='100' y2='100'/%3E%3Cline x1='0' y1='50' x2='50' y2='100'/%3E%3Cline x1='50' y1='0' x2='100' y2='50'/%3E%3C/g%3E%3Ccircle cx='30' cy='30' r='15' fill='%23dcefd0'/%3E%3Ccircle cx='80' cy='70' r='10' fill='%23dcefd0'/%3E%3C/svg%3E\")",
                  backgroundSize: "100px 100px"
                }}
              >
                <div className="z-10 flex flex-col items-center justify-center relative grayscale opacity-60">
                  <div className="absolute size-14 bg-[#EA4335] rounded-full opacity-[0.08]"></div>
                  <div className="absolute size-8 bg-[#EA4335] rounded-full opacity-[0.15]"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#EA4335" stroke="none" className="drop-shadow-sm relative z-10">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </div>
            )}

            <p className="mb-3 text-xs leading-5 text-[#5B6B58]">
              {address}
            </p>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center justify-center rounded-xl border border-[#DDE4D9] text-sm font-semibold text-[#40813D] transition-colors hover:bg-[#F5F7F4]"
              >
                {t("get_directions") || "Chỉ đường"}
              </a>
            )}
          </div>
        )}
      </div>

      <BookingMessageSheet
        open={bookingSheetOpen}
        onClose={() => setBookingSheetOpen(false)}
        spaName={spaName}
        phone={phone}
        chatUrls={chatUrls}
      />
    </aside>
  );
}
