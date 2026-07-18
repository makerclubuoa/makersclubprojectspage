import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { getPrice, notifyCommunity } from "@/lib/vending";
import {
  submitSuccess,
  submitSuccessIcon,
  submitSuccessH2,
  submitSuccessP,
  btnGradient,
} from "@/lib/ui";

export default async function VendingSuccessPage({
  params,
}: {
  params: Promise<{ id: string; session?: string[] }>;
}) {
  const { id, session: sessionParam } = await params;
  const checkoutId = sessionParam?.[0];

  const product = await stripe.products.retrieve(id, {
    expand: ["default_price"],
  });

  let paymentOk = true;
  if (checkoutId) {
    const session = await stripe.checkout.sessions.retrieve(checkoutId, {
      expand: ["payment_intent"],
    });
    const payment =
      typeof session.payment_intent === "string"
        ? undefined
        : session.payment_intent;

    if (
      payment?.status === "requires_capture" ||
      payment?.status === "succeeded"
    ) {
      // Decrement tracked stock once per payment (guarded by the `reserved`
      // flag so refreshing this page can't double-count).
      const quantity = session.metadata?.quantity
        ? parseInt(session.metadata.quantity)
        : 1;
      const stock = parseInt(product.metadata.stock);
      const remainingStock = stock - quantity;
      if (!isNaN(remainingStock) && payment.metadata.reserved !== "true") {
        await stripe.products.update(id, {
          metadata: { stock: remainingStock.toString() },
        });
        if (remainingStock < 1) {
          await notifyCommunity(
            `Product "${product.name}" is now sold out! :partying_face: :partying_face:`,
          );
        }
      }
      await stripe.paymentIntents.update(payment.id, {
        metadata: { reserved: "true" },
      });
    } else {
      paymentOk = false;
    }
  }

  const free = getPrice(product) === 0;

  return (
    <div className="bg-pop-pink min-h-dvh flex items-center justify-center px-5 py-28">
      <div className={`${submitSuccess} max-w-lg w-full`}>
        {paymentOk ? (
          <>
            <div className={submitSuccessIcon}>🎉</div>
            <h2 className={submitSuccessH2}>
              {free ? "Enjoy your free item!" : "Thanks for your purchase!"}
            </h2>
            <p className={submitSuccessP}>
              {free ? (
                <>
                  “{product.name}” will dispense from the vending machine
                  shortly.
                </>
              ) : (
                <>
                  “{product.name}” will dispense from the vending machine
                  shortly. Don&apos;t worry! If the vending machine is
                  disconnected or broken, your payment should expire and you
                  will be refunded.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <div className={submitSuccessIcon}>😕</div>
            <h2 className={submitSuccessH2}>Payment not completed</h2>
            <p className={submitSuccessP}>
              We couldn&apos;t confirm your payment. If you were charged, the
              hold will expire and be refunded automatically.
            </p>
          </>
        )}
        <div className="mt-6">
          <Link href="/vending" className={btnGradient}>
            Back to the menu
          </Link>
        </div>
      </div>
    </div>
  );
}
