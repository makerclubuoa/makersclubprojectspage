import { supabase } from "@/lib/supabase";

// No `email` field — by design. /api/profiles/search matches on the address
// server-side and never sends it back, so nothing in the browser can read or
// leak another member's email. `matched_email` is the substitute the picker uses
// to say "this is the account behind the address you typed".
export type CoMakerSearchProfile = {
  id: string;
  display_name: string;
  public_name: string | null;
  name_preference: string | null;
  credit_consented: boolean;
  matched_email: boolean;
};

export async function searchCoMakerProfiles(
  query: string,
  signal?: AbortSignal,
): Promise<CoMakerSearchProfile[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in again to search for co-makers.");

  const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(query.trim())}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
    signal,
  });
  const body = await response.json() as { profiles?: CoMakerSearchProfile[]; error?: string };
  if (!response.ok) throw new Error(body.error || "Co-maker search failed.");
  return body.profiles ?? [];
}
