"use client";
import { getPastEvents, type Event } from "@/lib/ghost/events";
import { useEffect, useState } from "react";
import EventSlide from "./EventSlide";
import Button from "../global/Button";

export default function PastEventsSection() {
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [skip, setSkip] = useState<number>(12);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    loadMoreEvents(true);
  }, []);

  function loadMoreEvents(firstPage: boolean = false) {
    (async () => {
      console.log(skip);
      console.log(page);
      const { pastEvents: newPastEvents, skip: newSkip } = await getPastEvents(
        skip,
        page,
        firstPage,
      );
      setPastEvents([...pastEvents, ...newPastEvents]);
      setSkip(newSkip);
      setPage(2);
    })();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center items-center pt-5 w-full">
        <div className="w-full xl:w-3/4 xl:max-w-[100rem] grid md:grid-cols-2 2xl:grid-cols-3 gap-5">
          {pastEvents.map((event, index) => {
            console.log(event.slug);
            return (
              <EventSlide
                src={event.src ?? ""}
                title={event.title}
                slug={event.slug}
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
