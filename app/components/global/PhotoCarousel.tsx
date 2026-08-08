"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import "swiper/css";
import Photo, { PhotoProps } from "./Photo";
import type { Swiper as SwiperType } from "swiper";
import { useState } from "react";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";

interface PhotoCarouselProps {
  props: PhotoProps[];
}

// Swiper's own breakpoints rather than a useScreenSize() value: the hook starts
// at 0 on the server and on first paint, so a desktop load rendered one giant
// slide and then snapped to four. Breakpoints are applied by Swiper from the
// container width, with no first-render guess.
const BREAKPOINTS = {
  0: { slidesPerView: 1.15, spaceBetween: 12 },
  520: { slidesPerView: 2, spaceBetween: 12 },
  800: { slidesPerView: 2, spaceBetween: 10 },
  1100: { slidesPerView: 3, spaceBetween: 10 },
  1500: { slidesPerView: 4, spaceBetween: 10 },
};

// Big enough to hit with a thumb, and pushed off the photo itself so it doesn't
// cover the picture on a narrow screen.
const ARROW =
  "grid place-items-center w-11 h-11 rounded-full border-2 border-black bg-white text-pop-pink shadow-[2px_2px_0px_0px_#000] transition-transform duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

export default function PhotoCarousel({ props }: PhotoCarouselProps) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  if (props.length === 0) return null;

  return (
    <div className="w-full max-w-[100rem] py-3">
      <Swiper
        modules={[Autoplay]}
        autoplay={{
          delay: 2500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={props.length > 1}
        breakpoints={BREAKPOINTS}
        slidesPerView={1.15}
        spaceBetween={12}
        className="w-full"
        onSwiper={setSwiper}
      >
        {props.map((photo, index) => (
          <SwiperSlide key={index}>
            <div className="flex h-64 items-center justify-center sm:h-80 lg:h-96">
              {/* TODO: make accessible */}
              <Photo
                src={photo.src}
                alt={photo.alt ? photo.alt : "Photo of a recent event."}
                tape={photo.tape}
                typeOverride="h-full w-auto max-w-full"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Below the strip rather than layered over it: on a phone the slide is
          nearly the full width, so overlaid arrows sat on top of the photo. */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          className={ARROW}
          onClick={() => swiper?.slidePrev()}
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className={ARROW}
          onClick={() => swiper?.slideNext()}
          aria-label="Next photo"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
