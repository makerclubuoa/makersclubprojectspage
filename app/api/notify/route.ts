import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin, userFromRequest } from "@/lib/server-auth";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "makerclubuoa@gmail.com";
const FROM = process.env.RESEND_FROM ?? "MAKE_UOA <noreply@makeuoa.nz>";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://projects.makeuoa.nz";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]!);
}

export async function POST(req: NextRequest) {
  const caller = await userFromRequest(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, skipped: true });

  let reservedNotification: { projectId: string; reservedAt: string } | null = null;
  try {
    const body = await req.json() as { type?: unknown; projectId?: unknown; change?: unknown };
    if (typeof body.projectId !== "string") {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    if (body.type === "new-post") {
      const { data: project } = await supabaseAdmin
        .from("Projects")
        .select("id, title, blurb, category, makers, submitted_by")
        .eq("id", body.projectId)
        .single();
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (project.submitted_by !== caller.id && !isAdmin(caller)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const reservedAt = new Date().toISOString();
      const { data: reservation, error: reserveError } = await supabaseAdmin
        .from("Projects")
        .update({ submission_notified_at: reservedAt })
        .eq("id", body.projectId)
        .is("submission_notified_at", null)
        .select("id")
        .maybeSingle();
      if (!reservation && !reserveError) {
        return NextResponse.json({ ok: true, alreadySent: true });
      }
      if (reserveError) throw new Error(reserveError.message);
      reservedNotification = { projectId: body.projectId, reservedAt };
      const { data: contactRow } = await supabaseAdmin
        .from("project_contacts")
        .select("contact")
        .eq("project_id", body.projectId)
        .maybeSingle();
      const result = await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `New submission: ${project.title}`,
        html: newPostHtml({
          projectId: body.projectId,
          projectTitle: project.title,
          projectBlurb: project.blurb ?? "",
          projectCategory: project.category ?? "Uncategorised",
          makers: project.makers ?? [],
          contact: contactRow?.contact ?? caller.email ?? "Not provided",
        }),
      });
      if (result.error) throw new Error(result.error.message);
    } else if (body.type === "status-change") {
      if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (!(["approved", "rejected", "featured"] as unknown[]).includes(body.change)) {
        return NextResponse.json({ error: "Invalid status notification" }, { status: 400 });
      }
      const change = body.change as "approved" | "rejected" | "featured";
      const { data: project } = await supabaseAdmin
        .from("Projects")
        .select("title, submitted_by")
        .eq("id", body.projectId)
        .single();
      if (!project?.submitted_by) return NextResponse.json({ ok: true, skipped: true });
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(project.submitted_by);
      if (!user?.email) return NextResponse.json({ ok: true, skipped: true });
      const name = user.user_metadata?.display_name ?? user.email.split("@")[0];
      const email = statusChangeEmail({ change, projectId: body.projectId, projectTitle: project.title, name });
      const result = await resend.emails.send({ from: FROM, to: user.email, ...email });
      if (result.error) throw new Error(result.error.message);
    } else {
      return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (reservedNotification) {
      await supabaseAdmin
        .from("Projects")
        .update({ submission_notified_at: null })
        .eq("id", reservedNotification.projectId)
        .eq("submission_notified_at", reservedNotification.reservedAt);
    }
    console.error("[notify]", error);
    return NextResponse.json({ error: "Notification failed" }, { status: 500 });
  }
}

function newPostHtml({ projectId, projectTitle, projectBlurb, projectCategory, makers, contact }: {
  projectId: string; projectTitle: string; projectBlurb: string;
  projectCategory: string; makers: string[]; contact: string;
}) {
  return `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0;border-radius:8px">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;color:#9f42d1">MAKE_UOA · NEW SUBMISSION</p>
  <h2 style="margin:0 0 4px;font-size:22px;color:#fff">${escapeHtml(projectTitle)}</h2>
  <p style="margin:0 0 10px;font-size:12px;color:#777">${escapeHtml(projectCategory)} · ${makers.map(escapeHtml).join(", ")}</p>
  <p style="margin:0 0 20px;font-size:12px;color:#aaa">Contact: ${escapeHtml(contact)}</p>
  <p style="margin:0 0 28px;color:#bbb;line-height:1.6">${escapeHtml(projectBlurb)}</p>
  <a href="${BASE_URL}/admin" style="display:inline-block;padding:10px 22px;background:#9f42d1;color:#fff;text-decoration:none;border-radius:4px;font-size:13px">Review in admin →</a>
  <span style="display:none">${escapeHtml(projectId)}</span>
</div>`;
}

function statusChangeEmail({ change, projectId, projectTitle, name }: {
  change: "approved" | "rejected" | "featured"; projectId: string; projectTitle: string; name: string;
}) {
  const title = escapeHtml(projectTitle);
  const safeName = escapeHtml(name);
  const viewUrl = `${BASE_URL}/projects/${encodeURIComponent(projectId)}`;
  if (change === "approved") return {
    subject: `Your project "${projectTitle}" is now live!`,
    html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0"><h2 style="color:#fff">Your project is live!</h2><p>Hey ${safeName}, <strong>${title}</strong> has been approved.</p><a href="${viewUrl}" style="color:#8ba7ff">View your project →</a></div>`,
  };
  if (change === "rejected") return {
    subject: `Update on your project "${projectTitle}"`,
    html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0"><h2 style="color:#fff">Project not approved</h2><p>Hey ${safeName}, <strong>${title}</strong> has not been approved at this time. Contact the Makers Club team if you have questions.</p></div>`,
  };
  return {
    subject: `★ "${projectTitle}" has been featured!`,
    html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0"><h2 style="color:#fff">Your project is featured!</h2><p>Hey ${safeName}, <strong>${title}</strong> has been selected as a featured project.</p><a href="${viewUrl}" style="color:#f04ab9">View your project →</a></div>`,
  };
}
