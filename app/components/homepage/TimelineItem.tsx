"use client";
import { TimelineType } from "@/lib/ghost/timeline";
import useScreenSize from "@/app/hooks/useScreenSize";

interface TimelineItemProps extends TimelineType {
  index: number;
}

export default function TimelineItem({
  name,
  date,
  description,
  index,
}: TimelineItemProps) {
  const screenWidth = useScreenSize();
  return (
    <div
      style={{ gridRowStart: index }}
      className={`${index % 2 === 0 ? `col-start-2 pr-5 justify-self-start` : `col-start-1 pl-5 justify-self-end`} w-full max-w-md`}
    >
      <div className="outline-3 bg-white min-h-32 max-h-full py-5 flex items-center px-3 shadow-[5px_5px_0px_0px_#000]">
        <div className="font-sans">
          <p className="text-sm ">{date}</p>
          <p className="font-holt text-wrap text-xl">{name}</p>
          <p className="text-md font-semibold text-wrap">{description}</p>
        </div>
      </div>
    </div>
  );
}
