import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ghostMemberExists, createGhostMember } from '@/lib/ghost-admin'

// Outbound sync: mirror a freshly-authenticated Supabase user into Ghost so the
// two stay consistent while Ghost still exists. Idempotent — safe to call on
// every login. Authenticates the caller by their own Supabase access token, so
// nobody can push arbitrary emails into Ghost.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user?.email) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
  // Only mirror verified emails — prevents seeding Ghost with unconfirmed addresses.
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: 'Email not confirmed' }, { status: 403 })
  }

  const email = user.email.toLowerCase()
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()
  const name = profile?.display_name ?? undefined

  try {
    if (!(await ghostMemberExists(email))) {
      await createGhostMember(email, name)
    }
  } catch (e) {
    console.error('[ensure-ghost] sync failed for', email, e)
    return NextResponse.json({ error: 'Ghost sync failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
