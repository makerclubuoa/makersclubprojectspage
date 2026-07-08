import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import Header from "../components/homepage/Header";
import MakeathonSection from "../components/homepage/MakeathonSection";
import MovingText from "../components/homepage/MovingText";
import Splash from "../components/homepage/Splash";
import TimelineSection from "../components/homepage/TimelineSection";
import VendingMachineSection from "../components/homepage/VendingMachineSection";
import { getMakeathon } from "@/lib/ghost/makeathon";
import JoinSection from "../components/homepage/JoinSection";
import WhatsNewSection from "../components/homepage/WhatsNewSection";
import { getPhotos } from "@/lib/ghost/photos";
import getLatestUpcomingEvent from "@/lib/ghost/events";

export default async function Test() {
  const timelines: TimelineType[] = await getYearTimeline();
  const makeathon = await getMakeathon();
  const photos = await getPhotos();
  const upcomingEvent = await getLatestUpcomingEvent();

  return (
    <div className="overflow-visible">
      <Splash />
      <div className="relative -top-10 lg:-top-7 z-10 pb-1.5">
        <MovingText />
      </div>
      <WhatsNewSection upcomingEvent={upcomingEvent} photos={photos} />
      <MakeathonSection makeathon={makeathon} />
      <Header
        text="Semester 2. Fully loaded."
        rotation={1.5}
        typeOverride="z-20 relative top-22 md:top-45 lg:top-31 h-20 pl-5 md:pl-10"
        bgColour="pop-violet"
        colour="white"
      />
      <TimelineSection timelines={timelines} />
      <VendingMachineSection />
      <JoinSection />
    </div>
  );
}
