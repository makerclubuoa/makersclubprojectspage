import Link from "next/link";
import LinkButton from "./components/global/LinkButton";
import Image from "next/image";
import art from "@/public/maker-club-art-colour.png";
import artVert from "@/public/maker-club-art-colour-vert.png";

export const metadata = {
  title: "404 | Maker Club",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <picture className="absolute inset-0 z-0 block">
        <source media="(max-width: 2000px)" srcSet={artVert.src} />
        <Image
          src={art}
          alt="Background image."
          fill
          className="object-cover"
        />
      </picture>

      <h2
        className="text-white ${typeOverride} text-center z-10 font-holt text-5xl font-semibold mt-4 text-gray-700 [-webkit-text-stroke:6px_black]
              [paint-order:stroke_fill]
         "
      >
        Page Not Found
      </h2>
      <p className="z-10 text-2xl mt-2 font-semibold max-w-1/2">
        This world is vast and full of mysteries... Unfortunately, this page is
        one of them.
      </p>
      <LinkButton
        typeOverride="mt-5 z-10"
        bgColour="pop-pink"
        textColour="white"
        link="/"
      >
        Take Me Back!
      </LinkButton>
    </div>
  );
}
