import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { enqueueFreeItem } from "@/lib/vending";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = req.nextUrl.origin;

  try {
    const product = await stripe.products.retrieve(id);
    let priceID = product.default_price;
    if (!priceID) {
      return new NextResponse("No price found", { status: 500 });
    }
    if (typeof priceID !== "string") priceID = priceID.id;

    const price = await stripe.prices.retrieve(priceID);
    if (price.unit_amount === 0) {
      // Free items dispense immediately: the legacy app's Redis queue is the
      // one the machine polls, so the enqueue goes through it.
      await enqueueFreeItem(id);
      return NextResponse.redirect(
        `${origin}/vending/checkout/${id}/success`,
        303,
      );
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceID, quantity: 1 }],
      mode: "payment",
      // Manual capture: the card is only charged once the machine confirms
      // the item was dispensed (the machine hits the legacy complete API).
      success_url: `${origin}/vending/checkout/${id}/success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vending?cancelled=true`,
      payment_intent_data: {
        capture_method: "manual",
        metadata: {
          product_id: id,
          product_name: product.name,
          vendable: product.metadata.vendable,
          shelf_loc: product.metadata.shelf_loc,
          quantity: 1,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 2,
    });
    if (!session.url) {
      return new NextResponse("No session url found", { status: 500 });
    }
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    return new NextResponse(message, { status: 500 });
  }
}
