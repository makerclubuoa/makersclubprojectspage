import type { Event } from "@/lib/ghost/events";

type GhostTag = { name?: string };

type GhostPost = {
  title?: string;
  slug: string;
  feature_image?: string | null;
  excerpt?: string | null;
  html?: string | null;
  tags?: GhostTag[];
};

type GhostPagination = {
  next?: number | null;
};

type GhostPostsResponse = {
  posts?: GhostPost[];
  meta?: { pagination?: GhostPagination };
};

const SOURCE_PAGE_SIZE = 20;
let eventPosts: GhostPost[] = [];
let nextEventPage = 1;
let hasMoreEventPages = true;
let eventPageRequest: Promise<void> | undefined;

function ghostApiUrl(path: string): URL {
  const base = process.env.NEXT_PUBLIC_GHOST_URL;
  const key = process.env.NEXT_PUBLIC_GHOST_CONTENT_API_KEY;
  if (!base || !key) {
    throw new Error("Ghost Content API configuration is missing");
  }

  const url = new URL(`/ghost/api/content/${path.replace(/^\/+/, "")}`, base);
  url.searchParams.set("key", key);
  return url;
}

async function fetchGhostResponse(url: URL): Promise<GhostPostsResponse> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Ghost Content API returned ${response.status}`);
  }
  if (!(response.headers.get("content-type") ?? "").includes("application/json")) {
    throw new Error("Ghost Content API returned a non-JSON response");
  }

  return (await response.json()) as GhostPostsResponse;
}

async function fetchGhostPosts(url: URL): Promise<GhostPost[]> {
  return (await fetchGhostResponse(url)).posts ?? [];
}

function eventDateTag(event: GhostPost): string | null {
  const raw = event.tags?.find((tag) => tag.name?.startsWith("#DATE:"))?.name;
  return raw ? raw.replace("#DATE:", "").trim() : null;
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function localDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day);
  return date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
    ? date
    : null;
}

function parseEventDateRange(dateTag: string): { start: Date; end: Date } | null {
  const date = dateTag.split("|")[0].trim().replace(/[–—]/g, "-");

  const crossMonth = date.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*([A-Za-z]{3,9})\s+(\d{1,2})\s+(\d{4})$/,
  );
  if (crossMonth) {
    const startMonth = MONTHS[crossMonth[1].slice(0, 3).toLowerCase()];
    const endMonth = MONTHS[crossMonth[3].slice(0, 3).toLowerCase()];
    const year = Number(crossMonth[5]);
    const start = localDate(year, startMonth, Number(crossMonth[2]));
    const end = localDate(year, endMonth, Number(crossMonth[4]));
    return start && end ? { start, end } : null;
  }

  const sameMonth = date.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})\s*-\s*(\d{1,2})\s+(\d{4})$/,
  );
  if (sameMonth) {
    const month = MONTHS[sameMonth[1].slice(0, 3).toLowerCase()];
    const year = Number(sameMonth[4]);
    const start = localDate(year, month, Number(sameMonth[2]));
    const end = localDate(year, month, Number(sameMonth[3]));
    return start && end ? { start, end } : null;
  }

  const singleDate = date.match(
    /^([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})$/i,
  );
  if (singleDate) {
    const month = MONTHS[singleDate[1].slice(0, 3).toLowerCase()];
    const start = localDate(
      Number(singleDate[3]),
      month,
      Number(singleDate[2]),
    );
    return start ? { start, end: start } : null;
  }

  const numericDate = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (numericDate) {
    const rawYear = Number(numericDate[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const start = localDate(
      year,
      Number(numericDate[2]) - 1,
      Number(numericDate[1]),
    );
    return start ? { start, end: start } : null;
  }

  return null;
}

function isPastEvent(event: GhostPost): boolean {
  const dateTag = eventDateTag(event);
  const range = dateTag ? parseEventDateRange(dateTag) : null;
  if (!range) return true;

  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

function toEvent(post: GhostPost): Event {
  return {
    title: post.title ?? "No title provided.",
    slug: post.slug,
    src: post.feature_image ?? undefined,
    date: eventDateTag(post) ?? "TBA | No date provided.",
    html: "",
    excerpt: post.excerpt ?? "No excerpt provided.",
  };
}

async function loadNextEventPage(): Promise<void> {
  if (!hasMoreEventPages) return;
  if (eventPageRequest) return eventPageRequest;

  const page = nextEventPage;
  const url = ghostApiUrl("posts/");
  url.searchParams.set("filter", "tag:Events");
  url.searchParams.set("limit", String(SOURCE_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("order", "published_at DESC");
  url.searchParams.set("include", "tags");
  url.searchParams.set(
    "fields",
    "title,slug,feature_image,excerpt,published_at",
  );

  eventPageRequest = fetchGhostResponse(url)
    .then((payload) => {
      const posts = payload.posts ?? [];
      eventPosts = [...eventPosts, ...posts];
      nextEventPage = page + 1;
      hasMoreEventPages = payload.meta?.pagination?.next != null;
    })
    .finally(() => {
      eventPageRequest = undefined;
    });

  return eventPageRequest;
}

async function ensurePastEventCount(count: number): Promise<void> {
  while (
    eventPosts.filter(isPastEvent).length < count &&
    hasMoreEventPages
  ) {
    await loadNextEventPage();
  }
}

export async function getPublicUpcomingEvents(limit = 12): Promise<Event[]> {
  if (eventPosts.length === 0) await loadNextEventPage();
  return eventPosts
    .map((post) => {
      const tag = eventDateTag(post);
      const range = tag ? parseEventDateRange(tag) : null;
      return range && !isPastEvent(post) ? { post, start: range.start } : null;
    })
    .filter((item): item is { post: GhostPost; start: Date } => item !== null)
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
  const start = Math.max(0, (page - 1) * pageSize);
  await ensurePastEventCount(start + pageSize);
  const pastEvents = eventPosts.filter(isPastEvent).map(toEvent);
  const end = start + pageSize;
  return {
    pastEvents: pastEvents.slice(start, end),
    skip: end,
    hasMore: end < pastEvents.length || hasMoreEventPages,
  };
}

export interface PublicEventDetail extends Event {
  location: string;
}

function sanitizeGhostHtmlInBrowser(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script, object, embed").forEach((element) => {
    element.remove();
  });

  document.querySelectorAll<HTMLElement>("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return document.body.innerHTML;
}

export async function getPublicEvent(slug: string): Promise<PublicEventDetail> {
  const url = ghostApiUrl(`posts/slug/${encodeURIComponent(slug)}/`);
  url.searchParams.set("include", "tags");
  url.searchParams.set("formats", "html");
  const [event] = await fetchGhostPosts(url);
  if (!event) throw new Error("Event not found");

  const location = event.tags
    ?.find((tag) => tag.name?.startsWith("#LOCATION:"))
    ?.name?.replace("#LOCATION:", "")
    .trim();

  return {
    ...toEvent(event),
    html: event.html
      ? sanitizeGhostHtmlInBrowser(event.html)
      : "No description provided.",
    location: location ?? "Location TBA.",
  };
}
