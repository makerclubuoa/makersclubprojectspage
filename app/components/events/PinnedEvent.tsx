import EventType from "@/app/types/Event";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Photo from "../global/Photo";

export default function PinnedEvent({
  name,
  date,
  excerpt,
  description,
  src,
  link,
}: EventType) {
  return (
    <div className="w-full p-5 pb-10 flex justify-center">
      <div className="flex min-h-72 items-center w-full lg:w-4/5">
        <Photo
          src={src}
          typeOverride={"m-5"}
          alt={`Photo of ${name} event.`}
          rotation={1.2}
        />
        <div className="min-h-56 max-h-72 m-5 grow rotate-[-1.2deg] outline-3 relative flex items-center">
          <div className="absolute top-0 -left-5 rotate-[-35deg] h-6 w-16 bg-pop-violet"></div>
          <div className="w-full h-full flex justify-center flex-col px-12 py-10">
            <p className="-mb-1.5 font-semibold">{date}</p>
            <p
              className="font-bold text-3xl md:text-4xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white"
            >
              {name}
            </p>
            <p className="text-sm md:text-md font-semibold">{excerpt}</p>
          </div>

          <div className="absolute -right-5 bottom-0 rotate-[-35deg] h-6 w-16 bg-pop-violet"></div>
        </div>
      </div>
    </div>
  );
}
