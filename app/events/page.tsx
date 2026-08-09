import { getUpcomingEvents } from "@/lib/ghost/events";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import solderingIron from "@/public/doodle-soldering-iron.png";
import EventSlide from "../components/events/EventSlide";
import PastEventsSection from "../components/events/PastEventsSection";
import TimelineSection from "../components/homepage/TimelineSection";
import Screentone from "../components/global/Screentone";
import { type TimelineType } from "@/lib/ghost/timeline";
import { getTimelineItems } from "@/lib/timeline";
import JoinSection from "../components/homepage/JoinSection";
import Footer from "../components/Footer";
import {
  container,
  pageBand,
  pageBandTitle,
  pageBandSub,
  pageBandDoodle,
  secHeadRow,
  secHead,
  secHint,
  emptyState,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function Events() {
  const upcomingEvents = await getUpcomingEvents();
  // Same source as the homepage: the Supabase Timeline table, which is what
  // the admin panel edits. Previously this scraped a Ghost roadmap post, so
  // the two timelines could drift apart.
  const timelines: TimelineType[] = await getTimelineItems();

  return (
    <div className="bg-purple-grad min-h-dvh">
      <div className="pt-20">
        <div className={pageBand}>
          <Screentone />
          <p className={`${pageBandTitle} text-purple-300`}>Events</p>
          <p className={`${pageBandSub} max-w-[75ch]`}>
            {`Stay up to date with the Maker Club. These posts went out as emails to
            our members and are archived here in case you need to see what we've
            been up to!`}
          </p>
          <Image src={solderingIron} alt="" className={pageBandDoodle} />
        </div>

        <section className={`${container} py-12 max-[640px]:py-9`}>
          <div className={secHeadRow}>
            <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
              Next Up
            </h2>
            <span className={`${secHint} text-white/90`}>
              Register before the spots go
            </span>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event, index) => (
                <EventSlide
                  key={event.slug}
                  src={event.src ?? placeholder}
                  title={event.title}
                  excerpt={event.excerpt}
                  slug={event.slug}
                  date={event.date}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className={`mt-6 ${emptyState}`}>
              Nothing scheduled right now, check back soon!
            </div>
          )}
        </section>

        <section className={`${container} pb-14 max-[640px]:pb-10`}>
          <div className={`${secHeadRow} mb-6`}>
            <h2 className={`${secHead} text-white text-2xl md:text-3xl`}>
              Past Events
            </h2>
            <span className={`${secHint} text-white/90`}>
              The archive, newest first
            </span>
          </div>
          <PastEventsSection />
        </section>

        <div className={pageBand}>
          <Screentone />
          <p className={`${pageBandTitle} text-purple-300`}>
            Future Events Timeline
          </p>
          <p className={pageBandSub}>
            What&apos;s already locked in for the rest of the year.
          </p>
        </div>
        <TimelineSection timelines={timelines} />

        <div className="bg-white h-[50dvh] min-h-[340px]">
          <JoinSection />
        </div>
        <Footer />
      </div>
    </div>
  );
}
