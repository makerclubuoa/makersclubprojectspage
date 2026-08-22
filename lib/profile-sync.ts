import { supabaseAdmin } from "@/lib/supabase-server";

type ProfileSyncInput = {
  email: string;
  displayName: string;
  previousEmail?: string | null;
};

async function findProfile(email: string) {
  return supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
}

/**
 * Idempotently creates or updates the website identity derived from Ghost.
 * The profiles trigger creates the row when the Auth user is created.
 */
export async function syncMemberProfile(input: ProfileSyncInput): Promise<string> {
  const email = input.email.trim().toLowerCase();
  const previousEmail = input.previousEmail?.trim().toLowerCase();
  const displayName = input.displayName.trim() || email.split("@")[0];

  const [{ data: current, error: currentError }, { data: previous, error: previousError }] =
    await Promise.all([
      findProfile(email),
      previousEmail && previousEmail !== email
        ? findProfile(previousEmail)
        : Promise.resolve({ data: null, error: null }),
    ]);
  if (currentError) throw new Error(`Profile lookup failed: ${currentError.message}`);
  if (previousError) throw new Error(`Previous profile lookup failed: ${previousError.message}`);
  if (current && previous && current.id !== previous.id) {
    throw new Error("Email change conflicts with an existing account");
  }

  const existing = current ?? previous;
  if (existing) {
    if (!current && previous) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        email,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });
      if (error) throw new Error(`Account email sync failed: ${error.message}`);
    }
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ email, display_name: displayName })
      .eq("id", existing.id);
    if (error) throw new Error(`Profile sync failed: ${error.message}`);
    return existing.id;
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (createError || !created.user) {
    // A simultaneous Ghost webhook can win the creation race. Give its profile
    // trigger a brief chance to finish, then treat that user as the same member.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data: raced } = await findProfile(email);
      if (raced) {
        const { error: racedUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", raced.id);
        if (racedUpdateError) {
          throw new Error(`Profile sync failed: ${racedUpdateError.message}`);
        }
        return raced.id;
      }
    }
    throw new Error(`Member account creation failed: ${createError?.message ?? "unknown error"}`);
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ email, display_name: displayName })
    .eq("id", created.user.id);
  if (profileError) throw new Error(`Profile sync failed: ${profileError.message}`);
  return created.user.id;
}
