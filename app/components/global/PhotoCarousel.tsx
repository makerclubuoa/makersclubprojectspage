"use client";
import { useState } from "react";
import Photo, { PhotoProps } from "./Photo";

interface PhotoCarouselProps {
  props: PhotoProps[];
}

export default function PhotoCarousel({ props }: PhotoCarouselProps) {
  //NOTE: index is the leftmost viewable photo.
  const [index, setIndex] = useState<number>(0);
  const [photos, setPhotos] = useState<PhotoProps[]>(props);

  // function left() {
  //   if (index ) {
  //     setIndex(props.length - 1);
  //     return;
  //   }
  //   setIndex(index - 1);
  // }
  //
  // function right() {
  //   if (index + 1 === props.length) {
  //     setIndex(0);
  //     return;
  //   }
  //   setIndex(index + 1);
  // }

  return (
    <div className="grid grid-cols-6 outline min-h-40 w-[200%] justify-center pb-15 md:pb-10">
      {props.slice(index, index + 6).map((photo) => {
        const { src, alt, link, rotation, typeOverride, tape } = photo;
        return (
          <div className="bg-green-50 outline flex justify-center">
            <Photo
              src={src}
              alt={alt}
              link={link}
              rotation={rotation ?? rotation}
              typeOverride={typeOverride ?? typeOverride}
              tape={tape ?? tape}
            />
          </div>
        );
      })}
    </div>
  );
}
