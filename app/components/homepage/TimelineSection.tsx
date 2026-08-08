import { TimelineType } from "@/lib/ghost/timeline";
import TimelineItem from "./TimelineItem";

interface TimelineSectionProps {
  timelines: TimelineType[];
}

export default function TimelineSection({ timelines }: TimelineSectionProps) {
  return (
    <div className="outline-3 flex flex-col relative pt-5 md:pt-10 bg-grad">
      <div
        style={{
          gridTemplateRows: `repeat(${timelines.length}, minmax(0, 1fr))`,
        }}
        className="relative z-10 grid grid-cols-1 gap-y-6 mx-5 pb-10 md:mx-0 md:grid-cols-2 md:gap-y-0 md:gap-x-36 md:min-w-36 md:justify-center md:pt-5"
      >
        {timelines.map((timeline, index) => {
          return (
            <TimelineItem
              index={index + 1}
              key={timeline.date}
              name={timeline.name}
              date={timeline.date}
              description={timeline.description}
            />
          );
        })}
        {/* The rail only makes sense against the two-column, alternating
            desktop layout. On a single-column phone it ran straight down the
            middle of every card. */}
        <div className="hidden md:block z-5 absolute left-1/2 h-full w-1 rounded-full -translate-x-1/2 bg-black overflow-visible" />
        <div className="hidden md:flex z-5 absolute left-1/2 h-full w-2 -translate-x-1/2 overflow-visible flex-col items-center">
          <div className="self-start top-1/3 overflow-visible sticky rounded-full h-2 w-2 outline-3 bg-pop-pink" />
        </div>
      </div>
      <div className="z-10 px-5 pt-12 pb-10 md:pt-20 flex w-full items-center justify-center text-xl md:text-2xl text-white font-holt text-center">
        <p>And many more to come!</p>
      </div>
    </div>
  );
}
