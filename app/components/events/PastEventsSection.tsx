"use client";
import { getPastEvents, type Event } from "@/lib/ghost/events";
import { useEffect, useState } from "react";
import EventSlide from "./EventSlide";
import Button from "../global/Button";

export default function PastEventsSection() {
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);
  const [skip, setSkip] = useState<number>(0);

  useEffect(() => {
    loadMoreEvents();
  }, []);

  function loadMoreEvents() {
    (async () => {
      const { pastEvents: newPastEvents, skip: newSkip } = await getPastEvents(
        page,
        limit,
        skip,
      );
      setPastEvents([...pastEvents, ...newPastEvents]);
      setSkip(newSkip);
      setPage(page + 1);
    })();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center items-center pt-5 w-full">
        <div className="w-full xl:w-3/4 xl:max-w-[100rem] grid md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {pastEvents.map((event, index) => {
            return (
              <EventSlide
                src={event.src ?? ""}
                title={event.title}
                key={index}
                excerpt=""
              />
            );
          })}
        </div>
      </div>
      <div className="flex justify-center py-3 lg:pt-5">
        <Button onClick={loadMoreEvents} bgColour="white" textColour="black">
          Load More
        </Button>
      </div>
    </div>
  );
}
