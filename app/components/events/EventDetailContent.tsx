"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import type { TimelineType } from "@/lib/ghost/timeline";
import {
  getPublicEvent,
  type PublicEventDetail,
} from "@/lib/ghost-public-client";
import { getPublicTimelineItems } from "@/lib/timeline-public";
import TimelineSection from "../homepage/TimelineSection";
import JoinSection from "../homepage/JoinSection";
import Footer from "../Footer";

const LOADING_EVENT: PublicEventDetail = {
  title: "Loading event...",
  slug: "",
  html: "",
  date: "",
  location: "",
  excerpt: "",
};

export default function EventDetailContent({
  initialTimelines,
}: {
  initialTimelines: TimelineType[];
}) {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const [event, setEvent] = useState<PublicEventDetail>(LOADING_EVENT);
  const [timelines, setTimelines] = useState(initialTimelines);

  useEffect(() => {
    let active = true;
    if (slug) {
      void getPublicEvent(slug)
        .then((item) => active && setEvent(item))
        .catch(() =>
          active &&
          setEvent({
            ...LOADING_EVENT,
            title: "Post Not Found",
            html: "No description provided.",
          }),
        );
    }
    void getPublicTimelineItems()
      .then((items) => active && setTimelines(items))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (event.title && event.title !== LOADING_EVENT.title) {
      document.title = `${event.title} | Maker Club`;
    }
  }, [event.title]);

  return (
    <div>
      <div className="h-dvh w-full">
        <div className=" min-h-[30rem] h-1/3 xl:h-1/2 w-full flex flex-col justify-center">
          <div className="w-full min-h-[30rem] h-1/3 xl:h-1/2 absolute border-b-4">
            <Image
              src={event.src ?? placeholder}
              alt="Background."
              fill
              sizes="100vh"
              className="blur-[3.5px] brightness-75 object-cover -z-10"
            />
            <Image
              src={event.src ?? placeholder}
              alt="Background."
              fill
              sizes="100vh"
              className="brightness-75 object-cover -z-20"
            />
          </div>
          <div className=" p-16">
            <p className="font-semibold text-white text-shadow-lg">
              {event.date}
            </p>
            <p className="font-semibold text-white text-shadow-lg">
              {event.location}
            </p>
            <p
              className={`font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white`}
            >
              {event.title}
            </p>
            <p className="max-w-[150rem] font-semibold text-white text-shadow-lg text-md lg:text-lg">
              {event.excerpt}
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div className="py-10 px-20 md:w-3/4">
            <div
              className="ghost-content"
              dangerouslySetInnerHTML={{ __html: event.html }}
            ></div>
          </div>
        </div>
        <div className="mt-10">
          <div className="flex-col border-y-4 min-h-36 flex jusitfy-center bg-pop-pink py-10 px-5 md:px-10">
            <p
              className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white"
            >
              Future Events Timeline
            </p>
          </div>
          <TimelineSection timelines={timelines} />
          <div className="h-[50dvh]">
            <JoinSection />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
