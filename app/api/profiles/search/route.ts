import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { userFromRequest } from "@/lib/server-auth";

// `email` is selected but never returned. Matching on it is the whole point of
// the picker — "add the friend whose address I know" — and it happens here,
// under the service-role client. The response carries names, consent flags and
// `matched_email`; the address itself does not cross the network.
const PROFILE_FIELDS =
  "id, display_name, email, public_name, name_preference, credit_consented";

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  public_name: string | null;
  name_preference: string | null;
  credit_consented: boolean | null;
};

// A `%q%` email search turns this route into an address book: one signed-in user
// typing a shared domain would match every member who uses it. Matching anchored
// at the start of the address — exact once an `@` is present — means you have to
// already know the address to find it by address.
const MIN_EMAIL_QUERY = 3;

// `%` and `_` are ILIKE wildcards. Left raw, `a_` would match `ab`, `ac`, … and
// widen the search back out into enumeration.
function likeEscape(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = req.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (!query) return NextResponse.json({ profiles: [] });

  const namePattern = `%${query}%`;
  const rows = () =>
    supabaseAdmin.from("profiles").select(PROFILE_FIELDS).neq("id", user.id).limit(6);

  // No wildcard once the query contains `@`: a whole address matches itself and
  // nothing else.
  const emailPattern = query.includes("@")
    ? likeEscape(query)
    : `${likeEscape(query)}%`;
  const emailSearchable = query.length >= MIN_EMAIL_QUERY;

  const [byDisplayName, byPublicName, byEmail] = await Promise.all([
    rows().ilike("display_name", namePattern),
    rows().ilike("public_name", namePattern),
    emailSearchable
      ? rows().ilike("email", emailPattern)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
  ]);

  const searches = [byDisplayName, byPublicName, byEmail];
  if (searches.some((result) => result.error)) {
    return NextResponse.json({ error: "Profile search failed" }, { status: 500 });
  }

  // Which bucket a row came from is the only email-derived fact that leaves the
  // server, and it confirms nothing the searcher did not just type in.
  const emailMatches = new Set(
    ((byEmail.data ?? []) as ProfileRow[]).map((row) => row.id),
  );
  const unique = new Map<string, ProfileRow>();
  for (const result of searches) {
    for (const row of (result.data ?? []) as ProfileRow[]) unique.set(row.id, row);
  }

  const profiles = [...unique.values()].slice(0, 6).map((profile) => ({
    id: profile.id,
    // The fallback used to be the email's local part, which leaked the half of
    // the address that identifies the person.
    display_name: profile.display_name || profile.public_name || "Member",
    public_name: profile.public_name,
    name_preference: profile.name_preference,
    credit_consented: profile.credit_consented ?? false,
    matched_email: emailMatches.has(profile.id),
  }));

  return NextResponse.json(
    { profiles },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
