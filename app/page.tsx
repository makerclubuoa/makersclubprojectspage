import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import Header from "./components/homepage/Header";
import MakeathonSection from "./components/homepage/MakeathonSection";
import MovingText from "./components/homepage/MovingText";
import Splash from "./components/homepage/Splash";
import TimelineSection from "./components/homepage/TimelineSection";
import VendingMachineSection from "./components/homepage/VendingMachineSection";
import ProjectsPreviewSection from "./components/homepage/ProjectsPreviewSection";
import { getMakeathon } from "@/lib/ghost/makeathon";
import { fetchProjects } from "@/lib/projects";
import JoinSection from "./components/homepage/JoinSection";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import WhatsNewSection from "./components/homepage/WhatsNewSection";
import { getPhotos } from "@/lib/ghost/photos";
import getLatestUpcomingEvent from "@/lib/ghost/events";
import WhatsNewSection from "./components/homepage/WhatsNewSection";
import { getPhotos } from "@/lib/ghost/photos";
import getLatestUpcomingEvent from "@/lib/ghost/events";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

export default async function Home() {
  const timelines: TimelineType[] = await getYearTimeline();
  const makeathon = await getMakeathon();
  const photos = await getPhotos();
  const upcomingEvent = await getLatestUpcomingEvent();

  const projects = await fetchProjects();
  const previewProjects = [...projects].sort(
    (a, b) => Number(b.Featured) - Number(a.Featured)
  );
  const photos = await getPhotos();
  const upcomingEvent = await getLatestUpcomingEvent();

  return (
    <div className="overflow-visible">
      <Nav />
      <Splash />
      <div className="relative -top-10 lg:-top-7 z-10 pb-1.5">
        <MovingText />
      </div>
      <WhatsNewSection upcomingEvent={upcomingEvent} photos={photos} />
      <MakeathonSection makeathon={makeathon} />
      <Header
        text="Semester 2. Fully loaded."
        rotation={0}
        typeOverride="z-20 relative top-22 md:top-45 lg:top-31 h-20 pl-5 md:pl-10 xl:top-30 xl:p-15"
        bgColour="pop-violet"
        colour="white"
      />
      <TimelineSection timelines={timelines} />
      <ProjectsPreviewSection projects={previewProjects} />
      <div className="mt-20 md:mt-40 lg:mt-26">
        <TimelineSection timelines={timelines} />
      </div>
      <div className="mt-20 md:mt-40 lg:mt-26">
        <TimelineSection timelines={timelines} />
      </div>
      <ProjectsPreviewSection projects={previewProjects} />
      <VendingMachineSection />
      <div className="h-dvh">
        <JoinSection />
      </div>
       <Footer />

    </div>
  );
}
