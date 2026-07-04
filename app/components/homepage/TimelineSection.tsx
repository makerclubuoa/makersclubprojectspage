import { getYearTimeline, TimelineType } from "@/lib/ghost/timeline";
import TimelineItem from "./TimelineItem";
export default async function TimelineSection() {
  const timelines: TimelineType[] = await getYearTimeline();
  return (
    <div className="flex flex-col justify-center pt-10 md:pt-24 lg:pt-32">
      <div
        className={`grid grid-cols-2 grid-rows-${timelines.length} min-w-36 bg-red-50 gap-x-36`}
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
      </div>
      <div>And many more to come!</div>
    </div>
  );
}
