"use client";

/**
 * ServiceCategoryMobileSwiper
 *
 * Dynamically imported → Swiper JS NOT in the main bundle.
 * Desktop users never load this file.
 * Mobile users load it lazily after initial paint.
 */

import type { LocaleTypes } from "@/i18n/settings";
import type { ServiceKey } from "@/constants/services";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { ServiceCategoryItem } from "./ServiceCategoryItem";

import "swiper/css";
import "swiper/css/pagination";

interface ServiceCategoryMobileSwiperProps {
  slideChunks: ServiceKey[][];
  locale: LocaleTypes;
}

export function ServiceCategoryMobileSwiper({
  slideChunks,
  locale,
}: ServiceCategoryMobileSwiperProps) {
  return (
    <>
      <Swiper
        modules={[Pagination]}
        slidesPerView={1}
        spaceBetween={16}
        cssMode={true}
        pagination={{
          el: ".service-pagination",
          clickable: true,
          bulletClass: "service-bullet",
          bulletActiveClass: "service-bullet-active",
        }}
        className="w-full pb-2"
      >
        {slideChunks.map((chunk, idx) => (
          <SwiperSlide key={idx}>
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {chunk.map((key) => (
                <ServiceCategoryItem key={key} serviceKey={key} locale={locale} />
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="service-pagination mt-4 flex justify-center gap-1.5" />
    </>
  );
}
