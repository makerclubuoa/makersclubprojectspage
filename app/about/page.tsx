import { getPhotos } from "@/lib/ghost/photos";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import JoinSection from "../components/homepage/JoinSection";
import LinkButton from "../components/global/LinkButton";
import PhotoCarousel from "../components/global/PhotoCarousel";
import Footer from "../components/Footer";

export default async function About() {
  const photos = await getPhotos();
  return (
    <div className="">
      <div className="h-dvh w-full">
        <div className="relative min-h-1/3 border-b-4 w-full flex flex-col justify-center">
          <div className="w-full h-1/3 ">
            <Image
              src={photos[1].src ?? placeholder}
              alt="Background."
              fill
              sizes="100vh"
              className="brightness-75 object-cover -z-10"
            />
            <div className="flex h-full w-full items-center justify-center">
              <p
                className={`font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white`}
              >
                About Us
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 min-h-2/3 w-full flex justify-between flex-col items-center gap-5">
          <div className="flex items-center flex-col p-10 md:w-3/4">
            <div className="pb-10 font-semibold text-xl md:text-2xl">
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
                Auckland's home for all who make.
              </p>
            </div>
            <div>
              <LinkButton link="">Register now!</LinkButton>
            </div>
          </div>
        </div>
        <div className="h-[50dvh]">
          <JoinSection />
        </div>
        <Footer />
      </div>
    </div>
  );
}
