import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { userFromRequest } from "@/lib/server-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

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
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Reporting is not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null) as { comment_id?: unknown } | null;
  if (!body || typeof body.comment_id !== "string") {
    return NextResponse.json({ error: "Missing comment ID" }, { status: 400 });
  }

  const { data: comment } = await supabaseAdmin
    .from("comments")
    .select("id, project_id, author_name, body")
    .eq("id", body.comment_id)
    .single();
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const { data: project } = await supabaseAdmin
    .from("Projects")
    .select("title")
    .eq("id", comment.project_id)
    .single();

  const { error: reserveError } = await supabaseAdmin.from("comment_reports").insert({
    comment_id: comment.id,
    reporter_id: user.id,
  });
  if (reserveError?.code === "23505") {
    return NextResponse.json({ ok: true, alreadyReported: true });
  }
  if (reserveError) return NextResponse.json({ error: "Could not record report" }, { status: 500 });

  const result = await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `Comment reported on "${project?.title ?? comment.project_id}"`,
      html: `<div style="font-family:monospace;max-width:580px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e0e0e0">
  <h2 style="color:#fff">A comment has been flagged for review</h2>
  <p>Project: ${escapeHtml(project?.title ?? comment.project_id)}</p>
  <p>Comment ID: ${escapeHtml(comment.id)}</p>
  <p>Author: ${escapeHtml(comment.author_name)}</p>
  <p style="border-left:2px solid #555;padding-left:12px">${escapeHtml(comment.body)}</p>
  <a href="${BASE_URL}/projects/${encodeURIComponent(comment.project_id)}" style="color:#ff7a9f">View project →</a>
</div>`,
  });
  if (result.error) {
    await supabaseAdmin.from("comment_reports").delete()
      .eq("comment_id", comment.id).eq("reporter_id", user.id);
    return NextResponse.json({ error: "Failed to send report" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
