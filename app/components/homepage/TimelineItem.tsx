import { TimelineType } from "@/lib/ghost/timeline";

interface TimelineItemProps extends TimelineType {
  index: number;
}

export default async function TimelineItem({
  name,
  date,
  description,
  index,
}: TimelineItemProps) {
  return (
    <div
      style={{ gridRowStart: index }}
      className={`${index % 2 === 0 ? `col-start-2 pr-5 justify-self-start` : `col-start-1 pl-5 justify-self-end`} w-full max-w-md`}
    >
      <div className="outline-3 bg-white min-h-32 flex items-center px-3 shadow-[5px_5px_0px_0px_#000]">
        <div className="font-sans">
          <p>{date}</p>
          <p className="font-holt">{name}</p>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}
