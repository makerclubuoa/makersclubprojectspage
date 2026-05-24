import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-server'

function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const sigPart = header.split(', ').find(s => s.startsWith('sha256='))
  if (!sigPart) return false
  const received = sigPart.slice(7)
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return received === expected
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const secret = process.env.GHOST_WEBHOOK_SECRET

  if (secret) {
    const sig = req.headers.get('x-ghost-signature')
    if (!verifySignature(body, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
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
    const display_name = current.name || email.split('@')[0]

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      await supabaseAdmin.from('profiles').update({ display_name }).eq('id', existing.id)
    } else {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name },
      })
      if (user && !error) {
        await supabaseAdmin.from('profiles').insert({ id: user.id, email, display_name })
      } else if (error) {
        console.error('[ghost-webhook] createUser error for', email, error.message)
      }
    }
  } else if (previous?.email && !current?.email) {
    // member.deleted — preserve user + projects, just log
    console.log('[ghost-webhook] member deleted:', previous.email)
  }

  return NextResponse.json({ ok: true })
}
