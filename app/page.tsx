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
import { getPhotos } from "@/lib/ghost/photos";
import getLatestUpcomingEvent from "@/lib/ghost/events";
import WhatsNewSection from "./components/homepage/WhatsNewSection";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import LinkButton from "./components/global/LinkButton";
import Image from "next/image";
import { getRandomProduct } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function Home() {
  const timelines: TimelineType[] = await getYearTimeline();
  const makeathon = await getMakeathon();
  const photos = await getPhotos();
  const upcomingEvent = await getLatestUpcomingEvent();
  const randomProduct = await getRandomProduct();
  const projects = await fetchProjects();
  const previewProjects = [...projects].sort(
    (a, b) => Number(b.Featured) - Number(a.Featured),
  );

  return (
    <div className="">
      <Nav />
      <Splash />
      <div className="relative -top-10 lg:-top-7 z-10 pb-1.5">
        <MovingText />
      </div>
      <WhatsNewSection upcomingEvent={upcomingEvent} photos={photos} />
      <div className="w-full flex items-center justify-center pb-5">
        <LinkButton link={`events/`} bgColour="pop-pink" textColour="white">
          See More Events
        </LinkButton>
      </div>

      <MakeathonSection makeathon={makeathon} />
      <Header
        text="Semester 2. Fully loaded."
        rotation={0}
        typeOverride="z-20 relative top-22 md:top-30 lg:top-31 h-20 pl-5 md:pl-10 xl:top-30 xl:p-15 overflow-x-hidden"
        bgColour="pop-violet"
        colour="white"
      />
      <div className="mt-20 md:mt-30 lg:mt-26 ">
        <TimelineSection timelines={timelines} />
      </div>
      <div className="z-50">
        <Header
          text="Things We've Made"
          rotation={1}
          typeOverride="-top-3 z-20 xl:p-15 relative h-20 pl-5 overflow-x-hidden"
          bgColour="pop-blue"
          colour="white"
        />
        <ProjectsPreviewSection projects={previewProjects} />
      </div>
      <VendingMachineSection product={randomProduct} />
      <div className="h-dvh">
        <JoinSection />
      </div>
      <Footer />
    </div>
  );
}
