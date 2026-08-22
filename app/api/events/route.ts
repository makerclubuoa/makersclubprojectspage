import { NextRequest, NextResponse } from "next/server";
import { getPastEvents } from "@/lib/ghost/events";

export const dynamic = "force-dynamic";

function boundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const offset = boundedInteger(request.nextUrl.searchParams.get("offset"), 12, 1, 100);
  const page = boundedInteger(request.nextUrl.searchParams.get("page"), 1, 1, 1000);
  return NextResponse.json(await getPastEvents(offset, page));
}
