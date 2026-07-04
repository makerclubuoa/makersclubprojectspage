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
      className={`${index % 2 === 0 ? `col-start-2` : `col-start-1`} outline-3`}
    >
      <p>{date}</p>
      <p>{name}</p>
      <p>{description}</p>
    </div>
  );
}
