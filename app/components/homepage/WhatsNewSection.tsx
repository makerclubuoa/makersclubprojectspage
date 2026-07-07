import PinnedEvent from "../events/PinnedEvent";
import { PhotoProps } from "../global/Photo";
import PhotoCarousel from "../global/PhotoCarousel";
import Header from "./Header";

const photos: PhotoProps[] = [
  {
    src: "" as any,
    alt: "Photo 1",
  },
  {
    src: "" as any,
    alt: "Photo 2",
    rotation: -4,
  },
  {
    src: "" as any,
    alt: "Photo 3",
    rotation: 6,
  },
  {
    src: "" as any,
    alt: "Photo 4",
    rotation: -2,
  },
  {
    src: "" as any,
    alt: "Photo 5",
  },
  {
    src: "" as any,
    alt: "Photo 6",
    rotation: 3,
  },
];

export default function WhatsNewSection() {
  return (
    <>
      <Header
        text="What's New?"
        rotation={-1.5}
        typeOverride="relative -top-10 lg:-top-3 h-20 pl-5 md:pl-10"
        bgColour="pop-pink"
        colour="white"
      />
      <PinnedEvent
        name={"name"}
        date={"date"}
        excerpt="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
      />
      <PhotoCarousel props={photos} />
    </>
  );
}
