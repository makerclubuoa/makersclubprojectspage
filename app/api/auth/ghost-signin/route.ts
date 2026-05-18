import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile) {
    return NextResponse.json(
      { error: 'No Maker Club membership found for this email. Join at makeuoa.nz to get access.' },
      { status: 403 },
    )
  }

  return NextResponse.json({ ok: true })
}
