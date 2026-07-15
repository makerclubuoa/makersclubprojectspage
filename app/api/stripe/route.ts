import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
export async function GET(_req: NextRequest) {
  try {
    const products = await stripe.products.list({ limit: 100 });
    if (products.data.length === 0) return null;
    let randomIndex = Math.floor(Math.random() * products.data.length);
    let randomProduct = products.data[randomIndex];
    while (randomProduct.images.length === 0) {
      randomIndex = Math.floor(Math.random() * products.data.length);
      randomProduct = products.data[randomIndex];
    }
    return NextResponse.json({
      name: randomProduct.name,
      src: randomProduct.images[0],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
