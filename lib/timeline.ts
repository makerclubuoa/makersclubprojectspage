import { supabaseAdmin } from '@/lib/supabase-server'
import { TimelineType } from '@/lib/ghost/timeline'

export async function getTimelineItems(): Promise<TimelineType[]> {
  const { data, error } = await supabaseAdmin
    .from('Timeline')
    .select('name, date, description')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as TimelineType[]
}
