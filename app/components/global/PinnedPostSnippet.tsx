import { Event } from "@/lib/ghost/events";
import { twMerge } from "tailwind-merge";

interface PinnedPostSnippetProps {
  upcomingEvent: Event;
  children?: React.ReactNode;
  pinned?: boolean;
  typeOverride?: string;
}

export default async function PinnedPostSnippet({
  upcomingEvent,
  children,
  pinned,
  typeOverride,
}: PinnedPostSnippetProps) {
  return (
    <div
      className={twMerge(
        "p-5 min-h-52 bg-white justify-center outline-black relative w-full outline-3 lg:items-center",
        typeOverride,
      )}
    >
      {pinned !== true ? (
        <>
          <div className="absolute w-15 h-5 bg-pop-blue -right-5 -bottom-1 -rotate-[25deg] outline-2"></div>
          <div className="absolute w-15 h-5 bg-pop-magenta -top-1 -left-5 -rotate-[18deg] outline-2"></div>
        </>
      ) : (
        ""
      )}
      <div className="flex flex-col justify-center h-full px-1 sm:px-5">
        <p className="text-md font-medium">{upcomingEvent.date}</p>
        <p
          className="[letter-spacing:0.01em] text-white font-bold text-xl sm:text-2xl md:text-4xl font-holt
          text-shadow-lg [-webkit-text-stroke:3px_black] md:[-webkit-text-stroke:6px_black] [paint-order:stroke_fill] [overflow-wrap:anywhere]"
        >
          {upcomingEvent.title}
        </p>
        <p className="text-base sm:text-lg font-semibold">{upcomingEvent.excerpt}</p>
        {children}
      </div>
    </div>
  );
}
