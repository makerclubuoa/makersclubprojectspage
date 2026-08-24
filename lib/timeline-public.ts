import { supabase } from "@/lib/supabase";
import type { TimelineType } from "@/lib/ghost/timeline";

export async function getPublicTimelineItems(): Promise<TimelineType[]> {
  const { data, error } = await supabase
    .from("Timeline")
    .select("name, date, description")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TimelineType[];
}
