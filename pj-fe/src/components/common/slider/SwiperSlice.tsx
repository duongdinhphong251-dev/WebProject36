"use client";

import { useRef } from "react";
import { Autoplay, Navigation, Pagination, Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const SWIPER_MODULES = [Pagination, Autoplay, Navigation, Scrollbar];

const DEFAULT_BREAKPOINTS = {
  991: {
    slidesPerView: 4,
    autoplay: false,
    pagination: false,
    spaceBetween: 24,
  },
  768: {
    slidesPerView: 2.5,
    autoplay: false,
    pagination: false,
    spaceBetween: 16,
  },
  600: {
    slidesPerView: 1.5,
    autoplay: false,
    pagination: false,
    spaceBetween: 16,
  },
};

export default function SwiperSlice({
  setting = {},
  Component = {},
  dataMapping = [],
  render,
  cls = "",
  callbackInstance,
}: any) {
  const refSwiper = useRef(null);

  return (
    <Swiper
      spaceBetween={24}
      centeredSlides={false}
      className={`mx-[-8px] w-[calc(100%+16px)] ${cls}`}
      modules={SWIPER_MODULES}
      ref={refSwiper}
      slidesPerView={1.5}
      onInit={(instaceSwiper) => {
        if (typeof callbackInstance == "function") {
          callbackInstance(instaceSwiper);
        }
      }}
      breakpoints={DEFAULT_BREAKPOINTS}
      {...setting}
    >
      {Array.isArray(dataMapping) &&
        dataMapping.length > 0 &&
        dataMapping.map((item: any, index: any) => {
          return (
            <SwiperSlide key={index}>
              {typeof render == "function" ? (
                render(item, refSwiper, index)
              ) : (
                <Component {...item} />
              )}
            </SwiperSlide>
          );
        })}
    </Swiper>
  );
}
