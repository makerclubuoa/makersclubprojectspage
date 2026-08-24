import GhostContentAPI, {
  type PostOrPage,
  type PostsOrPages,
} from "@tryghost/content-api";
import * as chrono from "chrono-node";
import { sanitizeGhostHtml } from "@/lib/sanitize";
import type { Event } from "@/lib/ghost/events";

let contentApi: ReturnType<typeof createApi> | undefined;
let eventsRequest: Promise<PostsOrPages> | undefined;

function createApi() {
  const url = process.env.NEXT_PUBLIC_GHOST_URL;
  const key = process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
  if (!url || !key) {
    throw new Error("Ghost Content API configuration is missing");
  }
  return new GhostContentAPI({ url, key, version: "v6.0" });
}

function api() {
  contentApi ??= createApi();
  return contentApi;
}

function eventDateTag(event: PostsOrPages[number]): string | null {
  const raw = event.tags?.find((tag) => tag.name?.includes("DATE"))?.name;
  return raw ? raw.replace("#DATE:", "").trim() : null;
}

const SLASH_DATE = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g;

function parseEventDateRange(dateTag: string): { start: Date; end: Date } | null {
  const nzSafeDate = dateTag.replace(
    SLASH_DATE,
    (_, day, month, year) => `${month}/${day}/${year}`,
  );
  const [result] = chrono.parse(nzSafeDate);
  if (!result) return null;
  const start = result.start.date();
  const end = result.end ? result.end.date() : start;
  return { start, end };
}

function isPastEvent(event: PostsOrPages[number]): boolean {
  const dateTag = eventDateTag(event);
  const range = dateTag ? parseEventDateRange(dateTag) : null;
  if (!range) return true;
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

function toEvent(post: PostOrPage): Event {
  return {
    title: post.title ?? "No title provided.",
    slug: post.slug,
    src: post.feature_image ?? undefined,
    date: eventDateTag(post) ?? "TBA | No date provided.",
    html: "",
    excerpt: post.excerpt ?? "No excerpt provided.",
  };
}

async function browseEvents(): Promise<PostsOrPages> {
  eventsRequest ??= api()
    .posts.browse({
      filter: "tag:Events",
      limit: "all",
      order: "published_at DESC",
      include: "tags",
    })
    .catch((error) => {
      eventsRequest = undefined;
      throw error;
    });
  return eventsRequest;
}

export async function getPublicUpcomingEvents(limit = 12): Promise<Event[]> {
  const events = await browseEvents();
  return events
    .map((post) => {
      const tag = eventDateTag(post);
      const range = tag ? parseEventDateRange(tag) : null;
      return range && !isPastEvent(post) ? { post, start: range.start } : null;
    })
    .filter((item): item is { post: PostOrPage; start: Date } => item !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, limit)
    .map(({ post }) => toEvent(post));
}

export async function getPublicLatestUpcomingEvent(): Promise<Event | null> {
  const [event] = await getPublicUpcomingEvents(1);
  return event ?? null;
}

export type PublicEventPage = {
  pastEvents: Event[];
  skip: number;
  hasMore: boolean;
};

export async function getPublicPastEvents(
  page = 1,
  pageSize = 12,
): Promise<PublicEventPage> {
  const events = await browseEvents();
  const pastEvents = events.filter(isPastEvent).map(toEvent);
  const start = Math.max(0, (page - 1) * pageSize);
  return {
    pastEvents: pastEvents.slice(start, start + pageSize),
    skip: start + pageSize,
    hasMore: start + pageSize < pastEvents.length,
  };
}

export interface PublicEventDetail extends Event {
  location: string;
}

export async function getPublicEvent(slug: string): Promise<PublicEventDetail> {
  const event = await api().posts.read(
    { slug },
    { include: ["tags"], formats: ["html"] },
  );
  const location = event.tags
    ?.find((tag) => tag.name?.includes("LOCATION"))
    ?.name?.replace("#LOCATION:", "")
    .trim();
  return {
    ...toEvent(event),
    html: event.html ? sanitizeGhostHtml(event.html) : "No description provided.",
    location: location ?? "Location TBA.",
  };
}
