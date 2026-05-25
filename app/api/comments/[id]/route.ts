import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'makerclubuoa@gmail.com'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await anonClient().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch the comment to check ownership and get the project_id
  const { data: comment, error: fetchError } = await supabaseAdmin
    .from('comments')
    .select('user_id, project_id')
    .eq('id', id)
    .single()

  if (fetchError || !comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isCommentAuthor = comment.user_id === user.id

  // Fetch the project to check if user is the project owner
  const { data: project } = await supabaseAdmin
    .from('Projects')
    .select('submitted_by')
    .eq('id', comment.project_id)
    .single()

  const isProjectOwner = project?.submitted_by === user.id
  const isAdmin = user.email === ADMIN_EMAIL

  if (!isCommentAuthor && !isProjectOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('comments')
    .delete()
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
