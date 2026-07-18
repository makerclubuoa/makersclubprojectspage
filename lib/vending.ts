import "server-only";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { VendingTag, type VendableProduct, type QueueItem } from "@/lib/vending-shared";

export * from "@/lib/vending-shared";

// The original SvelteKit vending app (vend.makeuoa.nz) stays deployed: the
// physical machine polls its queue API, and its Redis instance backs the
// free-item queue. Anything Redis-backed is reached through its public
// endpoints rather than reimplemented here.
export const LEGACY_VEND_URL = (
  process.env.VENDING_LEGACY_URL ?? "https://vend.makeuoa.nz"
).replace(/\/$/, "");

export function getPrice(product: Stripe.Product): number | null {
  const price = product.default_price;
  if (!price || typeof price === "string") return 0;
  if (price.unit_amount === null) return null;
  return price.unit_amount / 100;
}

export async function getVendableProducts(
  showUnstocked = false,
): Promise<VendableProduct[]> {
  const all = await stripe.products.search({
    query: `${showUnstocked ? "" : "active:'true' AND "}metadata['vendable']:'true'`,
    limit: 100,
    expand: ["data.default_price"],
  });

  const vendable = all.data.filter((product) => {
    const isFree = getPrice(product) === 0;
    const hasLink = product.metadata.link !== null;
    const stock = parseInt(product.metadata.stock);
    const inStock = stock > 0 || isNaN(stock);
    return (
      product.metadata.vendable === "true" &&
      (isFree || hasLink) &&
      (inStock || showUnstocked)
    );
  });

  const unsorted = vendable.map((product) => {
    const tags = Object.entries(product.metadata)
      .filter(
        ([key, value]) =>
          value === "true" && Object.keys(VendingTag).includes(key),
      )
      .map(([key]) => VendingTag[key as keyof typeof VendingTag]);
    const stock = parseInt(product.metadata.stock);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: getPrice(product),
      image: product.images[0],
      shelf_loc: product.metadata.shelf_loc,
      indicator: product.metadata.indicator,
      stock: isNaN(stock) ? undefined : stock,
      tags,
      active: product.active,
    } as VendableProduct;
  });

  return unsorted
    .sort((a, b) => a.shelf_loc?.localeCompare(b.shelf_loc))
    .reduceRight((acc: VendableProduct[], prod) => {
      // Featured first
      if (prod.tags.includes(VendingTag.featured)) return [prod, ...acc];
      return [...acc, prod];
    }, []);
}

/* ── Dispense queue (via the legacy app) ───────────────────────────────── */

// The legacy machine API returns paid (Stripe payment-intent) and free
// (Redis) queue items merged; payment intents are recognisable by their pi_
// prefix. Names for free items are resolved against the product list.
export async function getQueue(
  products?: VendableProduct[],
): Promise<QueueItem[]> {
  const res = await fetch(`${LEGACY_VEND_URL}/api/auth/queue`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Legacy queue fetch failed (${res.status})`);
  const items = (await res.json()) as Omit<QueueItem, "free" | "product_name">[];

  const paidIds = items.filter((i) => i.id.startsWith("pi_")).map((i) => i.id);
  const names = new Map<string, string>();
  if (paidIds.length > 0) {
    const intents = await stripe.paymentIntents.list({ limit: 100 });
    for (const pi of intents.data) {
      if (pi.metadata.product_name) names.set(pi.id, pi.metadata.product_name);
    }
  }

  return items.map((item) => {
    const free = !item.id.startsWith("pi_");
    return {
      ...item,
      free,
      product_name: free
        ? products?.find((p) => p.id === item.product_id)?.name
        : names.get(item.id),
    };
  });
}

// Complete = the legacy endpoint the machine itself calls: captures the
// payment (or clears the Redis entry) and sends the Discord notifications.
export async function completeQueueItem(
  id: string,
): Promise<{ success: boolean }> {
  const res = await fetch(
    `${LEGACY_VEND_URL}/api/auth/complete/${encodeURIComponent(id)}`,
    { method: "POST" },
  );
  if (!res.ok) return { success: false };
  return (await res.json()) as { success: boolean };
}

// Cancel has no public legacy endpoint, but for paid items it is pure Stripe.
export async function cancelQueueItem(
  id: string,
): Promise<{ success: boolean }> {
  const intent = await stripe.paymentIntents.cancel(id);
  return { success: intent.status === "canceled" };
}

// A GET on the legacy checkout route for a free-priced product enqueues it in
// the legacy Redis free queue as a side effect. `redirect: "manual"` skips
// following its redirect — only the enqueue matters here.
export async function enqueueFreeItem(productId: string): Promise<void> {
  const res = await fetch(
    `${LEGACY_VEND_URL}/checkout/${encodeURIComponent(productId)}`,
    { redirect: "manual" },
  );
  // SvelteKit answers the enqueue with a 303 to its success page.
  if (res.status !== 303 && !res.ok) {
    throw new Error(`Legacy free-item enqueue failed (${res.status})`);
  }
}

/* ── Discord (optional) ────────────────────────────────────────────────── */

// Community "sold out" ping, matching the legacy success page. Plain webhook
// POST — no SDK needed. Silently skipped when the env var is absent.
export async function notifyCommunity(message: string): Promise<void> {
  const url = process.env.DISCORD_COMMUNITY_WEBHOOK;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, username: "Vending Machine" }),
    });
  } catch {
    // Notification failures must never break checkout.
  }
}
