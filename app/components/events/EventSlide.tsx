import Photo from "../global/Photo";
import Polaroid from "../global/Polaroid";

interface EventSlideProps {
  title: string;
  src: string;
  excerpt?: string;
}
export default function EventSlide({ title, src, excerpt }: EventSlideProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <Polaroid src={src} description={title} typeOverride="md:w-full" />
    </div>
  );
}
