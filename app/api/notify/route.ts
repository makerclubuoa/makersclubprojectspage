import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'makerclubuoa@gmail.com'
const FROM = process.env.RESEND_FROM ?? 'MAKE_UOA <noreply@makeuoa.nz>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://projects.makeuoa.nz'

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

  try {
    const body = await req.json()
    const { type } = body

    if (type === 'new-post') {
      const { projectId, projectTitle, projectBlurb, projectCategory, makers } = body
      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `New submission: ${projectTitle}`,
        html: newPostHtml({ projectId, projectTitle, projectBlurb, projectCategory, makers }),
      })

    } else if (type === 'status-change') {
      const { projectId, change } = body as { projectId: string; change: 'approved' | 'rejected' | 'featured' }
      const { data: project } = await supabaseAdmin
        .from('Projects')
        .select('title, submitted_by')
        .eq('id', projectId)
        .single()

      if (!project?.submitted_by) return NextResponse.json({ ok: true })

      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(project.submitted_by)

      if (!user?.email) return NextResponse.json({ ok: true })

      const name = user.user_metadata?.display_name ?? user.email.split('@')[0]
      const { subject, html } = statusChangeEmail({ change, projectId, projectTitle: project.title, name })

      await resend.emails.send({ from: FROM, to: user.email, subject, html })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notify]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

function newPostHtml({ projectId, projectTitle, projectBlurb, projectCategory, makers }: {
  projectId: string
  projectTitle: string
  projectBlurb: string
  projectCategory: string
  makers: string[]
}) {
  return `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0;border-radius:8px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;color:#9f42d1">MAKE_UOA · NEW SUBMISSION</p>
  <h2 style="margin:0 0 4px;font-size:22px;color:#fff">${projectTitle}</h2>
  <p style="margin:0 0 20px;font-size:12px;color:#666">${projectCategory} · ${makers.join(', ')}</p>
  <p style="margin:0 0 28px;color:#bbb;line-height:1.6">${projectBlurb}</p>
  <a href="${BASE_URL}/admin" style="display:inline-block;padding:10px 22px;background:#9f42d1;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;letter-spacing:.05em">Review in admin →</a>
</div>`
}

function statusChangeEmail({ change, projectId, projectTitle, name }: {
  change: string
  projectId: string
  projectTitle: string
  name: string
}) {
  if (change === 'approved') return {
    subject: `Your project "${projectTitle}" is now live!`,
    html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0;border-radius:8px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;color:#567dff">MAKE_UOA · PROJECT APPROVED</p>
  <h2 style="margin:0 0 16px;color:#fff">Your project is live!</h2>
  <p style="margin:0 0 24px;color:#bbb;line-height:1.6">Hey ${name}, <strong style="color:#fff">${projectTitle}</strong> has been approved and is now live on the Makers Club projects page.</p>
  <a href="${BASE_URL}/projects/${projectId}" style="display:inline-block;padding:10px 22px;background:#567dff;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;letter-spacing:.05em">View your project →</a>
</div>`,
  }

  if (change === 'rejected') return {
    subject: `Update on your project "${projectTitle}"`,
    html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0;border-radius:8px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;color:#ff3c6d">MAKE_UOA · PROJECT UPDATE</p>
  <h2 style="margin:0 0 16px;color:#fff">Project not approved</h2>
  <p style="margin:0 0 24px;color:#bbb;line-height:1.6">Hey ${name}, your project <strong style="color:#fff">${projectTitle}</strong> hasn't been approved at this time. Reach out to the Makers Club team if you have any questions.</p>
  <a href="${BASE_URL}" style="display:inline-block;padding:10px 22px;background:#222;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;letter-spacing:.05em">Browse projects →</a>
</div>`,
  }

  if (change === 'featured') return {
    subject: `★ "${projectTitle}" has been featured!`,
    html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0;border-radius:8px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;color:#f04ab9">MAKE_UOA · PROJECT FEATURED</p>
  <h2 style="margin:0 0 16px;color:#fff">★ Your project is featured!</h2>
  <p style="margin:0 0 24px;color:#bbb;line-height:1.6">Hey ${name}, <strong style="color:#fff">${projectTitle}</strong> has been selected as a featured project on the Makers Club page. Nice work!</p>
  <a href="${BASE_URL}/projects/${projectId}" style="display:inline-block;padding:10px 22px;background:linear-gradient(135deg,#9f42d1,#f04ab9);color:#fff;text-decoration:none;border-radius:4px;font-size:13px;letter-spacing:.05em">View your project →</a>
</div>`,
  }

  return { subject: `Update on "${projectTitle}"`, html: '' }
}
