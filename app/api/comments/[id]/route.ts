import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isAdmin, userFromRequest } from '@/lib/server-auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await userFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch the comment to check ownership and get the project_id
  const { data: comment, error: fetchError } = await supabaseAdmin
    .from('comments')
    .select('user_id, project_id')
    .eq('id', id)
    .single()

  if (fetchError || !comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isCommentAuthor = comment.user_id === user.id

  // Every named maker has full project ownership for moderation purposes.
  const { data: project } = await supabaseAdmin
    .from('Projects')
    .select('submitted_by, maker_ids')
    .eq('id', comment.project_id)
    .single()

  const isProjectOwner = project?.submitted_by === user.id
    || (project?.maker_ids ?? []).includes(user.id)
  const admin = isAdmin(user)

  if (!isCommentAuthor && !isProjectOwner && !admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteError } = await supabaseAdmin
    .from('comments')
    .delete()
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
