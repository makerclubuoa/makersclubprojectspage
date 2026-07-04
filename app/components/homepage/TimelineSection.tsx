import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import TimelineItem from "./TimelineItem";
import TimelineLine from "./TimelineLine";
import TimelineDot from "./TimelineDot";

export default async function TimelineSection() {
  const timelines: TimelineType[] = await getYearTimeline();
  return (
    <div className="flex flex-col relative pt-5 mt-20 md:mt-40 lg:mt-26 md:pt-10 bg-grad h-full">
      <div
        style={{
          gridTemplateRows: `repeat(${timelines.length}, minmax(0, 1fr))`,
        }}
        className={`justify-center pt-5 grid grid-cols-2 min-w-36 gap-x-36 relative z-10`}
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
        <div className="z-10 absolute left-1/2 h-[100%] w-1 rounded-full -translate-x-1/2 bg-black overflow-visible"></div>
        <div className="z-10 absolute left-1/2 h-[130%] w-2 -translate-x-1/2 overflow-visible flex flex-col items-center ">
          <div className="self-start top-1/3 overflow-visible sticky rounded-full h-2 w-2 outline-3 bg-pop-pink"></div>
        </div>
      </div>
      <div className="pt-20 pb-10 flex w-full items-center justify-center text-2xl text-white font-holt">
        <p>And many more to come!</p>
      </div>
    </div>
  );
}
