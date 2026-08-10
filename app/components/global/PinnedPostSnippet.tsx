import { Event } from "@/lib/ghost/events";

interface PinnedPostSnippetProps {
  upcomingEvent: Event | null;
  children?: React.ReactNode;
  pinned?: boolean;
}

export default async function PinnedPostSnippet({
  upcomingEvent,
  children,
  pinned,
}: PinnedPostSnippetProps) {
  return (
    <div className="p-5 min-h-52 bg-white justify-center outline-black relative w-full outline-3 lg:items-center">
      {pinned !== true ? (
        <>
          <div className="absolute w-15 h-5 bg-pop-blue -right-5 -bottom-1 -rotate-[25deg] outline-2"></div>
          <div className="absolute w-15 h-5 bg-pop-magenta -top-1 -left-5 -rotate-[18deg] outline-2"></div>
        </>
      ) : (
        ""
      )}
      <div className="flex flex-col justify-center h-full px-5">
        {upcomingEvent ? (
          <>
            <p className="text-md font-medium">{upcomingEvent.date}</p>
            <p
              className="[letter-spacing:0.01em] text-white font-bold text-xl sm:text-2xl md:text-4xl font-holt
          text-shadow-lg [-webkit-text-stroke:6px_black] [paint-order:stroke_fill]"
            >
              {upcomingEvent.title}
            </p>
            <p className="text-lg font-semibold">{upcomingEvent.excerpt}</p>
            {children}
          </>
        ) : (
          <p className="text-lg font-semibold text-white">
            Nothing scheduled right now — check back soon!
          </p>
        )}
      </div>
    </div>
  );
}
