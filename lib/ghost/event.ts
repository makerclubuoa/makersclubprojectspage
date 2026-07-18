import { api } from "@/lib/ghost-content-api";
import { Event } from "./events";
import { sanitizeGhostHtml } from "@/lib/sanitize";

interface EventDetail extends Event {
  location: string;
}

export async function getEvent(slug: string): Promise<EventDetail> {
  const event = await api().posts.read(
    {
      slug: slug,
    },
    {
      include: ["tags"],
    },
  );
  let date = null;
  let location = null;
  if (event.tags) {
    for (const tag of event.tags) {
      if (event.tags) {
        if (tag.name) {
          if (tag.name.includes("DATE")) {
            date = tag.name.replace("#DATE:", "").trim();
          }
          if (tag.name.includes("LOCATION")) {
            location = tag.name.replace("#LOCATION:", "").trim();
          }
        }
      }
    }
  }

  return {
    title: event.title ?? "No title provided.",
    slug: event.slug,
    src: event.feature_image ?? undefined,
    date: date ?? "TBA | No date provided.",
    location: location ?? "Location TBA.",
    html: event.html
      ? sanitizeGhostHtml(event.html)
      : "No description provided.",
    excerpt: event.excerpt ?? "No excerpt provided.",
  };
}
