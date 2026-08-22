import { supabaseAdmin } from '@/lib/supabase-server'
import { TimelineType } from '@/lib/ghost/timeline'

export async function getTimelineItems(): Promise<TimelineType[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('Timeline')
      .select('name, date, description')
      .order('sort_order', { ascending: true })
    if (error) {
      console.warn('[timeline] Could not load timeline items:', error.message)
      return []
    }
    return (data ?? []) as TimelineType[]
  } catch (error) {
    console.warn('[timeline] Timeline request failed:', error)
    return []
  }
}
