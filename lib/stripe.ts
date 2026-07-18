import "server-only";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
}

// The default Node HTTP transport stalls on the Workers runtime (every call
// hits the 80s SDK timeout), so pin the fetch-based client.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
  httpClient: Stripe.createFetchHttpClient(),
});

export interface IGetRandomProductRes {
  name: string;
  src: string;
}

export async function getRandomProduct(): Promise<IGetRandomProductRes> {
  const products = await stripe.products.list({ limit: 100 });
  const withImages = products.data.filter((p) => p.images.length > 0);
  if (withImages.length === 0) {
    throw new Error("No products with images found.");
  }
  const randomProduct =
    withImages[Math.floor(Math.random() * withImages.length)];
  return {
    name: randomProduct.name,
    src: randomProduct.images[0],
  };
}
