import { supabase } from './supabase'

// Mirror of the planned Supabase `posts` table (Ghost migration target).
// See the migration plan: content arrives as rendered HTML with image URLs
// already rewritten to re-hosted storage.
export interface Post {
  id: string
  ghost_id: string | null      // original Ghost id — idempotent migration key
  slug: string                 // preserved from Ghost for URL continuity
  title: string
  html: string | null          // rendered body (sanitize before dangerouslySetInnerHTML)
  plaintext: string | null     // for search / previews
  excerpt: string | null
  feature_image: string | null
  status: string | null        // 'published' | 'draft'
  published_at: string | null
  updated_at: string | null
  author: string | null
  tags: string[] | null
}

// NOTE: the `posts` table does not exist yet. These fetchers swallow errors and
// return empty results so the /blog wireframe renders an empty state instead of
// crashing pre-migration. Tighten error handling once the table is live.

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) return []
  return data ?? []
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) return null
  return data
}

export async function fetchAllSlugs(): Promise<string[]> {
  const { data } = await supabase.from('posts').select('slug')
  return (data ?? []).map((r: { slug: string }) => r.slug)
}
