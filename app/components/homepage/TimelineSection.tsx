import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import TimelineItem from "./TimelineItem";
import TimelineLine from "./TimelineLine";
export default async function TimelineSection() {
  const timelines: TimelineType[] = await getYearTimeline();
  return (
    <div className="flex flex-col relative justify-center pt-10 md:pt-24 lg:pt-32">
      {/* <div className="absolute left-1/2 top-10 md:top-24 lg:top-32 h-full w-1 rounded-full -translate-x-1/2 bg-black"></div> */}
      <div
        style={{
          gridTemplateRows: `repeat(${timelines.length}, minmax(0, 1fr))`,
        }}
        className={`justify-center grid grid-cols-2 min-w-36 gap-x-36 pt-10 relative -z-10`}
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
        <div className="absolute -bottom-14 md:-bottom-28 lg:-bottom-36">
          And many more to come!
        </div>
      </div>
    </div>
  );
}
