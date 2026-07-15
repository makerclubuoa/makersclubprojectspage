"use client";
import Image from "next/image";
import art from "@/public/maker-club-art.png";
import artVert from "@/public/maker-club-art-vert.png";
import Button from "../global/Button";

export default function Splash() {
  return (
    <div className="h-dvh w-full bg-grad flex flex-col justify-center items-center gap-0 p-0">
      <div className="flex flex-col items-center">
        <picture>
          <source media="(max-width: 2000px)" srcSet={artVert.src} />
          <Image
            src={art}
            alt="Background image."
            layout="fill"
            objectFit="cover"
          />
        </picture>
        <Image
          src={"maker-club-logo.svg"}
          alt="Maker Club logo."
          className="md:w-48"
          width={120}
          height={120}
        />
        <p className="text-white text-3xl md:text-5xl font-bold pb-3">
          Maker Club
        </p>
        <div className="w-3/4 lg:w-2/3 flex items-center justify-center">
          <p className="text-white text-md md:text-xl font-bold text-center w-3/4 pb-8 text-shadow-lg">
            {`We're gathering makers to create ideas together. If you design, crochet, cook, code, or like creating new things, then we're here for you. With regular events and more, this is the University of Auckland's home for all who make.`}
          </p>
        </div>
        <Button onClick={() => {}} typeOverride="z-10 relative">
          Join Now!
        </Button>
      </div>
    </div>
  );
}
