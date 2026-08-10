import { TimelineType } from "@/lib/ghost/timeline";
import TimelineItem from "./TimelineItem";

interface TimelineSectionProps {
  timelines: TimelineType[];
}

export default function TimelineSection({ timelines }: TimelineSectionProps) {
  return (
    <div className="outline-3 flex flex-col relative pt-5 md:pt-10 bg-grad h-[120%] md:h-full">
      <div
        style={{
          gridTemplateRows: `repeat(${timelines.length}, minmax(0, 1fr))`,
        }}
        className="relative grid grid-cols-1 gap-y-10 mx-10 pb-10 md:z-10 md:grid-cols-2 md:gap-y-0 md:mx-0 md:min-w-36 md:gap-x-36 md:justify-center md:pt-5 md:pb-0"
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
        <div className="z-5 absolute left-1/2 h-full w-1 rounded-full -translate-x-1/2 bg-black overflow-visible"></div>
        <div className="z-5 absolute left-1/2 h-full w-2 -translate-x-1/2 overflow-visible flex flex-col items-center">
          <div className="self-start top-1/3 overflow-visible sticky rounded-full h-2 w-2 outline-3 bg-pop-pink"></div>
        </div>
      </div>
      <div className="z-10 pt-20 pb-10 flex w-full items-center justify-center text-2xl text-white font-holt text-center">
        <p>And many more to come!</p>
      </div>
    </div>
  );
}
