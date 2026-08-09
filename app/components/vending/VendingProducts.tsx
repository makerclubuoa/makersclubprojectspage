"use client";

import { useState } from "react";
import Image from "next/image";
import {
  VendingTag,
  formatVendPrice,
  type VendableProduct,
} from "@/lib/vending-shared";
import {
  modalBackdrop,
  modal,
  modalLabel,
  modalTitle,
  modalActions,
  btnGhost,
  btnGradient,
  emptyState,
  emptyStateMono,
} from "@/lib/ui";

const SHELF_CHIP =
  "inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border-2 border-black bg-paper-2 text-[10.5px] font-bold tracking-[0.08em] uppercase";
const STICKER =
  "absolute z-10 rounded-full border-2 border-black px-3 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase shadow-[2px_2px_0px_0px_#000]";

type Confirm = { product: VendableProduct; kind: "free" | "headsUp" };

function needsHeadsUp(product: VendableProduct) {
  return (
    product.tags.includes(VendingTag.unique) ||
    product.tags.includes(VendingTag.limited) ||
    product.tags.includes(VendingTag.token)
  );
}

export default function VendingProducts({
  products,
}: {
  products: VendableProduct[];
}) {
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  function checkout(product: VendableProduct) {
    setConfirm(null);
    setRedirecting(true);
    window.location.assign(`/vending/checkout/${product.id}`);
  }

  function purchase(product: VendableProduct) {
    if (product.price === 0) setConfirm({ product, kind: "free" });
    else if (needsHeadsUp(product)) setConfirm({ product, kind: "headsUp" });
    else checkout(product);
  }

  if (products.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5">
        <div className={emptyState}>
          <p className={emptyStateMono}>The machine is being restocked</p>
          <p className="text-sm font-semibold text-ink-2 mt-2 mb-0">
            No items are available right now, check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-8 mx-auto max-w-screen-lg px-5">
        {products.map((product) => (
          // w-full/max-w rather than a hard w-72: 288px plus the row's 40px of
          // padding overflowed a 320px phone and gave the page a sideways scroll.
          <div key={product.id} className="relative w-full max-w-72">
            {product.indicator && (
              <div
                className={`${STICKER} -top-3 -right-2 rotate-3 bg-pop-magenta text-white`}
              >
                {product.indicator}
              </div>
            )}
            {product.tags.includes(VendingTag.featured) && (
              <div
                className={`${STICKER} -top-3 -left-2 -rotate-6 bg-[#ffeb3b] text-black`}
                title="Featured!"
              >
                ★ Featured
              </div>
            )}
            <div
              className={`w-full h-full flex flex-col bg-white outline-solid outline-3 outline-black shadow-[6px_6px_0px_0px_#000] ${
                product.shelf_loc ? "" : "opacity-50 pointer-events-none select-none"
              }`}
            >
              <div className="relative aspect-square border-b-[3px] border-black bg-paper-2 overflow-hidden">
                {product.image && (
                  // Served via the site's image optimizer rather than a direct
                  // files.stripe.com hotlink: same-origin + CDN-cached, which
                  // sidesteps browsers flaking on the Stripe file-link host,
                  // and resizes the full-res upload down to card size.
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 380px) 100vw, 288px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 p-4 flex-1">
                <h3 className="m-0 text-lg font-bold leading-snug">
                  {product.name}
                </h3>
                {product.description && (
                  // Parity with the legacy app, which renders the Stripe
                  // description as HTML (admin-authored content).
                  <p
                    className="m-0 text-[13px] font-medium text-ink-2"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className={SHELF_CHIP}>
                    Shelf {product.shelf_loc || "?"}
                  </span>
                </div>
                <button
                  onClick={() => purchase(product)}
                  className={`${btnGradient} w-full`}
                >
                  {formatVendPrice(product.price)}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirm && (
        <div className={modalBackdrop} onClick={() => setConfirm(null)}>
          <div className={modal} onClick={(e) => e.stopPropagation()}>
            {confirm.kind === "free" ? (
              <>
                <p className={modalLabel}>Free item</p>
                <h3 className={modalTitle}>Dispense free product?</h3>
                <p className="text-sm font-medium text-ink-2 m-0">
                  Are you sure you want to do this? Getting a free product will
                  immediately dispense it from the vending machine.{" "}
                  <strong>
                    We&apos;re relying on good-will to keep these items in the
                    machine
                  </strong>
                  , so make sure you&apos;re by the vending machine before you
                  hit confirm 😊
                </p>
              </>
            ) : (
              <>
                <p className={modalLabel}>Heads up!</p>
                <h3 className={modalTitle}>
                  Before you buy “{confirm.product.name}”
                </h3>
                <p className="text-sm font-medium text-ink-2 m-0">
                  {confirm.product.tags.includes(VendingTag.unique) && (
                    <>
                      This slot dispenses unique or one-off items. What
                      you&apos;re about to buy might not match the photo
                      exactly! Take a quick look in the machine to see what
                      you&apos;re about to get, and to ensure that there&apos;s
                      some left.
                    </>
                  )}
                  {!confirm.product.tags.includes(VendingTag.unique) &&
                    confirm.product.tags.includes(VendingTag.limited) && (
                      <>
                        Before you checkout, take a quick look in the machine to
                        see what you&apos;re about to get, and to ensure that
                        there&apos;s some left!
                      </>
                    )}
                  {confirm.product.tags.includes(VendingTag.token) && (
                    <>
                      {(confirm.product.tags.includes(VendingTag.unique) ||
                        confirm.product.tags.includes(VendingTag.limited)) && (
                        <>
                          <br />
                          <br />
                        </>
                      )}
                      <strong>This item uses our token system!</strong> You will
                      be given a token that you can exchange for the item by
                      asking a CT in the space to swap it for you.
                    </>
                  )}
                </p>
              </>
            )}
            <div className="mt-4 flex items-center justify-between rounded-full border-2 border-black bg-paper-2 px-4 py-1.5">
              <span className="text-[10.5px] font-bold tracking-[0.08em] uppercase">
                Shelf Location
              </span>
              <span className="text-sm font-bold">
                {confirm.product.shelf_loc || "Unknown!"}
              </span>
            </div>
            <div className={modalActions}>
              <button className={btnGhost} onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className={btnGradient}
                onClick={() => checkout(confirm.product)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {redirecting && (
        <div className={modalBackdrop}>
          <div className={`${modal} text-center`}>
            <h3 className={modalTitle}>Redirecting to checkout…</h3>
            <p className="text-sm font-medium text-ink-2 m-0">
              You will be taken to the checkout shortly. We use Stripe for
              payments, and will only charge your card when the machine confirms
              it has given you the item.
            </p>
            <div className="mt-5 h-3 rounded-full border-2 border-black overflow-hidden bg-paper-2">
              <div className="h-full w-full bg-pop-magenta animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
