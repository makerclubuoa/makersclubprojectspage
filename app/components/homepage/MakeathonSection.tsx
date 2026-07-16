"use client";
import useScreenSize from "@/app/hooks/useScreenSize";
import Button from "../global/Button";
import Polaroid from "../global/Polaroid";
import Header from "../homepage/Header";
import Screentone from "../global/Screentone";
import { MakeathonType } from "@/lib/ghost/makeathon";
import formatParagraph from "@/app/utils/formatParagraph";

export default function MakeathonSection({
  makeathon,
}: {
  makeathon: MakeathonType;
}) {
  const screenSize = useScreenSize();

  return (
    <div className="">
      <Header
        text={makeathon.title}
        rotation={1.54}
        typeOverride="relative top-5 lg:top-12 h-20 pl-5 md:pl-10"
        bgColour="pop-red"
        colour="white"
      />
      {screenSize <= 768 ? (
        <div className="pt-10 w-full flex flex-col items-center">
          <Polaroid
            src={makeathon.image}
            onClick={undefined}
            description={makeathon.date}
          >
            <div className="hidden md:visible">
              <Screentone />
            </div>
          </Polaroid>
          <div className="pt-24 w-2/3 pr-5 lg:pr-20 text-lg lg:text-2xl font-bold flex justify-center flex-col">
            {formatParagraph(makeathon.description)}
            {/* <div className="flex justify-center py-3 lg:pt-5"> */}
            {/*   <Button onClick={() => {}} bgColour="pop-pink" textColour="white"> */}
            {/*     Learn More */}
            {/*   </Button> */}
            {/* </div> */}
          </div>
        </div>
      ) : (
        <div className="pt-10 flex flex-row justify-center lg:top-12 relative gap-1 px-5">
          <div className="w-2/3 pr-20 text-lg lg:text-2xl font-semibold flex justify-center flex-col">
            {formatParagraph(makeathon.description)}
            {/* <div className="pt-3 lg:pt-5"> */}
            {/*   <Button onClick={() => {}} bgColour="pop-pink" textColour="white"> */}
            {/*     Register for Semester 2! */}
            {/*   </Button> */}
            {/* </div> */}
          </div>
          <Polaroid
            src={makeathon.image}
            onClick={undefined}
            description={makeathon.date}
          >
            <Screentone />
          </Polaroid>
        </div>
      )}
    </div>
  );
}
