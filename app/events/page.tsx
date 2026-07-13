import getLatestUpcomingEvent, { getPastEvents } from "@/lib/ghost/events";
import art from "@/public/maker-club-art-colour.png";
import PinnedPostSnippet from "../components/global/PinnedPostSnippet";
import Photo from "../components/global/Photo";
import EventSlide from "../components/events/EventSlide";
import PastEventsSection from "../components/events/PastEventsSection";

export default async function Events() {
  const upcomingEvent = await getLatestUpcomingEvent();
  const pastEvents = await getPastEvents();
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
              <Photo src={upcomingEvent.src ?? art} alt="" rotation={2.3} />
              <PinnedPostSnippet upcomingEvent={upcomingEvent} pinned={true}>
                <div className="flex w-full justify-end-safe">
                  button location
                </div>
              </PinnedPostSnippet>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 flex-col border-y-4 bg-white min-h-36 flex justify-center px-5">
        <p
          className="font-bold text-4xl md:text-5xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill] text-purple-300"
        >
          Past Events
        </p>
      </div>
      <PastEventsSection />
    </div>
  );
}
