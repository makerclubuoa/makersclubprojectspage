import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";

export const ADMIN_EMAIL = "makerclubuoa@gmail.com";

export async function userFromRequest(req: NextRequest): Promise<User | null> {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : (data.user ?? null);
}

export function isAdmin(user: User): boolean {
  return user.email?.toLowerCase() === ADMIN_EMAIL;
}
