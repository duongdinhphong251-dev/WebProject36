"use client";

import { useState } from "react";
import { StickyContactBar } from "@/components/common/sticky-contact-bar";
import dynamic from "next/dynamic";

const BookingMessageSheet = dynamic(
  () => import("./BookingMessageSheet").then((mod) => mod.BookingMessageSheet),
  { ssr: false }
);

export interface SpaContactSectionProps {
  spaName: string;
  phone?: string | null;
  chatUrls: {
    whatsappUrl?: string | null;
    zaloUrl?: string | null;
    facebookUrl?: string | null;
    telegramUrl?: string | null;
  };
  labels: {
    call?: string;
    chat?: string;
    report?: string;
  };
}

export function SpaContactSection({
  spaName,
  phone,
  chatUrls,
  labels,
}: SpaContactSectionProps) {
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false);

  return (
    <>
      <StickyContactBar
        labels={labels}
        spaName={spaName}
        phone={phone}
        chatUrls={chatUrls}
        disableChatPopover={true}
        onChatClick={() => setBookingSheetOpen(true)}
      />
      <BookingMessageSheet
        open={bookingSheetOpen}
        onClose={() => setBookingSheetOpen(false)}
        spaName={spaName}
        phone={phone}
        chatUrls={chatUrls}
      />
    </>
  );
}
