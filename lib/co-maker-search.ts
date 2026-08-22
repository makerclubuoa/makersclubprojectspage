import { supabase } from "@/lib/supabase";

export type CoMakerSearchProfile = {
  id: string;
  display_name: string;
  email: string | null;
  public_name: string | null;
  name_preference: string | null;
  credit_consented: boolean;
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
