import { NextRequest, NextResponse } from "next/server";
import { findGhostMember, upsertGhostMember } from "@/lib/ghost-admin";
import {
  currentMembershipYear,
  isEngageEligible,
  membershipYearLabel,
  MEMBERSHIP_CONSENT_VERSION,
  validateMembershipSignup,
} from "@/lib/membership";
import { syncMemberProfile } from "@/lib/profile-sync";
import { isAdmin, userFromRequest } from "@/lib/server-auth";
import { serverEnv } from "@/lib/server-env";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const authorization = req.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return false;
  const user = await userFromRequest(req);
  return Boolean(user && isAdmin(user));
}

async function verifyTurnstile(
  req: NextRequest,
  token: string | undefined,
  admin: boolean,
): Promise<boolean> {
  const secret = serverEnv("TURNSTILE_SECRET_KEY");
  if (!secret || admin) return true;
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip:
          req.headers.get("cf-connecting-ip") ??
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "",
      }),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("[membership-signup] Turnstile verification", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const validation = validateMembershipSignup(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const input = validation.value;

  if (input.company) return NextResponse.json({ ok: true });
  if (input.started_at && Date.now() - input.started_at < 1_500) {
    return NextResponse.json({ error: "Please try submitting again." }, { status: 400 });
  }

  const admin = await isAdminRequest(req);
  if (!(await verifyTurnstile(req, input.turnstile_token, admin))) {
    return NextResponse.json(
      { error: "Please complete the verification and try again." },
      { status: 400 },
    );
  }

  if (!admin) {
    const confirmEmail = typeof (body as Record<string, unknown>).confirm_email === "string"
      ? String((body as Record<string, unknown>).confirm_email).trim().toLowerCase()
      : "";
    if (confirmEmail !== input.email) {
      return NextResponse.json({ error: "The email addresses do not match." }, { status: 400 });
    }

    const { data: existingAccount, error: existingAccountError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", input.email)
      .maybeSingle();
    if (existingAccountError) {
      console.error("[membership-signup] existing account lookup", existingAccountError);
      return NextResponse.json({ error: "Registration could not be checked." }, { status: 500 });
    }
    if (existingAccount) {
      return NextResponse.json(
        { error: "An account already exists for this email. Sign in instead." },
        { status: 409 },
      );
    }

    try {
      const ghostMember = await findGhostMember(input.email);
      if (ghostMember) {
        // Repair the website side before routing this existing Ghost member to
        // sign in. This keeps the same email from becoming a second identity.
        await syncMemberProfile({
          email: input.email,
          displayName: ghostMember.name || input.full_name,
        });
        return NextResponse.json(
          { error: "An account already exists for this email. Sign in instead." },
          { status: 409 },
        );
      }
    } catch (ghostLookupError) {
      console.error("[membership-signup] Ghost account lookup", ghostLookupError);
      return NextResponse.json({ error: "Registration could not be checked." }, { status: 502 });
    }
  }

  const requestedYear = Number((body as Record<string, unknown>).membership_year);
  const membershipYear =
    admin && Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100
      ? requestedYear
      : currentMembershipYear();
  const now = new Date().toISOString();

  let profileId: string;
  try {
    profileId = await syncMemberProfile({
      email: input.email,
      displayName: input.full_name,
    });
  } catch (error) {
    console.error("[membership-signup] profile creation", error);
    return NextResponse.json(
      { error: "Your website profile could not be created. Please try again." },
      { status: 502 },
    );
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("membership_joined_at, engage_status, engage_status_year, engage_invited_at, engage_eligible_until_year")
    .eq("id", profileId)
    .single();
  if (lookupError) {
    console.error("[membership-signup] membership profile lookup", lookupError);
    return NextResponse.json({ error: "Your membership could not be saved." }, { status: 500 });
  }

  const engageEligible = isEngageEligible(input.email);
  const eligibleUntilYear = engageEligible
    ? input.study_years == null
      ? existing.engage_eligible_until_year
      : membershipYear + input.study_years - 1
    : null;
  const sameYearEngageStatus = existing.engage_status_year === membershipYear
    ? existing.engage_status
    : null;

  const { error: membershipError } = await supabaseAdmin
    .from("profiles")
    .update({
      display_name: input.full_name,
      membership_joined_at: existing.membership_joined_at ?? now,
      membership_updated_at: now,
      membership_year: membershipYear,
      membership_consent_version: MEMBERSHIP_CONSENT_VERSION,
      membership_consented_at: now,
      upi: input.upi === "NONE" ? null : input.upi,
      student_id: input.student_id === "NONE" ? null : input.student_id,
      study_years_remaining: input.study_years,
      study_years_as_of_year: input.study_years == null ? null : membershipYear,
      faculty: input.faculty === "NONE" ? null : input.faculty,
      expected_graduation_year:
        input.study_years == null ? null : membershipYear + input.study_years - 1,
      interests_to_gain: input.interests_to_gain || null,
      skills_to_share: input.skills_to_share || null,
      membership_sync_status: "pending",
      membership_sync_error: null,
      membership_email_confirmed_at: admin ? now : null,
      engage_status: engageEligible ? (sameYearEngageStatus ?? "queued") : null,
      engage_status_year: engageEligible ? membershipYear : null,
      engage_invited_at:
        engageEligible && sameYearEngageStatus && sameYearEngageStatus !== "queued"
          ? existing.engage_invited_at
          : null,
      engage_eligible_until_year: eligibleUntilYear,
    })
    .eq("id", profileId);
  if (membershipError) {
    console.error("[membership-signup] membership profile update", membershipError);
    return NextResponse.json({ error: "Your membership could not be saved." }, { status: 500 });
  }

  // Public registrations remain pending until the emailed magic link is used.
  // AuthProvider then calls /api/auth/ensure-ghost with the confirmed session,
  // which activates Ghost and the newsletter without trusting an unverified address.
  if (!admin) {
    return NextResponse.json({
      ok: true,
      membership_year: membershipYear,
      engage_eligible: engageEligible,
      confirmation_required: true,
    });
  }

  try {
    const member = await upsertGhostMember({
      email: input.email,
      name: input.full_name,
      note: input.faculty === "NONE" ? "" : input.faculty,
      label: membershipYearLabel(membershipYear),
      newsletterName: serverEnv("GHOST_NEWSLETTER_NAME") ?? "UoA Maker Club",
    });
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        ghost_member_id: member.id || null,
        membership_sync_status: "synced",
        membership_sync_error: null,
      })
      .eq("id", profileId);
    if (error) console.error("[membership-signup] final sync status", error);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ghost sync failed";
    console.error("[membership-signup] Ghost sync", error);
    await supabaseAdmin
      .from("profiles")
      .update({ membership_sync_status: "failed", membership_sync_error: message.slice(0, 1000) })
      .eq("id", profileId);
    return NextResponse.json(
      {
        error:
          "Your profile was created, but Ghost membership could not be activated. Please try again or contact hello@makeuoa.nz.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    membership_year: membershipYear,
    engage_eligible: engageEligible,
  });
}
