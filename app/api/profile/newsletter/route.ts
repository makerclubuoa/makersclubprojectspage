import { NextRequest, NextResponse } from "next/server";
import {
  getGhostNewsletterSubscription,
  setGhostNewsletterSubscription,
} from "@/lib/ghost-admin";
import { userFromRequest } from "@/lib/server-auth";
import { serverEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

const newsletterName = () => serverEnv("GHOST_NEWSLETTER_NAME") ?? "UoA Maker Club";

export async function GET(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const subscription = await getGhostNewsletterSubscription(
      user.email.toLowerCase(),
      newsletterName(),
    );
    return NextResponse.json(subscription, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[profile-newsletter] lookup", error);
    return NextResponse.json({ error: "Newsletter preference could not be loaded." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { subscribed?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.subscribed !== "boolean") {
    return NextResponse.json({ error: "Choose a newsletter preference." }, { status: 400 });
  }

  try {
    const subscribed = await setGhostNewsletterSubscription(
      user.email.toLowerCase(),
      newsletterName(),
      body.subscribed,
    );
    return NextResponse.json({ subscribed });
  } catch (error) {
    console.error("[profile-newsletter] update", error);
    return NextResponse.json({ error: "Newsletter preference could not be saved." }, { status: 502 });
  }
}

