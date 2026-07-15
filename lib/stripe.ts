import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing from environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

export interface IGetRandomProductRes {
  name: string;
  src: string;
}

export async function getRandomProduct(): Promise<IGetRandomProductRes> {
  const products = await stripe.products.list({ limit: 100 });
  if (products.data.length === 0) {
    throw new Error("No products found.");
  }
  let randomIndex = Math.floor(Math.random() * products.data.length);
  let randomProduct = products.data[randomIndex];
  while (randomProduct.images.length === 0) {
    randomIndex = Math.floor(Math.random() * products.data.length);
    randomProduct = products.data[randomIndex];
  }
  return {
    name: randomProduct.name,
    src: randomProduct.images[0],
  };
}
