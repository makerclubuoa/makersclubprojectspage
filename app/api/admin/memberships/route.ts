import { NextRequest, NextResponse } from "next/server";
import { upsertGhostMember } from "@/lib/ghost-admin";
import {
  currentMembershipYear,
  isEngageEligible,
  membershipYearLabel,
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

  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select([
      "id", "email", "display_name", "membership_joined_at", "membership_updated_at",
      "membership_year", "membership_consent_version", "membership_consented_at", "upi",
      "student_id", "study_years_remaining", "study_years_as_of_year", "faculty",
      "graduating_this_year", "skills_to_share", "ghost_member_id", "membership_sync_status",
      "membership_sync_error", "engage_status", "engage_status_year", "engage_invited_at",
      "engage_eligible_until_year",
    ].join(","))
    .order("membership_updated_at", { ascending: false, nullsFirst: false })
    .limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: profiles ?? [] });
}

type AdminAction =
  | {
      action: "set_engage_status";
      profile_ids: string[];
      year: number;
      status: "queued" | "invited" | "joined";
    }
  | { action: "retry_member_sync"; profile_id: string };

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: AdminAction;
  try {
    body = (await req.json()) as AdminAction;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "set_engage_status") {
    const ids = [...new Set((body.profile_ids ?? []).map(id => String(id).trim()))]
      .filter(Boolean)
      .slice(0, 500);
    const year = Number(body.year);
    if (
      !ids.length
      || !Number.isInteger(year)
      || year < 2020
      || year > 2100
      || !["queued", "invited", "joined"].includes(body.status)
    ) {
      return NextResponse.json({ error: "Invalid invitation update" }, { status: 400 });
    }

    const { data: candidates, error: candidateError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, engage_eligible_until_year")
      .in("id", ids);
    if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 });
    const eligibleIds = (candidates ?? [])
      .filter(profile =>
        typeof profile.email === "string"
        && isEngageEligible(profile.email)
        && (profile.engage_eligible_until_year == null || profile.engage_eligible_until_year >= year),
      )
      .map(profile => profile.id);
    if (!eligibleIds.length) {
      return NextResponse.json({ error: "No selected profiles are Engage-eligible for that year" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({
        engage_status: body.status,
        engage_status_year: year,
        engage_invited_at: body.status === "queued" ? null : new Date().toISOString(),
      })
      .in("id", eligibleIds)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
  }

  if (body.action === "retry_member_sync") {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, faculty, membership_year")
      .eq("id", body.profile_id)
      .maybeSingle();
    if (profileError || !profile?.email) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
