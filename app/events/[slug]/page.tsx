import TimelineSection from "@/app/components/homepage/TimelineSection";
import placeholder from "@/public/placeholder.png";
import { getEvent } from "@/lib/ghost/event";
import { getYearTimeline } from "@/lib/ghost/timeline";
import Image from "next/image";
import Link from "next/link";
import JoinSection from "@/app/components/homepage/JoinSection";
import Footer from "@/app/components/Footer";
import Screentone from "@/app/components/global/Screentone";
import {
  container,
  holt,
  eventChip,
  postBody,
  pageBand,
  pageBandTitle,
  pageBandSub,
  projectBack,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (event.title == "No title provided.") {
    return {
      title: "Post Not Found",
    };
  }
  return {
    title: `${event.title} | Maker Club`,
    icons: { icon: "/logoNew.png" },
    description: event.excerpt,
  };
}

// The date / location / excerpt fields fall back to apologetic placeholders
// ("TBA | No date provided.") when a post is missing its tags. Keep whatever
// is genuinely useful and drop the rest rather than printing it on the hero.
function tidy(value: string | undefined, ...emptyPrefixes: string[]) {
  const head = (value ?? "").split("|")[0].trim();
  const lower = head.toLowerCase();
  return emptyPrefixes.some((p) => lower.startsWith(p)) ? "" : head;
}

export default async function Event({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const timelines = await getYearTimeline();

  const date = tidy(event.date, "no date");
  const location = tidy(event.location, "location tba");
  const excerpt = tidy(event.excerpt, "no excerpt", "no except");

  return (
    <div className="bg-purple-grad min-h-dvh">
      <header className="relative flex min-h-[24rem] w-full items-end overflow-hidden border-b-4">
        <Image
          src={event.src ?? placeholder}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        {/* Scrim rather than a flat brightness filter, so the photo stays
            readable at the top and the copy stays legible at the bottom. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
        <div className={`${container} relative z-[1] pt-28 pb-10`}>
          <Link href="/events" className={`${projectBack} text-white/85`}>
            ← All Events
          </Link>
          {(date || location) && (
            <div className="mb-3.5 flex flex-wrap gap-2">
              {date && <span className={eventChip}>{date}</span>}
              {location && <span className={eventChip}>{location}</span>}
            </div>
          )}
          <h1 className={`${holt} m-0 text-4xl md:text-5xl text-white`}>
            {event.title}
          </h1>
          {excerpt && (
            <p className="mt-4 mb-0 max-w-[70ch] text-md md:text-lg font-semibold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
              {excerpt}
            </p>
          )}
        </div>
      </header>

      <div className={`${container} py-14 max-[640px]:py-9`}>
        <article className={postBody}>
          <div
            className="ghost-content"
            dangerouslySetInnerHTML={{ __html: event.html }}
          />
        </article>
      </div>

      <div className={pageBand}>
        <Screentone />
        <p className={`${pageBandTitle} text-purple-300`}>
          Future Events Timeline
        </p>
        <p className={pageBandSub}>
          What&apos;s already locked in for the rest of the year.
        </p>
      </div>
      <TimelineSection timelines={timelines} />

      <div className="bg-white h-[50dvh]">
        <JoinSection />
      </div>
      <Footer />
    </div>
  );
}
