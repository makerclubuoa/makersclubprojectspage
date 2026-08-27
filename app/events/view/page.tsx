import { Suspense } from "react";
import type { TimelineType } from "@/lib/ghost/timeline";
import { getTimelineItems } from "@/lib/timeline";
import EventDetailContent from "@/app/components/events/EventDetailContent";
import { getEventMetadata } from "@/lib/ghost/event-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const rawSlug = (await searchParams).slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const eventUrl = slug
    ? `/events/view?slug=${encodeURIComponent(slug)}`
    : "/events/view";
  return getEventMetadata(slug, eventUrl);
}

export default async function EventViewPage() {
  const timelines = (await getTimelineItems()) as TimelineType[];
  return (
    <Suspense fallback={null}>
      <EventDetailContent initialTimelines={timelines} />
    </Suspense>
  );
}
