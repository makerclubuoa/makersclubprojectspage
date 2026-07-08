"use client";
import Image from "next/image";
import Button from "../global/Button";
import art from "@/public/maker-club-art-colour.png";
import artVert from "@/public/maker-club-art-colour-vert.png";

export default function JoinSection() {
  const year = new Date().getFullYear();
  return (
    <div className="z-20 border-t-4 border-b-4 min-h-dvh w-full outline">
      <div className="z-10 min-h-full w-full bg-white flex flex-col justify-center items-center gap-0 p-0">
        <div className="justify-center relative flex flex-col items-center w-full h-dvh">
          <picture className="z-10">
            <source media="(max-width: 916px)" srcSet={artVert.src} />
            <Image
              src={art}
              alt="Background image."
              layout="fill"
              objectFit="cover"
            />
          </picture>
          <div className="text-center lg:w-full w-1/2">
            <p
              className="font-bold text-2xl md:text-4xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white pb-5"
            >
              {`Sound interesting?`}
              <br />
              <br />
              {`Register for ${year} now for free!`}
            </p>
            <Button
              onClick={() => {}}
              bgColour="pop-pink"
              textColour="white z-20"
            >
              Join Now!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
