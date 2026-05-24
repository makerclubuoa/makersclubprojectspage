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
  website: string | null
  makers: string[] | null
  tools: string[] | null
  status: string | null
  Featured: boolean | null
  submitted_by: string | null
  maker_ids: string[] | null
  anon_count: number | null
  // optional fields
  start_date: string | null
  build_time: string | null
  build_log: BuildLogEntry[] | null
  gallery_images: string[] | null
  bom: BOMItem[] | null
  retro_wins: string[] | null
  retro_fixes: string[] | null
  kudos: KudoEntry[] | null
}

export function resolvePublicName(profile: {
  display_name?: string | null
  public_name?: string | null
  name_preference?: string | null
}): string {
  if (profile.name_preference === 'public_name' && profile.public_name) {
    return profile.public_name
  }
  return profile.display_name ?? 'Anonymous'
}

export async function fetchMakerDisplay(project: Project): Promise<{ names: string[]; anonCount: number }> {
  if (!project.submitted_by) {
    return { names: project.makers ?? [], anonCount: project.anon_count ?? 0 }
  }

  const names: string[] = []

  const { data: submitter } = await supabase
    .from('profiles')
    .select('display_name, public_name, name_preference')
    .eq('id', project.submitted_by)
    .single()
  if (submitter) names.push(resolvePublicName(submitter))

  let anonCount = 0
  if (project.maker_ids && project.maker_ids.length > 0) {
    const { data: coMakers } = await supabase
      .from('profiles')
      .select('display_name, public_name, name_preference, credit_consented')
      .in('id', project.maker_ids)
    for (const p of coMakers ?? []) {
      if (p.credit_consented) names.push(resolvePublicName(p))
      else anonCount++
    }
  }

  // If the submitter profile doesn't exist yet, fall back entirely to stored names
  if (names.length === 0 && anonCount === 0) {
    return { names: project.makers ?? [], anonCount: project.anon_count ?? 0 }
  }

  // Append legacy co-maker strings from makers[] that aren't covered by profile
  // resolution. Use set-based filtering so position in the array doesn't matter.
  if (!project.maker_ids || project.maker_ids.length === 0) {
    const resolvedSet = new Set(names.map(n => n.toLowerCase()))
    const extras = (project.makers ?? []).filter(n => !resolvedSet.has(n.toLowerCase()))
    names.push(...extras)
  }

  return { names, anonCount }
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
    .eq('status', 'APPROVED')
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
