"use client";

import { useEffect, useState } from "react";
import type { TimelineType } from "@/lib/ghost/timeline";
import type { MakeathonType } from "@/lib/ghost/makeathon";
import type { PhotosType } from "@/lib/ghost/photos";
import type { Event } from "@/lib/ghost/events";
import type { IGetRandomProductRes } from "@/lib/stripe";
import { fetchProjects, type Project } from "@/lib/projects";
import { getPublicLatestUpcomingEvent } from "@/lib/ghost-public-client";
import { getPublicTimelineItems } from "@/lib/timeline-public";
import Header from "./Header";
import MakeathonSection from "./MakeathonSection";
import MovingText from "./MovingText";
import Splash from "./Splash";
import TimelineSection from "./TimelineSection";
import VendingMachineSection from "./VendingMachineSection";
import ProjectsPreviewSection from "./ProjectsPreviewSection";
import JoinSection from "./JoinSection";
import WhatsNewSection from "./WhatsNewSection";
import Nav from "../Nav";
import Footer from "../Footer";
import LinkButton from "../global/LinkButton";

export default function HomePageContent({
  initialTimelines,
  makeathon,
  photos,
  initialUpcomingEvent,
  randomProduct,
  initialProjects,
}: {
  initialTimelines: TimelineType[];
  makeathon: MakeathonType;
  photos: PhotosType[];
  initialUpcomingEvent: Event | null;
  randomProduct: IGetRandomProductRes;
  initialProjects: Project[];
}) {
  const [timelines, setTimelines] = useState(initialTimelines);
  const [upcomingEvent, setUpcomingEvent] = useState(initialUpcomingEvent);
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      getPublicTimelineItems().then((items) => active && setTimelines(items)),
      getPublicLatestUpcomingEvent().then(
        (event) => active && setUpcomingEvent(event),
      ),
      fetchProjects().then((items) => active && setProjects(items)),
    ]);
    return () => {
      active = false;
    };
  }, []);

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
      <div className="h-dvh min-h-[340px]">
        <JoinSection />
      </div>
      <Footer />
    </div>
  );
}
