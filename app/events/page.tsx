import getLatestUpcomingEvent, { getPastEvents } from "@/lib/ghost/events";
import type { TimelineType } from "@/lib/ghost/timeline";
import { getTimelineItems } from "@/lib/timeline";
import EventsPageContent from "../components/events/EventsPageContent";

export const dynamic = "force-static";

export default async function Events() {
  const [upcomingEvent, initialPastEvents, timelines] = await Promise.all([
    getLatestUpcomingEvent(),
    getPastEvents(),
    getTimelineItems() as Promise<TimelineType[]>,
  ]);
  return (
    <EventsPageContent
      initialUpcomingEvent={upcomingEvent}
      initialPastEvents={initialPastEvents}
      initialTimelines={timelines}
    />
  );
}
