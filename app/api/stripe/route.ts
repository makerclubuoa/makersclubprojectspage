import { NextRequest, NextResponse } from "next/server";
import { getRandomProduct } from "@/lib/stripe";

export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json(await getRandomProduct());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load products.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
