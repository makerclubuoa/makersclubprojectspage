import { NextRequest, NextResponse } from "next/server";
import { currentMembershipYear } from "@/lib/membership";
import { userFromRequest } from "@/lib/server-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as { study_years_remaining?: unknown } | null;
  const years = body?.study_years_remaining;
  if (years !== null && (!Number.isInteger(years) || (years as number) < 0 || (years as number) > 20)) {
    return NextResponse.json({ error: "Choose between 0 and 20 years, or select not currently studying." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("membership_year")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile?.membership_year) {
    return NextResponse.json({ error: "Join Maker Club before updating membership study details." }, { status: 409 });
  }

  const studyYears = years === null ? null : years as number;
  const asOfYear = studyYears == null ? null : currentMembershipYear();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({
      study_years_remaining: studyYears,
      study_years_as_of_year: asOfYear,
      expected_graduation_year: studyYears == null ? null : asOfYear! + Math.max(0, studyYears - 1),
      membership_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("study_years_remaining, study_years_as_of_year, expected_graduation_year")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
