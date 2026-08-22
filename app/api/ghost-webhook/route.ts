import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { syncMemberProfile } from "@/lib/profile-sync";
import { serverEnv } from "@/lib/server-env";
import { deleteSupabaseAccount } from "@/lib/account-deletion";
import { supabaseAdmin } from "@/lib/supabase-server";

function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = header.split(",").map(part => part.trim());
  const signaturePart = parts.find(part => part.startsWith("sha256="));
  const timestampPart = parts.find(part => part.startsWith("t="));
  if (!signaturePart || !timestampPart) return false;

  const received = signaturePart.slice(7);
  const timestamp = timestampPart.slice(2);
  const numericTimestamp = Number(timestamp);
  if (!Number.isFinite(numericTimestamp)) return false;
  const timestampMs = numericTimestamp > 10_000_000_000
    ? numericTimestamp
    : numericTimestamp * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;

  const expected = createHmac("sha256", secret).update(`${body}${timestamp}`).digest("hex");
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const secret = serverEnv("GHOST_WEBHOOK_SECRET");
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }
  if (!verifySignature(body, req.headers.get("x-ghost-signature"), secret)) {
    return NextResponse.json({ error: "Invalid or stale signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const memberData = event.member as {
    current?: Record<string, string> | null;
    previous?: Record<string, string> | null;
  } | undefined;
  if (!memberData) return NextResponse.json({ ok: true });

  const current = memberData.current;
  const previous = memberData.previous;
  if (current?.email) {
    const email = current.email.toLowerCase();
    try {
      await syncMemberProfile({
        email,
        displayName: current.name || email.split("@")[0],
        previousEmail: previous?.email,
      });
    } catch (error) {
      console.error("[ghost-webhook] profile sync", error);
      return NextResponse.json({ error: "Member sync failed" }, { status: 500 });
    }
  } else if (previous?.email) {
    const email = previous.email.trim().toLowerCase();
    try {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (error) throw error;
      if (profile?.id) await deleteSupabaseAccount(profile.id);
      console.log("[ghost-webhook] member deleted everywhere:", email);
    } catch (error) {
      console.error("[ghost-webhook] member deletion", error);
      return NextResponse.json({ error: "Member deletion failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
