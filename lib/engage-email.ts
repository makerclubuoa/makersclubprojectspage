import { Resend } from "resend";
import { serverEnv } from "@/lib/server-env";
import { supabaseAdmin } from "@/lib/supabase-server";

const ENGAGE_URL = "https://auckland.campuslabs.com/engage/organization/makerclub";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]!);
}

/** Sends one Engage link to confirmed UoA signups, with a DB reservation to prevent repeats. */
export async function sendEngageEmailOnce(input: {
  profileId: string;
  email: string;
  name: string;
  membershipYear: number;
}): Promise<boolean> {
  if (!input.email.toLowerCase().endsWith("@aucklanduni.ac.nz")) return false;
  const apiKey = serverEnv("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const reservedAt = new Date().toISOString();
  const { data: reservation, error: reservationError } = await supabaseAdmin
    .from("profiles")
    .update({ engage_welcome_sent_at: reservedAt })
    .eq("id", input.profileId)
    .is("engage_welcome_sent_at", null)
    .select("id")
    .maybeSingle();
  if (reservationError) throw new Error(`Engage email reservation failed: ${reservationError.message}`);
  if (!reservation) return false;

  try {
    const resend = new Resend(apiKey);
    const name = input.name || input.email.split("@")[0];
    const result = await resend.emails.send({
      from: serverEnv("RESEND_FROM") ?? "MAKE_UOA <noreply@makeuoa.nz>",
      to: input.email,
      subject: "One last step: join Maker Club on Engage",
      html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#f7f2e8;color:#111;border:3px solid #111">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#7542d8">UOA MAKER CLUB · ${input.membershipYear}</p>
        <h1 style="margin:0 0 18px;font-size:28px">You&rsquo;re in, ${escapeHtml(name)}!</h1>
        <p style="font-size:16px;line-height:1.6">Your Maker Club membership is active. Use the button below to join our official University of Auckland Engage page too.</p>
        <p style="margin:28px 0"><a href="${ENGAGE_URL}" style="display:inline-block;padding:13px 20px;background:#7542d8;color:#fff;text-decoration:none;font-weight:700;border:2px solid #111">Join Maker Club on Engage →</a></p>
        <p style="font-size:13px;line-height:1.6;color:#555">Engage is managed by the University of Auckland. You may be asked to sign in with your university account.</p>
      </div>`,
      text: `Hi ${name},\n\nYour Maker Club membership is active. Join our official University of Auckland Engage page here:\n${ENGAGE_URL}\n`,
    }, {
      idempotencyKey: `engage-welcome/${input.profileId}/${input.membershipYear}`,
    });
    if (result.error) throw new Error(result.error.message);
    return true;
  } catch (error) {
    await supabaseAdmin
      .from("profiles")
      .update({ engage_welcome_sent_at: null })
      .eq("id", input.profileId)
      .eq("engage_welcome_sent_at", reservedAt);
    throw error;
  }
}
