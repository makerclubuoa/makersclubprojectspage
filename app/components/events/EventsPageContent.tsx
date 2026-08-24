"use client";

import { useEffect, useState } from "react";
import placeholder from "@/public/placeholder.png";
import type { Event } from "@/lib/ghost/events";
import type { TimelineType } from "@/lib/ghost/timeline";
import {
  getPublicLatestUpcomingEvent,
  getPublicPastEvents,
  type PublicEventPage,
} from "@/lib/ghost-public-client";
import { getPublicTimelineItems } from "@/lib/timeline-public";
import PinnedPostSnippet from "../global/PinnedPostSnippet";
import Photo from "../global/Photo";
import PastEventsSection from "./PastEventsSection";
import TimelineSection from "../homepage/TimelineSection";
import LinkButton from "../global/LinkButton";
import JoinSection from "../homepage/JoinSection";
import Footer from "../Footer";

function eventLink(event: Event): string {
  return `/events/view?slug=${encodeURIComponent(event.slug)}`;
}

export default function EventsPageContent({
  initialUpcomingEvent,
  initialPastEvents,
  initialTimelines,
}: {
  initialUpcomingEvent: Event | null;
  initialPastEvents: PublicEventPage;
  initialTimelines: TimelineType[];
}) {
  const [upcomingEvent, setUpcomingEvent] = useState(initialUpcomingEvent);
  const [pastEvents, setPastEvents] = useState(initialPastEvents);
  const [timelines, setTimelines] = useState(initialTimelines);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      getPublicLatestUpcomingEvent().then(
        (event) => active && setUpcomingEvent(event),
      ),
      getPublicPastEvents().then((page) => active && setPastEvents(page)),
      getPublicTimelineItems().then((items) => active && setTimelines(items)),
    ]);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-purple-grad min-h-dvh">
      <div className="pt-20">
        <div className="flex-col border-y-4 bg-white min-h-36 flex jusitfy-center py-10 px-5 md:px-10">
          <p
            className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-purple-300"
          >
            Events
          </p>
          <p className="text-md md:text-lg font-semibold">
            {`Stay up to date with the Maker Club. 

          These posts went out as emails to our members and are archived here in case you need to see what we've been up to!`}
          </p>
        </div>
        <div>
          <div className="pt-5 flex justify-center">
            <div className="w-full items-center lg:items-stretch lg:w-3/4 px-20 lg:px-5 pt-1 md:pt-3 lg:pt-10 flex flex-col lg:flex-row gap-10">
              <Photo
                src={upcomingEvent?.src ?? placeholder}
                alt=""
                rotation={2.3}
                link={upcomingEvent ? eventLink(upcomingEvent) : undefined}
              />
              <PinnedPostSnippet upcomingEvent={upcomingEvent} pinned={true}>
                {upcomingEvent && (
                  <div className="flex w-full justify-center md:justify-end-safe mt-4">
                    <LinkButton
                      link={eventLink(upcomingEvent)}
                      typeOverride="text-md md:text-md lg:text-md"
                    >
                      Sign Me Up!
                    </LinkButton>
                  </div>
                )}
              </PinnedPostSnippet>
            </div>
          </div>
        </div>
      </div>
      <p
        className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white p-10"
      >
        Past Events
      </p>
      <PastEventsSection initialPage={pastEvents} />
      <div className="mt-10">
        <div className="flex-col border-y-4 bg-white min-h-36 flex jusitfy-center py-10 px-5 md:px-10">
          <p
            className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-purple-300"
          >
            Future Events Timeline
          </p>
        </div>
        <TimelineSection timelines={timelines} />
      </div>
      <div className="bg-white h-[50dvh]">
        <JoinSection />
      </div>
      <Footer />
    </div>
  );
}
