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
        typeOverride="relative top-5 lg:top-12 pl-5 md:pl-10"
        bgColour="pop-red"
        colour="white"
      />

      {/* Single CSS-responsive layout — the previous version branched on a
          useScreenSize() hook that reads 0 until after mount, so desktop
          rendered the mobile arrangement on first paint. */}
      <div className="flex flex-col items-center gap-10 px-5 pt-10 md:flex-row md:items-start md:justify-center md:gap-6 lg:top-12 lg:relative">
        <div className="order-first md:order-last md:shrink-0">
          <Polaroid
            src={makeathon.image}
            onClick={undefined}
            description={makeathon.date}
          >
            <Screentone />
          </Polaroid>
        </div>

        <div className="w-full md:w-2/3 md:pr-10 lg:pr-20 text-lg lg:text-2xl font-semibold flex flex-col justify-center">
          {formatParagraph(makeathon.description)}
        </div>
      </div>
    </div>
  );
}
