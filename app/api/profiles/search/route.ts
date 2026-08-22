import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { userFromRequest } from "@/lib/server-auth";

const PROFILE_FIELDS = "id, display_name, email, public_name, name_preference, credit_consented";

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  public_name: string | null;
  name_preference: string | null;
  credit_consented: boolean | null;
};

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (!query) return NextResponse.json({ profiles: [] });

  const pattern = `%${query}%`;
  const searches = await Promise.all([
    supabaseAdmin.from("profiles").select(PROFILE_FIELDS).ilike("display_name", pattern).neq("id", user.id).limit(6),
    supabaseAdmin.from("profiles").select(PROFILE_FIELDS).ilike("public_name", pattern).neq("id", user.id).limit(6),
    supabaseAdmin.from("profiles").select(PROFILE_FIELDS).ilike("email", pattern).neq("id", user.id).limit(6),
  ]);
  const failed = searches.find(result => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: "Profile search failed" }, { status: 500 });
  }

  const unique = new Map<string, ProfileRow>();
  for (const result of searches) {
    for (const row of (result.data ?? []) as ProfileRow[]) unique.set(row.id, row);
  }
  const profiles = [...unique.values()].slice(0, 6).map(profile => ({
    ...profile,
    display_name: profile.display_name || profile.email?.split("@")[0] || "Member",
    credit_consented: profile.credit_consented ?? false,
  }));

  return NextResponse.json(
    { profiles },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
