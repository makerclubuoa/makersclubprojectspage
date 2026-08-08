import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import {
  eventCard,
  eventCardMedia,
  eventCardBody,
  eventCardTitle,
  eventCardMeta,
} from "@/lib/ui";

// Washi-tape strips pinned to the card tops, mirroring the projects grid.
const TAPES = [
  "-top-2 left-5 -rotate-6 bg-pop-red",
  "-top-2 left-1/2 -translate-x-1/2 rotate-3 bg-pop-violet",
  "-top-2 right-5 rotate-6 bg-pop-blue",
  "-top-2 left-8 rotate-2 bg-pop-orange",
  "-top-2 right-8 -rotate-3 bg-pop-magenta",
];

// Dates arrive as a raw Ghost tag ("#DATE: 12 May 2025"), and fall back to
// "TBA | No date provided." when a post has no date tag — keep the readable
// half and drop the apology.
function tidyDate(date?: string) {
  const head = (date ?? "").split("|")[0].trim();
  return head.toLowerCase().startsWith("no date") ? "" : head;
}

interface EventSlideProps {
  title: string;
  src: string | StaticImageData;
  excerpt?: string;
  slug?: string;
  date?: string;
  index?: number;
}

export default function EventSlide({
  title,
  src,
  excerpt,
  slug,
  date,
  index = 0,
}: EventSlideProps) {
  const when = tidyDate(date);

  return (
    <Link href={`/events/${slug}`} className={eventCard}>
      <div
        className={`absolute z-10 h-5 w-16 outline-2 outline-black ${TAPES[index % TAPES.length]}`}
      />
      <div className={eventCardMedia}>
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1536px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className={eventCardBody}>
        <h3 className={eventCardTitle}>{title}</h3>
        {excerpt ? (
          <p className="m-0 line-clamp-3 text-[13px] leading-[1.55] text-ink-2">
            {excerpt}
          </p>
        ) : null}
        <div className={eventCardMeta}>
          <span>{when}</span>
          <span className="transition-colors duration-150 group-hover:text-pop-magenta">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}
