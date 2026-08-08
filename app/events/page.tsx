import getLatestUpcomingEvent from "@/lib/ghost/events";
import Image from "next/image";
import placeholder from "@/public/placeholder.png";
import solderingIron from "@/public/doodle-soldering-iron.png";
import PinnedPostSnippet from "../components/global/PinnedPostSnippet";
import Photo from "../components/global/Photo";
import PastEventsSection from "../components/events/PastEventsSection";
import TimelineSection from "../components/homepage/TimelineSection";
import Screentone from "../components/global/Screentone";
import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import LinkButton from "../components/global/LinkButton";
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
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function Events() {
  const upcomingEvent = await getLatestUpcomingEvent();
  const timelines: TimelineType[] = await getYearTimeline();

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
          <div className="mt-6 flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:gap-10">
            <Photo
              src={upcomingEvent.src ?? placeholder}
              alt=""
              rotation={2.3}
              link={`/events/${upcomingEvent.slug}`}
            />
            <PinnedPostSnippet
              upcomingEvent={upcomingEvent}
              pinned={true}
              typeOverride="shadow-[6px_6px_0px_0px_#000]"
            >
              <div className="mt-4 flex w-full justify-center md:justify-end-safe">
                <LinkButton
                  link={`/events/${upcomingEvent.slug}`}
                  bgColour="pop-violet"
                  textColour="white"
                  typeOverride="text-md md:text-md lg:text-md"
                >
                  Learn More!
                </LinkButton>
              </div>
            </PinnedPostSnippet>
          </div>
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

        <div className="bg-white min-h-[50dvh]">
          <JoinSection />
        </div>
        <Footer />
      </div>
    </div>
  );
}
