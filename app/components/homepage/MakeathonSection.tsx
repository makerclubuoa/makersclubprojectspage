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
  return (
    <div className="">
      <Header
        text={makeathon.title}
        rotation={1.54}
        typeOverride="relative top-5 lg:top-12 h-20 pl-5 md:pl-10"
        bgColour="pop-red"
        colour="white"
      />
      <div className="pt-10 flex flex-col items-center gap-1 px-5 md:flex-row md:justify-center lg:top-12 md:relative">
        <div className="order-1 md:order-2">
          <Polaroid
            src={makeathon.image}
            onClick={undefined}
            description={makeathon.date}
          >
            <div className="hidden md:block">
              <Screentone />
            </div>
          </Polaroid>
        </div>
        <div className="order-2 md:order-1 pt-24 md:pt-0 w-2/3 pr-5 md:pr-20 lg:pr-20 text-lg lg:text-2xl font-bold md:font-semibold flex justify-center flex-col">
          {formatParagraph(makeathon.description)}
        </div>
      </div>
    </div>
  );
}
