"use client";
import Button from "../components/global/Button";
import Polaroid from "../components/global/Polaroid";
import Header from "../components/homepage/Header";
import MakeathonSection from "../components/homepage/MakeathonSection";
import MovingText from "../components/homepage/MovingText";
import Splash from "../components/homepage/Splash";

import art from "@/public/maker-club-art.png";

export default function Test() {
  return (
    <div className="overflow-x-hidden">
      <Splash />
      <div className="relative -top-10 lg:-top-7 z-10 pb-1.5">
        <MovingText />
      </div>
      <Header
        text="What's New?"
        rotation={-1.5}
        typeOverride="relative -top-10 lg:-top-3 h-20 pl-5 md:pl-10"
        bgColour="pop-pink"
        colour="white"
      />
      <MakeathonSection />
    </div>
  );
}
