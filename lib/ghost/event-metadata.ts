import "server-only";

import type { Metadata } from "next";
import { getEvent } from "./event";

const FALLBACK_METADATA: Metadata = {
  title: "Event | Maker Club",
  description: "See the latest Maker Club event details.",
  icons: { icon: "/logoNew.png" },
};

export async function getEventMetadata(
  slug: string | undefined,
  eventUrl: string,
): Promise<Metadata> {
  if (!slug) return FALLBACK_METADATA;

  try {
    const event = await getEvent(slug);
    const description = event.excerpt ?? "See this Maker Club event.";
    const image = event.src ?? "/placeholder.png";

    return {
      title: `${event.title} | Maker Club`,
      description,
      icons: { icon: "/logoNew.png" },
      alternates: { canonical: eventUrl },
      openGraph: {
        type: "article",
        siteName: "Maker Club",
        title: event.title,
        description,
        url: eventUrl,
        images: [{ url: image, alt: event.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: event.title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      ...FALLBACK_METADATA,
      title: "Event Not Found | Maker Club",
    };
  }
}
