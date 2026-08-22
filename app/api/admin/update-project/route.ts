import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { isAdmin, userFromRequest } from '@/lib/server-auth'
import { removeProjectAssets } from '@/lib/project-write'
import type { Project } from '@/lib/projects'

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, status, Featured, _delete } = await req.json()
  if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: existing } = await supabaseAdmin.from('Projects').select('*').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (_delete === true) {
    const { error } = await supabaseAdmin.from('Projects').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await removeProjectAssets(existing as Project, id)
    return NextResponse.json({ ok: true })
  }

  const update: Record<string, unknown> = {}
  if (status !== undefined) {
    if (!['DRAFT', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = status
    if (status !== 'APPROVED') update.Featured = false
  }
  if (Featured !== undefined) {
    if (typeof Featured !== 'boolean') return NextResponse.json({ error: 'Invalid featured value' }, { status: 400 })
    const resultingStatus = (update.status ?? existing.status) as string | null
    if (Featured && resultingStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Only approved projects can be featured' }, { status: 400 })
    }
    update.Featured = Featured
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { error } = await supabaseAdmin.from('Projects').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
