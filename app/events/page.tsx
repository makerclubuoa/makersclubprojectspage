import { getPastEvents, getUpcomingEvents } from "@/lib/ghost/events";
import type { TimelineType } from "@/lib/ghost/timeline";
import { getTimelineItems } from "@/lib/timeline";
import EventsPageContent from "../components/events/EventsPageContent";

export const dynamic = "force-static";

export default async function Events() {
  const [upcomingEvents, initialPastEvents, timelines] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
    getTimelineItems() as Promise<TimelineType[]>,
  ]);
  return (
    <EventsPageContent
      initialUpcomingEvents={upcomingEvents}
      initialPastEvents={initialPastEvents}
      initialTimelines={timelines}
    />
  );
}
