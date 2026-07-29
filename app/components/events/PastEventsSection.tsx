"use client";
import { getPastEvents, type Event } from "@/lib/ghost/events";
import { useEffect, useState } from "react";
import EventSlide from "./EventSlide";
import Button from "../global/Button";
import placeholder from "@/public/placeholder.png";

export default function PastEventsSection() {
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [skip, setSkip] = useState<number>(12);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  useEffect(() => {
    loadMoreEvents(true);
  }, []);

  function loadMoreEvents(firstPage: boolean = false) {
    (async () => {
      const {
        pastEvents: newPastEvents,
        skip: newSkip,
        hasMore: newHasMore,
      } = await getPastEvents(skip, page);
      setPastEvents([...pastEvents, ...newPastEvents]);
      setSkip(newSkip);
      setHasMore(newHasMore);
      setPage(2);
    })();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center items-center pt-5 w-full">
        <div className="w-full xl:w-3/4 xl:max-w-[100rem] grid md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {pastEvents.map((event, index) => {
            return (
              <EventSlide
                src={event.src ?? placeholder}
                title={event.title}
                slug={event.slug}
                key={index}
                excerpt=""
              />
            );
          })}
        </div>
      </div>
      {/* TODO: fix this, hasMore doesnt appear to be working as intended */}
      {hasMore ? (
        <div className="flex justify-center py-3 lg:pt-5">
          <Button onClick={loadMoreEvents} bgColour="white" textColour="black">
            Load More
          </Button>
        </div>
      ) : null}
    </div>
  );
}
