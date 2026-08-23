import { NextRequest, NextResponse } from 'next/server'
import { deleteSupabaseAccount } from '@/lib/account-deletion'
import { deleteGhostMember } from '@/lib/ghost-admin'
import { userFromRequest } from '@/lib/server-auth'
import { supabaseAdmin } from '@/lib/supabase-server'

const PROFILE_FIELDS = 'display_name, public_name, name_preference, credit_consented, membership_year, study_years_remaining, study_years_as_of_year, expected_graduation_year'

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Your Maker Club profile could not be found.' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const user = await userFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null) as {
    public_name?: unknown
    name_preference?: unknown
    credit_consented?: unknown
  } | null
  const publicName = typeof body?.public_name === 'string' ? body.public_name.trim() : ''
  const preference = body?.name_preference
  if (publicName.length > 80) {
    return NextResponse.json({ error: 'Username must be 80 characters or fewer.' }, { status: 400 })
  }
  if (preference !== 'name' && preference !== 'public_name') {
    return NextResponse.json({ error: 'Choose whether to show your name or username.' }, { status: 400 })
  }
  if (preference === 'public_name' && !publicName) {
    return NextResponse.json({ error: 'Set a username before choosing to display it.' }, { status: 400 })
  }
  if (typeof body?.credit_consented !== 'boolean') {
    return NextResponse.json({ error: 'Invalid project credit preference.' }, { status: 400 })
  }

  if (publicName) {
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('public_name', publicName)
      .neq('id', user.id)
      .maybeSingle()
    if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })
    if (existing) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      public_name: publicName || null,
      name_preference: preference,
      credit_consented: body.credit_consented,
    })
    .eq('id', user.id)
    .select('public_name, name_preference, credit_consented')
    .single()
  if (error) {
    const taken = error.code === '23505'
    return NextResponse.json(
      { error: taken ? 'That username is already taken.' : error.message },
      { status: taken ? 409 : 500 },
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const user = await userFromRequest(req)
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let confirmation = ''
  try {
    const body = await req.json() as { confirmation?: unknown }
    confirmation = typeof body.confirmation === 'string' ? body.confirmation.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm account deletion.' }, { status: 400 })
  }

  try {
    // Removing Ghost first causes the webhook to run the same idempotent
    // cleanup. Calling it directly as well makes deletion immediate even if
    // webhook delivery is delayed.
    await deleteGhostMember(user.email.toLowerCase())
    const result = await deleteSupabaseAccount(user.id)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[account-delete]', error)
    return NextResponse.json(
      { error: 'Your account could not be fully deleted. Nothing shared was deleted; please try again.' },
      { status: 500 },
    )
  }
}
