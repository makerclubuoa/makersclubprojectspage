import { api } from "@/lib/ghost-content-api";
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

  console.log(upcomingEvent);
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
    html: upcomingEvent.html ?? "No body provided.",
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

export async function getPastEvents(
  page: number = 1,
  limit: number = 12,
  skip: number = 0,
): Promise<Event[]> {
  const pastEvents: PostsOrPages = await api().posts.browse({
    filter: "tag:Events",
    formats: "html",
    page: page ?? 1,
    limit: limit ?? 12,
    include: "tags",
  });

  //check the date of the events - if they are before today, then put them here
  let res: Event[] = [];
  let countNotPast = skip;

  for (const pastEvent of pastEvents) {
    let date = null;
    let foundDate = false;
    if (pastEvent.tags) {
      for (const tag of pastEvent.tags) {
        if (tag.name) {
          if (tag.name.includes("DATE")) {
            date = tag.name.replace("#DATE:", "").trim();
            const parsedDate = chrono.parseDate(date);
            console.log(parsedDate);
            if (parsedDate) {
              foundDate = true;
              if (
                parsedDate?.setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
              ) {
                res.push({
                  title: pastEvent.title ?? "No title provided.",
                  slug: pastEvent.slug,
                  src: pastEvent.feature_image ?? undefined,
                  date: date ?? "TBA | No date provided.",
                  html: pastEvent.html ?? "No body provided.",
                  excerpt: pastEvent.excerpt ?? "No except provided.",
                });
              } else {
                countNotPast++;
              }
            }
          }
        }
      }
      if (!foundDate) {
        res.push({
          title: pastEvent.title ?? "No title provided.",
          slug: pastEvent.slug,
          src: pastEvent.feature_image ?? undefined,
          date: date ?? "TBA | No date provided.",
          html: pastEvent.html ?? "No body provided.",
          excerpt: pastEvent.excerpt ?? "No except provided.",
        });
      }
    }
  }

  //depending on the number that is NOT past, we want to determine how many more we need to offset by

  const additionalPastEvents: PostsOrPages = await api().posts.browse({
    filter: "tag:Events",
    formats: "html",
    page: page ? page + 1 : 2,
    limit: limit ?? 12,
    include: "tags",
  });

  let counter = 0;
  for (const pastEvent of additionalPastEvents) {
    if (counter === countNotPast) break;
    let date = null;
    let foundDate = false;
    if (pastEvent.tags) {
      for (const tag of pastEvent.tags) {
        if (tag.name) {
          if (tag.name.includes("DATE")) {
            date = tag.name.replace("#DATE:", "").trim();
            const parsedDate = chrono.parseDate(date);
            console.log(parsedDate);
            if (parsedDate) {
              foundDate = true;
              if (
                parsedDate?.setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0)
              ) {
                res.push({
                  title: pastEvent.title ?? "No title provided.",
                  slug: pastEvent.slug,
                  src: pastEvent.feature_image ?? undefined,
                  date: date ?? "TBA | No date provided.",
                  html: pastEvent.html ?? "No body provided.",
                  excerpt: pastEvent.excerpt ?? "No except provided.",
                });
                counter++;
              }
            }
          }
        }
      }
      if (!foundDate) {
        res.push({
          title: pastEvent.title ?? "No title provided.",
          slug: pastEvent.slug,
          src: pastEvent.feature_image ?? undefined,
          date: date ?? "TBA | No date provided.",
          html: pastEvent.html ?? "No body provided.",
          excerpt: pastEvent.excerpt ?? "No except provided.",
        });
        counter++;
      }
    }
  }

  return res;
}

function parsePastEvents(pastEvents: PostsOrPages) {}
