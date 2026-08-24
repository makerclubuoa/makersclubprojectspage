import type { TimelineType } from "@/lib/ghost/timeline";
import { getTimelineItems } from "@/lib/timeline";
import { getMakeathon } from "@/lib/ghost/makeathon";
import { fetchProjects } from "@/lib/projects";
import { getPhotos } from "@/lib/ghost/photos";
import getLatestUpcomingEvent from "@/lib/ghost/events";
import { getRandomProduct } from "@/lib/stripe";
import HomePageContent from "./components/homepage/HomePageContent";

export const dynamic = "force-static";

export default async function Home() {
  const [timelineResult, makeathonResult, photosResult, eventResult, productResult, projectsResult] =
    await Promise.allSettled([
      getTimelineItems(),
      getMakeathon(),
      getPhotos(),
      getLatestUpcomingEvent(),
      getRandomProduct(),
      fetchProjects(),
    ]);

  const timelines: TimelineType[] =
    timelineResult.status === "fulfilled" ? timelineResult.value : [];
  const makeathon =
    makeathonResult.status === "fulfilled"
      ? makeathonResult.value
      : {
          title: "Join our Make-A-Thon",
          date: "Details coming soon",
          description: ["Make something ambitious with other makers."],
          image: "/placeholder.png",
        };
  const photos = photosResult.status === "fulfilled" ? photosResult.value : [];
  const upcomingEvent =
    eventResult.status === "fulfilled" ? eventResult.value : null;
  const randomProduct =
    productResult.status === "fulfilled"
      ? productResult.value
      : { name: "Maker Club creations", src: "/placeholder.png" };
  const projects =
    projectsResult.status === "fulfilled" ? projectsResult.value : [];

  return (
    <HomePageContent
      initialTimelines={timelines}
      makeathon={makeathon}
      photos={photos}
      initialUpcomingEvent={upcomingEvent}
      randomProduct={randomProduct}
      initialProjects={projects}
    />
  );
}
