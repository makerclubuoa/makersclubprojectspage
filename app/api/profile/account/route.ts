import { NextRequest, NextResponse } from 'next/server'
import { deleteSupabaseAccount } from '@/lib/account-deletion'
import { deleteGhostMember } from '@/lib/ghost-admin'
import { userFromRequest } from '@/lib/server-auth'

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
