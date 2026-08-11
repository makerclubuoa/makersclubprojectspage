import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'makerclubuoa@gmail.com'

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('Timeline')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, date, description } = await req.json()
  if (!name || !date)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data: maxRow } = await supabaseAdmin
    .from('Timeline')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (maxRow?.sort_order ?? 0) + 1

  const { data, error } = await supabaseAdmin
    .from('Timeline')
    .insert({ name, date, description: description ?? '', sort_order })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { order } = await req.json() as { order: { id: string; sort_order: number }[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: 'Missing order' }, { status: 400 })

  await Promise.all(
    order.map(({ id, sort_order }) =>
      supabaseAdmin.from('Timeline').update({ sort_order }).eq('id', id)
    )
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('Timeline').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
