import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-server'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id')
  if (!projectId) return NextResponse.json({ error: 'Missing project_id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('id, user_id, author_name, body, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await anonClient().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, body } = await req.json()
  if (!project_id || !body?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (body.trim().length > 1000) {
    return NextResponse.json({ error: 'Comment too long' }, { status: 400 })
  }

  // Resolve display name from profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name, public_name, name_preference')
    .eq('id', user.id)
    .single()

  const authorName =
    (profile?.name_preference === 'public_name' ? profile?.public_name : profile?.display_name)
    ?? profile?.display_name
    ?? 'Anonymous'

  const { data: comment, error: insertError } = await supabaseAdmin
    .from('comments')
    .insert({ project_id, user_id: user.id, author_name: authorName, body: body.trim() })
    .select('id, user_id, author_name, body, created_at')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ comment })
}
