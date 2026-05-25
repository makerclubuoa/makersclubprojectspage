import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'makerclubuoa@gmail.com'
const FROM = process.env.RESEND_FROM ?? 'MAKE_UOA <noreply@makeuoa.nz>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://projects.makeuoa.nz'

export async function POST(req: NextRequest) {
  const { comment_id, project_id, project_title, comment_body, author_name } = await req.json()
  if (!comment_id || !project_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `Comment reported on "${project_title ?? project_id}"`,
        html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0;border-radius:8px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;color:#ff3c6d">MAKE_UOA · COMMENT REPORTED</p>
  <h2 style="margin:0 0 20px;font-size:18px;color:#fff">A comment has been flagged for review</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
    <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:12px">Project</td><td style="padding:6px 0;color:#e0e0e0;font-size:12px">${project_title ?? project_id}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:12px">Comment ID</td><td style="padding:6px 0;color:#e0e0e0;font-size:12px">${comment_id}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:12px">Author</td><td style="padding:6px 0;color:#e0e0e0;font-size:12px">${author_name ?? '—'}</td></tr>
  </table>
  <p style="margin:0 0 8px;font-size:11px;letter-spacing:.08em;color:#888">COMMENT</p>
  <p style="margin:0 0 24px;color:#bbb;line-height:1.6;font-size:13px;border-left:2px solid #333;padding-left:12px">${comment_body ?? '—'}</p>
  <a href="${BASE_URL}/projects/${project_id}" style="display:inline-block;padding:10px 22px;background:#ff3c6d;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;letter-spacing:.05em">View project →</a>
</div>`,
      })
    } catch (err) {
      console.error('[comment-report]', err)
      return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
