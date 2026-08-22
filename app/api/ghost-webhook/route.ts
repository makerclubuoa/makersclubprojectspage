import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-server'

function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const parts = header.split(',').map(part => part.trim())
  const sigPart = parts.find(s => s.startsWith('sha256='))
  const tPart = parts.find(s => s.startsWith('t='))
  if (!sigPart || !tPart) return false
  const received = sigPart.slice(7)
  const timestamp = tPart.slice(2)
  const numericTimestamp = Number(timestamp)
  if (!Number.isFinite(numericTimestamp)) return false
  const timestampMs = numericTimestamp > 10_000_000_000 ? numericTimestamp : numericTimestamp * 1000
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false
  // Ghost signs the body concatenated with the timestamp it sends in the header.
  const expected = createHmac('sha256', secret).update(`${body}${timestamp}`).digest('hex')
  const receivedBuf = Buffer.from(received, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  return receivedBuf.length === expectedBuf.length && timingSafeEqual(receivedBuf, expectedBuf)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const secret = process.env.GHOST_WEBHOOK_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  }
  const sig = req.headers.get('x-ghost-signature')
  if (!verifySignature(body, sig, secret)) {
    return NextResponse.json({ error: 'Invalid or stale signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const memberData = event.member as {
    current?: Record<string, string> | null
    previous?: Record<string, string> | null
  } | undefined

  if (!memberData) return NextResponse.json({ ok: true })

  const current = memberData.current
  const previous = memberData.previous

  if (current?.email) {
    const email = current.email.toLowerCase()
    const previousEmail = previous?.email?.toLowerCase()
    const display_name = current.name || email.split('@')[0]

    const currentLookup = supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    const previousLookup = previousEmail && previousEmail !== email
      ? supabaseAdmin.from('profiles').select('id').eq('email', previousEmail).maybeSingle()
      : Promise.resolve({ data: null, error: null })
    const [
      { data: existingAtCurrentEmail, error: currentLookupError },
      { data: existingAtPreviousEmail, error: previousLookupError },
    ] = await Promise.all([currentLookup, previousLookup])
    if (currentLookupError) {
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 })
    }
    if (previousLookupError) {
      return NextResponse.json({ error: 'Previous profile lookup failed' }, { status: 500 })
    }
    if (
      existingAtCurrentEmail
      && existingAtPreviousEmail
      && existingAtCurrentEmail.id !== existingAtPreviousEmail.id
    ) {
      return NextResponse.json({ error: 'Email change conflicts with an existing account' }, { status: 409 })
    }

    const existing = existingAtCurrentEmail ?? existingAtPreviousEmail
    const emailChanged = !existingAtCurrentEmail && !!existingAtPreviousEmail

    if (existing) {
      if (emailChanged) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          email,
          email_confirm: true,
          user_metadata: { display_name },
        })
        if (authError) return NextResponse.json({ error: 'Account email sync failed' }, { status: 500 })
      }
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ display_name, email })
        .eq('id', existing.id)
      if (error) return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 })
    } else {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name },
      })
      if (user && !error) {
        // A trigger on auth.users auto-creates the profiles row (with display_name
        // defaulted to the email prefix), so update it with the real name instead of
        // inserting — an insert would collide on the primary key.
        const { error: profileError } = await supabaseAdmin.from('profiles').update({ display_name }).eq('id', user.id)
        if (profileError) return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 })
      } else if (error) {
        console.error('[ghost-webhook] createUser error for', email, error.message)
        return NextResponse.json({ error: 'Member sync failed' }, { status: 500 })
      }
    }
  } else if (previous?.email && !current?.email) {
    // member.deleted — preserve user + projects, just log
    console.log('[ghost-webhook] member deleted:', previous.email)
  }

  return NextResponse.json({ ok: true })
}
