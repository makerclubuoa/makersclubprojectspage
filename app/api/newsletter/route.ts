import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const ADMIN_EMAIL = 'makerclubuoa@gmail.com'

// WIREFRAME ONLY. Send a post as a newsletter to opted-in members.
//
// Planned flow (see newsletter architecture discussion):
//   1. verify caller is the admin (below)
//   2. load the post by id from Supabase `posts`
//   3. load recipients: profiles where newsletter_opt_out is not true
//   4. send via a relay (Amazon SES batch / smarthost) — NOT from the app's IP
//   5. inject List-Unsubscribe header -> /api/newsletter/unsubscribe endpoint
//   6. record bounces/complaints (SES -> SNS webhook) back onto profiles
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  if (user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // TODO: implement send pipeline (steps 2–6 above).
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
