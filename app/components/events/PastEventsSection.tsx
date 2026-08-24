"use client";
import type { Event } from "@/lib/ghost/events";
import { useEffect, useState } from "react";
import EventSlide from "./EventSlide";
import Button from "../global/Button";
import placeholder from "@/public/placeholder.png";
import {
  getPublicPastEvents,
  type PublicEventPage,
} from "@/lib/ghost-public-client";

export default function PastEventsSection({ initialPage }: { initialPage: PublicEventPage }) {
  const [pastEvents, setPastEvents] = useState<Event[]>(initialPage.pastEvents);
  const [page, setPage] = useState<number>(2);
  const [hasMore, setHasMore] = useState<boolean>(initialPage.hasMore);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPastEvents(initialPage.pastEvents);
    setPage(2);
    setHasMore(initialPage.hasMore);
  }, [initialPage]);

  async function loadMoreEvents() {
    if (loading) return;
    setLoading(true);
    try {
      const nextPage = await getPublicPastEvents(page);
      setPastEvents(current => [...current, ...nextPage.pastEvents]);
      setHasMore(nextPage.hasMore);
      setPage(current => current + 1);
    } finally {
      setLoading(false);
    }
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
            {loading ? "Loading…" : "Load More"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
