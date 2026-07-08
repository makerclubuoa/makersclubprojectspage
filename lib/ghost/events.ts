import { api } from "@/lib/ghost-api";
import { PostOrPage, PostsOrPages } from "@tryghost/content-api";

export interface Event {
  title: string;
  slug: string;
  html: string;
  date: string;
  src?: string;
  excerpt?: string;
}

export default async function getLatestUpcomingEvent(): Promise<Event> {
  const upcomingEvent: PostOrPage = (
    await api().posts.browse({
      filter: "tag:Events",
      formats: "html,lexical",
      limit: 1,
      order: "published_at DESC",
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
