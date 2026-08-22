import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { ghostMemberExists, createGhostMember, upsertGhostMember } from '@/lib/ghost-admin'
import { membershipYearLabel } from '@/lib/membership'
import { serverEnv } from '@/lib/server-env'

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
    .select('display_name, faculty, membership_year, membership_email_confirmed_at')
    .eq('id', user.id)
    .single()
  const name = profile?.display_name ?? undefined

  try {
    if (profile?.membership_year && !profile.membership_email_confirmed_at) {
      const member = await upsertGhostMember({
        email,
        name: name || email.split('@')[0],
        note: profile.faculty || '',
        label: membershipYearLabel(profile.membership_year),
        newsletterName: serverEnv('GHOST_NEWSLETTER_NAME') ?? 'UoA Maker Club',
      })
      const confirmedAt = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ghost_member_id: member.id || null,
          membership_email_confirmed_at: confirmedAt,
          membership_sync_status: 'synced',
          membership_sync_error: null,
        })
        .eq('id', user.id)
      if (updateError) throw new Error(updateError.message)
    } else if (!(await ghostMemberExists(email))) {
      await createGhostMember(email, name)
    }
  } catch (e) {
    console.error('[ensure-ghost] sync failed for', email, e)
    if (profile?.membership_year && !profile.membership_email_confirmed_at) {
      const message = e instanceof Error ? e.message : 'Ghost activation failed'
      await supabaseAdmin
        .from('profiles')
        .update({ membership_sync_status: 'failed', membership_sync_error: message.slice(0, 1000) })
        .eq('id', user.id)
    }
    return NextResponse.json({ error: 'Ghost sync failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
