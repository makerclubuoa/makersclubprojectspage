import { api } from "@/lib/ghost-content-api";
import { sanitizeGhostHtml } from "@/lib/sanitize";
import { PostOrPage, PostsOrPages } from "@tryghost/content-api";
import * as chrono from "chrono-node";
export interface Event {
  title: string;
  slug: string;
  html: string;
  date: string;
  src?: string;
  excerpt?: string;
}

function toEvent(post: PostOrPage): Event {
  const date = post.tags?.find((t) => t.name?.includes("DATE"))?.name
    ?.replace("#DATE:", "")
    .trim();

  return {
    title: post.title ?? "No title provided.",
    slug: post.slug,
    src: post.feature_image ?? undefined,
    date: date ?? "TBA | No date provided.",
    html: post.html ? sanitizeGhostHtml(post.html) : "No body provided.",
    excerpt: post.excerpt ?? "No excerpt provided.",
  };
}

function eventDateTag(event: PostsOrPages[number]): string | null {
  const raw = event.tags?.find((t) => t.name?.includes("DATE"))?.name;
  return raw ? raw.replace("#DATE:", "").trim() : null;
}

/**
 * Parses a #DATE: tag into its start and end. `chrono.parseDate()` (used
 * everywhere below) silently collapses a range like "31 Jul - 14 Nov 2026"
 * down to just its start, so a multi-day event reads as over the moment its
 * first day passes. Using `chrono.parse()` keeps the end when there is one.
 */
function parseEventDateRange(dateTag: string): { start: Date; end: Date } | null {
  const [result] = chrono.parse(dateTag);
  if (!result) return null;
  const start = result.start.date();
  const end = result.end ? result.end.date() : start;
  return { start, end };
}

/** An event isn't past until its last day (its range end, if it has one) has passed. */
function isPastEvent(event: PostsOrPages[number]) {
  const dateTag = eventDateTag(event);
  const range = dateTag ? parseEventDateRange(dateTag) : null;
  if (!range) return true;

  const endDate = new Date(range.end);
  endDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate < today;
}

/** All events whose #DATE: tag hasn't passed yet, soonest-starting first. */
export async function getUpcomingEvents(limit: number = 12): Promise<Event[]> {
  const events: PostsOrPages = await api().posts.browse({
    filter: "tag:Events",
    formats: "html",
    limit: 50,
    order: "published_at DESC",
    include: "tags",
  });

  // Ghost posts are ordered by publish date, not event date, so this has to
  // scan and re-sort rather than trust the API's ordering.
  const upcoming: { post: PostOrPage; start: Date }[] = [];
  for (const post of events) {
    if (isPastEvent(post)) continue;
    const dateTag = eventDateTag(post);
    const range = dateTag ? parseEventDateRange(dateTag) : null;
    if (!range) continue;
    upcoming.push({ post, start: range.start });
  }

  upcoming.sort((a, b) => a.start.getTime() - b.start.getTime());

  return upcoming.slice(0, limit).map(({ post }) => toEvent(post));
}

export default async function getLatestUpcomingEvent(): Promise<Event | null> {
  const [next] = await getUpcomingEvents(1);
  return next ?? null;
}
//TODO: the last event is skipped occasionally due to the number in getPastEvents
export async function getPastEvents(
  offset: number = 12,
  page: number = 1,
): Promise<{ pastEvents: Event[]; skip: number; hasMore: boolean }> {
  const pastEvents: PostsOrPages = await api().posts.browse({
    filter: "tag:Events",
    formats: "html",
    page: page,
    limit: offset,
    include: "tags",
  });

  let res: Event[] = [];
  let total = 0;

  for (const pastEvent of pastEvents) {
    if (total === 12) break;
    if (pastEvent.tags && isPastEvent(pastEvent)) {
      const date = pastEvent.tags
        ?.find((t) => t.name?.includes("DATE"))
        ?.name?.replace("#DATE:", "")
        .trim();
      res.push({
        title: pastEvent.title ?? "No title provided.",
        slug: pastEvent.slug,
        src: pastEvent.feature_image ?? undefined,
        date: date ?? "TBA | No date provided.",
        html: pastEvent.html ?? "No body provided.",
        excerpt: pastEvent.excerpt ?? "No except provided.",
      });
      total++;
    }
  }

  //NOTE: total is the number of valid past events.

  if (page === 1) {
    const additionalPastEvents: PostsOrPages = await api().posts.browse({
      filter: "tag:Events",
      formats: "html",
      page: 1,
      limit: 12 - total + 12,
      include: "tags",
    });

    const countNotPast = 12 - total;

    let moreEvents: Event[] = [];

    for (
      let i = additionalPastEvents.length - 1;
      i >= 0 && moreEvents.length < countNotPast;
      i--
    ) {
      const event = additionalPastEvents[i];

      if (event.tags && isPastEvent(event)) {
        const date = event.tags
          ?.find((t) => t.name?.includes("DATE"))
          ?.name?.replace("#DATE:", "")
          .trim();

        moreEvents.unshift({
          title: event.title ?? "No title provided.",
          slug: event.slug,
          src: event.feature_image ?? undefined,
          date: date ?? "TBA | No date provided.",
          html: event.html ?? "No body provided.",
          excerpt: event.excerpt ?? "No excerpt provided.",
        });
      }
    }

    res = [...res, ...moreEvents];

    return {
      pastEvents: res,
      skip: offset + (12 - total),
      hasMore: additionalPastEvents.meta.pagination !== null,
    };
  }
  return {
    pastEvents: res,
    skip: 12 + offset + (12 - total),
    hasMore: pastEvents.meta.pagination !== null,
  };
}

function parsePastEvents(pastEvents: PostsOrPages) {}
