"use client";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import "swiper/css";
import Photo, { PhotoProps } from "./Photo";
import type { Swiper as SwiperType } from "swiper";
import { useState } from "react";
import useScreenSize from "@/app/hooks/useScreenSize";

interface PhotoCarouselProps {
  props: PhotoProps[];
}

export default function PhotoCarousel({ props }: PhotoCarouselProps) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const screenSize = useScreenSize();
  return (
    <div className="py-3 flex relative">
      <Swiper
        loop={true}
        slidesPerView={(() => {
          if (screenSize < 600) return 1;
          if (screenSize <= 1000) return 2;
          if (screenSize > 1000 && screenSize < 1500) return 3;
          return 4;
        })()}
        spaceBetween={10}
        onSwiper={setSwiper}
      >
        {props.map((photo, index) => {
          return (
            <SwiperSlide key={index}>
              <div className="flex justify-center items-center h-96">
                <Photo src={photo.src} alt={photo.alt} />
              </div>
            </SwiperSlide>
          );
        })}
        <div className="absolute inset-0 z-10">
          <button
            className="absolute left-2 top-1/2 text-pop-pink -translate-y-1/2"
            onClick={() => swiper?.slidePrev()}
          >
            <ChevronLeft size={30} />
          </button>

          <button
            className="absolute right-2 top-1/2 text-pop-pink -translate-y-1/2"
            onClick={() => swiper?.slideNext()}
          >
            <ChevronRight size={30} />
          </button>
        </div>
      </Swiper>
    </div>
  );
}
