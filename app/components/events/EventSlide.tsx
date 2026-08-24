import { StaticImageData } from "next/image";
import Photo from "../global/Photo";
import Polaroid from "../global/Polaroid";

interface EventSlideProps {
  title: string;
  src: string | StaticImageData;
  excerpt?: string;
  slug?: string;
}
export default function EventSlide({
  title,
  src,
  excerpt,
  slug,
}: EventSlideProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <Polaroid
        link={`/events/view?slug=${encodeURIComponent(slug ?? "")}`}
        src={src}
        description={title}
        typeOverride="md:w-full"
      />
    </div>
  );
}
