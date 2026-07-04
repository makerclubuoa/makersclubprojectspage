"use client";
import useScreenSize from "@/app/hooks/useScreenSize";
import Button from "../global/Button";
import Polaroid from "../global/Polaroid";
import Header from "../homepage/Header";
import MakeAThonSection from "../homepage/MakeathonSection";
import MovingText from "../homepage/MovingText";
import Splash from "../homepage/Splash";
import art from "@/public/maker-club-art.png";
import Image from "next/image";
import Screentone from "../global/Screentone";

export default function MakeathonSection() {
  const screenSize = useScreenSize();

  return (
    <div className="">
      <Header
        text="Join our Make-A-Thon!"
        rotation={1.54}
        typeOverride="relative lg:top-12 h-20 pl-5 md:pl-10"
        bgColour="pop-red"
        colour="white"
      />
      {screenSize <= 768 ? (
        <div className="pt-10 w-full flex flex-col items-center">
          <Polaroid src={art} onClick={undefined} description="hi">
            <Image
              src={"screentone.svg"}
              fill
              alt=""
              className="[filter:brightness(0)_saturate(100%)_invert(43%)_sepia(92%)_saturate(3035%)_hue-rotate(320deg)_brightness(102%)_contrast(103%)]
                opacity-15 absolute scale-150 object-cover"
            />
          </Polaroid>
          <div className="pt-24 w-2/3 pr-5 lg:pr-20 text-lg lg:text-2xl font-bold flex justify-center flex-col">
            <p>
              {`Looking to collaborate with like-minded individuals? Our new semester long Make-A-Thon is the perfect place to get those creative juices going!`}
              <br />
              <br />
              {`Join us for Launch Night on DATE HERE, where we decide our theme for this semester.`}
            </p>
            <div className="flex justify-center py-3 lg:pt-5">
              <Button onClick={() => {}} bgColour="pop-pink" textColour="white">
                Register for Semester 2!
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row justify-center bg-green-50 lg:top-12 relative gap-1 px-5">
          <div className="w-2/3 pr-20 text-lg lg:text-2xl font-semibold flex justify-center flex-col">
            <p>
              {`Looking to collaborate with like-minded individuals? Our new semester long Make-A-Thon is the perfect place to get those creative juices going!`}
              <br />
              <br />
              {`Join us for Launch Night on DATE HERE, where we decide our theme for this semester.`}
            </p>
            <div className="pt-3 lg:pt-5">
              <Button onClick={() => {}} bgColour="pop-pink" textColour="white">
                Register for Semester 2!
              </Button>
            </div>
          </div>
          <Polaroid src={art} onClick={undefined} description="hi">
            <Image
              src={"screentone.svg"}
              fill
              alt=""
              className="[filter:brightness(0)_saturate(100%)_invert(43%)_sepia(92%)_saturate(3035%)_hue-rotate(320deg)_brightness(102%)_contrast(103%)]
                opacity-15 absolute scale-150 object-cover"
            />
          </Polaroid>
        </div>
      )}
    </div>
  );
}
