import Photo, { tapeMappings } from "../global/Photo";
import Header from "./Header";
import art from "../../../public/maker-club-art-colour.png";
import PinnedPostSnippet from "../global/PinnedPostSnippet";
import PhotoCarousel from "../global/PhotoCarousel";
import { getPhotos, PhotosType } from "@/lib/ghost/photos";
import { Event } from "@/lib/ghost/events";

export default function WhatsNewSection({
  photos,
  upcomingEvent,
}: {
  photos: PhotosType[];
  upcomingEvent: Event | null;
}) {
  return (
    <div className="pb-10">
      <Header
        text="What's New?"
        rotation={-1.5}
        typeOverride="relative -top-10 lg:-top-3 h-20 pl-5 md:pl-10 xl:mb-10"
        bgColour="pop-pink"
        colour="white"
      />
      <div className="flex justify-center">
        <div className="w-full items-center lg:items-stretch lg:w-3/4 px-20 lg:px-5 pt-1 md:pt-3 lg:pt-10 flex flex-col lg:flex-row gap-10">
          {/* TODO: change this to a placeholder photo */}
          <Photo
            link={upcomingEvent ? `events/${upcomingEvent.slug}` : undefined}
            src={upcomingEvent?.src ?? art}
            alt=""
            rotation={2.3}
            tape="popViolet"
          />
          <PinnedPostSnippet upcomingEvent={upcomingEvent} />
        </div>
      </div>
      <div className="pt-8 lg:pt-5">
        <div className="flex justify-center">
          <PhotoCarousel props={photos} />
        </div>
      </div>
    </div>
  );
}
