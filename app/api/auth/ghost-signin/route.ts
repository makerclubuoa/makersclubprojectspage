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
    console.error('[ghost-signin] url:', process.env.NEXT_PUBLIC_SUPABASE_URL, 'keySet:', !!process.env.SUPABASE_SERVICE_ROLE_KEY, 'err:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
