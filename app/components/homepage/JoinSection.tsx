"use client";

import Image from "next/image";
import Button from "../global/Button";
import art from "@/public/maker-club-art-colour.png";
import artVert from "@/public/maker-club-art-colour-vert.png";

export default function JoinSection() {
  const year = new Date().getFullYear();

  return (
    <div className="relative h-full w-full border-t-4 border-b-4">
      <picture className="absolute inset-0 z-0 block">
        <source media="(max-width: 2000px)" srcSet={artVert.src} />
        <Image
          src={art}
          alt="Background image."
          fill
          className="object-cover"
        />
      </picture>

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        <div className="text-center lg:w-full w-1/2">
          <p
            className="
              font-bold text-2xl md:text-4xl font-holt
              text-shadow-lg
              [-webkit-text-stroke:6px_black]
              [paint-order:stroke_fill]
              text-white
              pb-5
            "
          >
            Sound interesting?
            <br />
            <br />
            Register for {year} now for free!
          </p>

          <Button onClick={() => {}} bgColour="pop-pink" textColour="white">
            Join Now!
          </Button>
        </div>
      </div>
    </div>
  );
}
