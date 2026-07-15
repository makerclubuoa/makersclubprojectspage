import getLatestUpcomingEvent, { getPastEvents } from "@/lib/ghost/events";
import Header from "../components/homepage/Header";
import art from "@/public/maker-club-art-colour.png";
import PinnedPostSnippet from "../components/global/PinnedPostSnippet";
import Photo from "../components/global/Photo";
import PastEventsSection from "../components/events/PastEventsSection";
import TimelineSection from "../components/homepage/TimelineSection";
import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import LinkButton from "../components/global/LinkButton";
import JoinSection from "../components/homepage/JoinSection";
import Footer from "../components/Footer";

export default async function Events() {
  const upcomingEvent = await getLatestUpcomingEvent();
  const timelines: TimelineType[] = await getYearTimeline();
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
                src={upcomingEvent.src ?? art}
                alt=""
                rotation={2.3}
                link={`events/${upcomingEvent.slug}`}
              />
              <PinnedPostSnippet upcomingEvent={upcomingEvent} pinned={true}>
                <div className="flex w-full justify-end-safe mt-4">
                  <LinkButton
                    link={`events/${upcomingEvent.slug}`}
                    typeOverride="text-md md:text-md lg:text-md"
                  >
                    Sign Me Up!
                  </LinkButton>
                </div>
              </PinnedPostSnippet>
            </div>
          </div>
        </div>
      </div>
      {/* <div className="mt-10 flex-col border-y-4 bg-white min-h-36 flex justify-center px-5 md:px-10"> */}
      {/*   <p className="text-center font-semibold text-2xl"> */}
      {/*     Want a sneak peak at what’s coming? Check out our Semester-long events */}
      {/*     timeline! */}
      {/*   </p> */}
      {/*   <div>Button Placeholder</div> */}
      {/* </div> */}
      <p
        className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-white p-10"
      >
        Past Events
      </p>
      <PastEventsSection />
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
