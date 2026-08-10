import { TimelineType } from "@/lib/ghost/timeline";

interface TimelineItemProps extends TimelineType {
  index: number;
}

export default function TimelineItem({
  name,
  date,
  description,
  index,
}: TimelineItemProps) {
  const side =
    index % 2 === 0
      ? "md:col-start-2 md:pr-5 md:justify-self-start"
      : "md:col-start-1 md:pl-5 md:justify-self-end";

  return (
    <div
      style={{ gridRowStart: index }}
      className={`justify-self-center ${side} z-10 w-full max-w-md mt-20`}
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
