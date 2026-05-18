import { supabase } from './supabase'

export interface BuildLogEntry {
  date: string
  title: string
  body: string
  milestone?: boolean
  tag?: string
  week_label?: string
}

export interface BOMItem {
  item: string
  desc?: string
  qty: number
  unit_cost: number
  src?: string
}

export interface KudoEntry {
  who: string
  role?: string
  text: string
}

export interface Project {
  id: string
  title: string
  blurb: string | null
  description: string | null
  category: string | null
  date: string | null
  likes: number | null
  image: string | null
  github: string | null
  makers: string[] | null
  tools: string[] | null
  status: string | null
  Featured: boolean | null
  // New optional fields
  start_date: string | null
  build_time: string | null
  build_log: BuildLogEntry[] | null
  gallery_images: string[] | null
  bom: BOMItem[] | null
  retro_wins: string[] | null
  retro_fixes: string[] | null
  kudos: KudoEntry[] | null
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'linear-gradient(146deg, #567dff 0%, #9f42d1 60%, #f04ab9 100%)',
  Textiles: 'linear-gradient(146deg, #9f42d1 0%, #f04ab9 50%, #ff25c7 100%)',
  Food: 'linear-gradient(146deg, #ff25c7 0%, #ff3c6d 50%, #ff856a 100%)',
  '3D Print': 'linear-gradient(146deg, #567dff 0%, #9f42d1 100%)',
  Code: 'linear-gradient(146deg, #9f42d1 0%, #ff25c7 100%)',
  Art: 'linear-gradient(146deg, #f04ab9 0%, #ff856a 100%)',
  Wood: 'linear-gradient(146deg, #ff3c6d 0%, #ff856a 100%)',
  Workshops: 'linear-gradient(146deg, #567dff 0%, #ff25c7 100%)',
}

export function categoryColor(category: string | null): string {
  return (category && CATEGORY_COLORS[category]) || 'linear-gradient(146deg, #567dff 0%, #f04ab9 100%)'
}

export const CATEGORIES = [
  'All',
  'Electronics',
  '3D Print',
  'Code',
  'Textiles',
  'Art',
  'Food',
  'Wood',
  'Workshops',
]

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('Projects')
    .select('*')
    .or('status.is.null,and(status.neq.DRAFT,status.neq.REJECTED)')
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('Projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function fetchAllIds(): Promise<string[]> {
  const { data } = await supabase.from('Projects').select('id')
  return (data ?? []).map((r: { id: string }) => r.id)
}
