import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
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
  } catch (err) {
    let cfDebug = 'not tried'
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare')
      const { env } = getCloudflareContext()
      const cfKeys = Object.keys(env as object)
      const cfKey = (env as Record<string, string>).SUPABASE_SERVICE_ROLE_KEY
      cfDebug = `cfKeys:${cfKeys.join(',')} cfKeySet:${!!cfKey}`
    } catch (e) { cfDebug = `threw:${e}` }
    console.error('[ghost-signin] keySet:', !!process.env.SUPABASE_SERVICE_ROLE_KEY, cfDebug, 'err:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
