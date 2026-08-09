import { getPhotos } from "@/lib/ghost/photos";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import JoinSection from "../components/homepage/JoinSection";
import LinkButton from "../components/global/LinkButton";
import PhotoCarousel from "../components/global/PhotoCarousel";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function About() {
  const photos = await getPhotos();
  return (
    <div className="">
      {/* The page used to sit inside a fixed `h-dvh` box that also contained a
          second full-viewport JoinSection, so everything past the first screen
          spilled out of its own container. Height is content-driven now. */}
      <div className="w-full">
        {/* pt-20 clears the fixed nav, which was overlapping the heading. */}
        <div className="relative flex min-h-[38dvh] w-full flex-col justify-center overflow-hidden border-b-4 px-5 pt-20 pb-10">
          <Image
            src={photos[1]?.src ?? placeholder}
            alt=""
            fill
            sizes="100vw"
            priority
            className="brightness-75 object-cover -z-10"
          />
          <div className="flex w-full items-center justify-center">
            <p
              className={`font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:3px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white`}
            >
              About Us
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div className="flex items-center flex-col px-5 py-10 md:p-10 md:w-3/4">
            <div className="pb-10 font-semibold text-lg sm:text-xl md:text-2xl">
              <p className="">
                We make stuff!
                <br />
                <br />
                The Maker Club is a community dedicated to gathering makers of
                all abilities and backgrounds to share and build ideas together.
                Providing opportunities to learn, play, share, we welcome all
                who are interested in making, designing, or creating anything!
                <br />
                <br />
                With regular events and more, this is the University of
                Auckland&apos;s home for all who make.
              </p>
            </div>
            <div>
              <LinkButton
                link={process.env.NEXT_PUBLIC_SIGN_UP!}
                bgColour="pop-red"
                textColour="white"
              >
                Join Now!
              </LinkButton>
            </div>
          </div>
        </div>
        <div className="h-dvh min-h-[340px]">
          <JoinSection />
        </div>
        <Footer />
      </div>
    </div>
  );
}
