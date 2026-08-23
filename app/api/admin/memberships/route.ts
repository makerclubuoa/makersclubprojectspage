import { NextRequest, NextResponse } from "next/server";
import { deleteGhostMember, upsertGhostMember } from "@/lib/ghost-admin";
import { deleteSupabaseAccount } from "@/lib/account-deletion";
import {
  currentMembershipYear,
  membershipYearLabel,
  type MembershipProfile,
} from "@/lib/membership";
import { isAdmin, userFromRequest } from "@/lib/server-auth";
import { serverEnv } from "@/lib/server-env";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const user = await userFromRequest(req);
  return user && isAdmin(user) ? user : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const columns = [
    "id", "email", "display_name", "membership_joined_at", "membership_updated_at",
    "membership_year", "membership_consent_version", "membership_consented_at", "upi",
    "membership_email_confirmed_at",
    "student_id", "study_years_remaining", "study_years_as_of_year", "faculty",
    "expected_graduation_year", "interests_to_gain",
    "skills_to_share", "ghost_member_id", "membership_sync_status",
    "membership_sync_error",
  ].join(",");
  const profiles: MembershipProfile[] = [];
  const batchSize = 1000;

  // Supabase applies its configured maximum-row limit to every REST request,
  // even when a larger .limit() is requested. Read successive ranges so the
  // admin view and its client-side pagination receive the complete directory.
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(columns)
      .order("membership_updated_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(offset, offset + batchSize - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const batch = (data ?? []) as unknown as MembershipProfile[];
    profiles.push(...batch);
    if (batch.length < batchSize) break;
  }

  return NextResponse.json({ profiles });
}

type AdminAction =
  | { action: "retry_member_sync"; profile_id: string }
  | { action: "delete_member"; profile_id: string; confirmation: "DELETE" };

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: AdminAction;
  try {
    body = (await req.json()) as AdminAction;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "retry_member_sync") {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, faculty, membership_year, membership_email_confirmed_at")
      .eq("id", body.profile_id)
      .maybeSingle();
    if (profileError || !profile?.email) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.membership_year && !profile.membership_email_confirmed_at) {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (!authData.user?.email_confirmed_at) {
        return NextResponse.json({ error: "This member has not confirmed their email yet" }, { status: 409 });
      }
    }

    try {
      const member = await upsertGhostMember({
        email: profile.email,
        name: profile.display_name || profile.email.split("@")[0],
        note: profile.faculty || "",
        label: membershipYearLabel(profile.membership_year ?? currentMembershipYear()),
        newsletterName: serverEnv("GHOST_NEWSLETTER_NAME") ?? "UoA Maker Club",
      });
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          ghost_member_id: member.id || null,
          membership_sync_status: "synced",
          membership_sync_error: null,
          membership_email_confirmed_at:
            profile.membership_email_confirmed_at ?? new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Member sync failed";
      await supabaseAdmin
        .from("profiles")
        .update({ membership_sync_status: "failed", membership_sync_error: message.slice(0, 1000) })
        .eq("id", profile.id);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (body.action === "delete_member") {
    if (body.confirmation !== "DELETE") {
      return NextResponse.json({ error: "Type DELETE to confirm member deletion." }, { status: 400 });
    }
    if (body.profile_id === admin.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account here." }, { status: 400 });
    }
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("id", body.profile_id)
      .maybeSingle();
    if (profileError || !profile?.email) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    try {
      // Match self-service deletion: remove Ghost first, then all website data.
      await deleteGhostMember(profile.email.toLowerCase());
      const result = await deleteSupabaseAccount(profile.id);
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      console.error("[admin-memberships] member deletion", error);
      return NextResponse.json(
        { error: "The member account could not be fully deleted. Nothing shared was deleted; please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
