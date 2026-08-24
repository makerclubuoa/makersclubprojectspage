import { Suspense } from "react";
import type { TimelineType } from "@/lib/ghost/timeline";
import { getTimelineItems } from "@/lib/timeline";
import EventDetailContent from "@/app/components/events/EventDetailContent";

export const dynamic = "force-static";

export const metadata = {
  title: "Event | Maker Club",
  icons: { icon: "/logoNew.png" },
};

export default async function EventViewPage() {
  const timelines = (await getTimelineItems()) as TimelineType[];
  return (
    <Suspense fallback={null}>
      <EventDetailContent initialTimelines={timelines} />
    </Suspense>
  );
}
