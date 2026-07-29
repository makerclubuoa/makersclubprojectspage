import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  VendingTag,
  getPrice,
  getVendableProducts,
  getQueue,
  completeQueueItem,
  cancelQueueItem,
  enqueueFreeItem,
} from "@/lib/vending";

const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "makerclubuoa@gmail.com"
)
  .split(",")
  .map((e) => e.trim());

async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const {
    data: { user },
    error,
  } = await anon.auth.getUser(token);
  if (error || !user || !ADMIN_EMAILS.includes(user.email ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export interface VendingStats {
  completedPayments: number;
  totalValue: number;
  topItems: {
    product_id: string;
    product_name: string;
    count: number;
    total: number;
    actual_total: number;
  }[];
}

// Port of the legacy admin's sales aggregation: succeeded payment intents
// since startDate, with per-product totals and Stripe-fee-adjusted income.
async function computeStats(startDate: Date): Promise<VendingStats> {
  const completed = await stripe.paymentIntents.search({
    query: `status:'succeeded' AND created>${Math.floor(startDate.getTime() / 1000)}`,
    limit: 100,
    expand: ["total_count", "data.latest_charge.balance_transaction"],
  });

  const productCache = new Map<string, Stripe.Product>();
  const getProduct = async (id: string) => {
    if (!productCache.has(id)) {
      productCache.set(
        id,
        await stripe.products.retrieve(id, { expand: ["default_price"] }),
      );
    }
    return productCache.get(id)!;
  };

  const topItems = new Map<string, VendingStats["topItems"][number]>();
  let totalValue = 0;
  for (const payment of completed.data) {
    totalValue += payment.amount / 100;
    const items = payment.metadata.product_id;
    if (!items) continue;
    const ids = items.split(",").filter(Boolean);
    const fee =
      typeof payment.latest_charge !== "string" &&
      typeof payment.latest_charge?.balance_transaction !== "string"
        ? (payment.latest_charge?.balance_transaction?.fee || 0) / 100
        : 0;
    for (const id of ids) {
      const product = await getProduct(id);
      // Multi-item payments attribute each product its own default price.
      const price =
        ids.length > 1 ? (getPrice(product) ?? 0) : payment.amount / 100;
      const entry = topItems.get(id) ?? {
        product_id: id,
        product_name: product.name,
        count: 0,
        total: 0,
        actual_total: 0,
      };
      entry.count++;
      entry.total += price;
      entry.actual_total += price - fee / ids.length;
      topItems.set(id, entry);
    }
  }

  return {
    completedPayments: completed.total_count ?? completed.data.length,
    totalValue,
    topItems: [...topItems.values()].sort((a, b) => b.count - a.count),
  };
}

function resolveStartDate(requested: string | null): Date {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const maxTime = new Date();
  maxTime.setDate(maxTime.getDate() - 365 * 2);
  if (requested && Date.parse(requested)) {
    const parsed = new Date(requested);
    return parsed < maxTime ? maxTime : parsed;
  }
  return startDate;
}

async function snapshot(startDate: Date) {
  const products = await getVendableProducts(true);
  const [queue, stats] = await Promise.all([
    getQueue(products),
    computeStats(startDate),
  ]);
  return { products, queue, stats, startDate: startDate.toISOString() };
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const startDate = resolveStartDate(req.nextUrl.searchParams.get("startDate"));
    return NextResponse.json(await snapshot(startDate));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function saveProduct(data: FormData) {
  const id = data.get("id")?.toString();
  if (!id) throw new Error("Missing product id");

  // Optional replacement image, uploaded to Stripe's file hosting.
  const imageField = data.get("image");
  let image: string | undefined;
  if (
    imageField &&
    imageField instanceof File &&
    imageField.size > 0 &&
    ["image/png", "image/jpeg"].includes(imageField.type)
  ) {
    const imageResponse = await stripe.files.create({
      // The SDK's Purpose union no longer lists product_image, but the API
      // still accepts it (it's the purpose the Stripe Dashboard uploads
      // product photos with, and what the legacy vending admin used).
      purpose: "product_image" as Stripe.FileCreateParams.Purpose,
      file: {
        data: Buffer.from(await imageField.arrayBuffer()),
        name: imageField.name || undefined,
        type: imageField.type,
      },
      file_link_data: { create: true },
    });
    image = imageResponse.links?.data[0].url || undefined;
  }

  const product = await stripe.products.update(id, {
    name: data.get("name")?.toString() || "",
    metadata: {
      ...Object.values(VendingTag).reduce(
        (acc, tag) => ({ ...acc, [tag]: data.get(tag) ? "true" : "false" }),
        {},
      ),
      shelf_loc: data.get("shelf_loc")?.toString() || "",
      stock: data.get("stock")?.toString() || "",
    },
    description: data.get("description")?.toString() || "",
    expand: ["default_price"],
    active: !(data.get("archive") === "archive"),
    images: image
      ? [image]
      : data.get("delete-image") === "true"
        ? []
        : undefined,
  });

  // Stripe prices are immutable, so a changed price means a fresh default
  // price object and deactivating the old one.
  const existingPrice = product.default_price;
  const newAmount = Math.round(
    parseFloat(data.get("price")?.toString() || "0") * 100,
  );
  const useExisting =
    existingPrice && typeof existingPrice !== "string"
      ? existingPrice.unit_amount === newAmount
      : false;
  if (!useExisting) {
    const price = await stripe.prices.create({
      product: id,
      unit_amount: newAmount,
      currency: "nzd",
    });
    await stripe.products.update(id, { default_price: price.id });
    if (existingPrice && typeof existingPrice !== "string") {
      await stripe.prices.update(existingPrice.id, { active: false });
    }
  }
}

async function activateProduct(data: FormData) {
  const newID = data.get("newID")?.toString();
  const slot = data.get("slot")?.toString();
  if (!newID || !slot) throw new Error("Missing product or slot");

  if (newID === "newProd") {
    await stripe.products.create({
      name: "Empty Slot",
      default_price_data: { currency: "nzd", unit_amount: 0 },
      metadata: {
        ...Object.values(VendingTag).reduce(
          (acc, tag) => ({ ...acc, [tag]: "false" }),
          {},
        ),
        vendable: "true",
        shelf_loc: slot,
        stock: "0",
      },
      active: true,
    });
  } else {
    const product = await stripe.products.retrieve(newID);
    if (!product.id) throw new Error("Product not found");
    await stripe.products.update(newID, {
      active: true,
      metadata: { ...product.metadata, shelf_loc: slot },
    });
  }

  const oldID = data.get("oldID")?.toString();
  if (oldID) {
    await stripe.products.update(oldID, { active: false });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const data = await req.formData();
    const action = data.get("action")?.toString();
    const id = data.get("id")?.toString();

    switch (action) {
      case "complete": {
        if (!id) throw new Error("Missing id");
        await completeQueueItem(id);
        break;
      }
      case "cancel": {
        if (!id) throw new Error("Missing id");
        // Free (Redis) entries have no cancel endpoint on the legacy app;
        // completing is the only way to clear them remotely.
        if (id.startsWith("pi_")) await cancelQueueItem(id);
        else await completeQueueItem(id);
        break;
      }
      case "saveProduct": {
        await saveProduct(data);
        break;
      }
      case "dispenseProduct": {
        if (!id) throw new Error("Missing id");
        const product = await stripe.products.retrieve(id, {
          expand: ["default_price"],
        });
        // Only free-priced products can be enqueued through the legacy
        // public checkout; paid manual dispenses need the legacy admin.
        if (getPrice(product) !== 0) {
          throw new Error(
            "Only free-priced products can be manually dispensed from here.",
          );
        }
        await enqueueFreeItem(id);
        break;
      }
      case "activateProduct": {
        await activateProduct(data);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const startDate = resolveStartDate(data.get("startDate")?.toString() ?? null);
    return NextResponse.json(await snapshot(startDate));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
