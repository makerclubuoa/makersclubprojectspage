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

export default async function getLatestUpcomingEvent(): Promise<Event> {
  //TODO: change to pick the next upcoming, not just the latest published
  const upcomingEvent: PostOrPage = (
    await api().posts.browse({
      filter: "tag:Events",
      formats: "html",
      limit: 1,
      order: "published_at DESC",
      include: "tags",
    })
  )[0];
  let date = null;
  if (upcomingEvent.tags) {
    for (const tag of upcomingEvent.tags) {
      if (tag.name) {
        if (tag.name.includes("DATE")) {
          date = tag.name.replace("#DATE:", "").trim();
        }
      }
    }
  }

  return {
    title: upcomingEvent.title ?? "No title provided.",
    slug: upcomingEvent.slug,
    src: upcomingEvent.feature_image ?? undefined,
    date: date ?? "TBA | No date provided.",
    html: upcomingEvent.html
      ? sanitizeGhostHtml(upcomingEvent.html)
      : "No body provided.",
    excerpt: upcomingEvent.excerpt ?? "No except provided.",
  };
}

// TODO: check if this is working
export async function getUpcomingEvents(): Promise<Event[]> {
  const upcomingEvents: PostsOrPages = await api().posts.browse({
    filter: "tag:Events",
    formats: "html",
    limit: 4,
    include: "tags",
  });

  //check the date of the events - if they are after today, then put them here
  let res: Event[] = [];

  for (const upcomingEvent of upcomingEvents) {
    let date = null;
    if (upcomingEvent.tags) {
      for (const tag of upcomingEvent.tags) {
        if (tag.name) {
          if (tag.name.includes("DATE")) {
            date = tag.name.replace("#DATE:", "").trim();
            const parsedDate = chrono.parseDate(date);
            if (parsedDate && parsedDate?.getDate() > Date.now()) {
              res.push({
                title: upcomingEvent.title ?? "No title provided.",
                slug: upcomingEvent.slug,
                src: upcomingEvent.feature_image ?? undefined,
                date: date ?? "TBA | No date provided.",
                html: upcomingEvent.html ?? "No body provided.",
                excerpt: upcomingEvent.excerpt ?? "No except provided.",
              });
            }
          }
        }
      }
    }
  }

  return res;
}
function isPastEvent(event: PostsOrPages[number]) {
  let dateTag: string | null = null;

  for (const tag of event.tags ?? []) {
    if (tag.name?.includes("DATE")) {
      dateTag = tag.name.replace("#DATE:", "").trim();

      const parsedDate = chrono.parseDate(dateTag);

      if (!parsedDate) return true;

      const eventDate = new Date(parsedDate);
      eventDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return eventDate < today;
    }
  }

  return true;
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
