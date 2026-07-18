// Client-safe vending types and constants (no server-only imports); the
// server-side helpers live in lib/vending.ts.

export enum VendingTag {
  unique = "unique",
  token = "token",
  limited = "limited",
  featured = "featured",
}

export type VendableProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image?: string;
  shelf_loc: string;
  indicator?: string;
  stock?: number;
  tags: VendingTag[];
  active?: boolean;
};

export interface QueueItem {
  id: string;
  product_id: string;
  shelf_loc: number;
  quantity?: number;
  product_name?: string;
  free: boolean;
}

// Physical shelf layout of the machine (used for slot pickers/validation).
export const shelfLayout = [
  ["11", "12", "13", "14", "15"],
  ["21", "22", "23", "24", "25"],
  ["31", "32", "33", "34", "35"],
  ["41", "42", "43", "44", "45", "46", "47", "48", "49"],
  ["51", "52", "53", "54", "55", "56", "57", "58", "59"],
  ["71", "72", "73", "74", "75", "76", "77", "78", "79"],
];

export const shelfValidationPattern = `^(${shelfLayout.flat().join("|")})$`;

export function formatVendPrice(price: number | null): string {
  if (price === 0) return "Dispense (Free)!";
  if (price === null) return "Buy Now: Name a price";
  return `Buy Now: ${price.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
  })}`;
}
