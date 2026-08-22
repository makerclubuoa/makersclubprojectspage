import { NextRequest, NextResponse } from "next/server";
import { findGhostMember } from "@/lib/ghost-admin";
import { syncMemberProfile } from "@/lib/profile-sync";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Account status could not be checked." }, { status: 500 });
  }
  if (profile) {
    return NextResponse.json(
      { exists: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const ghostMember = await findGhostMember(email);
    if (!ghostMember) {
      return NextResponse.json(
        { exists: false },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    // Ghost is the member source of truth. Repair a missing website account
    // before sending the returning member through the normal magic-link login.
    await syncMemberProfile({
      email,
      displayName: ghostMember.name || email.split("@")[0],
    });
    return NextResponse.json(
      { exists: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (lookupError) {
    console.error("[account-status] Ghost lookup", lookupError);
    return NextResponse.json({ error: "Account status could not be checked." }, { status: 502 });
  }
}
