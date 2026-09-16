"use client";

import type { RecommendedSpaDto } from "@/types/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/free-mode";
import { RecommendedSpaCard } from "./RecommendedSpaCard";

interface RecommendedSpaScrollProps {
  spas: RecommendedSpaDto[];
  locale?: string;
}

/**
 * Client: Swiper free-mode horizontal scroll for recommended spa cards.
 */
export function RecommendedSpaScroll({
  spas,
  locale,
}: RecommendedSpaScrollProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {spas.map((spa) => (
          <div
            key={spa.id}
            className="shrink-0 flex-[0_0_calc((100%-2*12px)/2.3)] sm:flex-[0_0_calc((100%-2*12px)/3.5)] lg:flex-[0_0_calc((100%-5*16px)/5.8)] xl:flex-[0_0_calc((100%-5*16px)/6.5)]"
          >
            <RecommendedSpaCard spa={spa} locale={locale} />
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
      className="-mx-4 px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      {spas.map((spa) => (
        <SwiperSlide key={spa.id}>
          <RecommendedSpaCard spa={spa} locale={locale} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
