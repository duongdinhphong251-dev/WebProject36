"use client";

import type { DealCardDto } from "@/types/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { useEffect, useState } from "react";

import "swiper/css";
import "swiper/css/free-mode";
import { FlashDealCard } from "./FlashDealCard";

interface SpaCardScrollProps {
  deals: DealCardDto[];
  locale?: string;
}

/**
 * Client: Swiper free-mode horizontal scroll for flash-sale deal cards.
 */
export function SpaCardScroll({ deals, locale }: SpaCardScrollProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-3 flex gap-3 overflow-x-auto overflow-y-visible">
        {deals.map((deal) => (
          <div key={deal.id} className="flex-[0_0_calc((100%-2*12px)/2.3)] sm:flex-[0_0_calc((100%-2*12px)/3.5)] lg:flex-[0_0_calc((100%-5*16px)/5.8)] xl:flex-[0_0_calc((100%-5*16px)/6.5)] shrink-0 py-1">
            <FlashDealCard deal={deal} locale={locale} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Swiper
      modules={[FreeMode]}
      freeMode={{ enabled: true, momentum: true }}
      slidesPerView={2.3}
      spaceBetween={12}
      breakpoints={{
        640: { slidesPerView: 3.5, spaceBetween: 12 },
        1024: { slidesPerView: 5.8, spaceBetween: 16 },
        1280: { slidesPerView: 6.5, spaceBetween: 16 },
      }}
      className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-3 !overflow-y-visible"
    >
      {deals.map((deal) => (
        <SwiperSlide key={deal.id} className="py-1">
          <FlashDealCard deal={deal} locale={locale} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
