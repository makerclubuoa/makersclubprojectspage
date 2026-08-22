import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/holtwood-one-sc";
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";

export const metadata: Metadata = {
  title: "Maker Club",
  icons: { icon: "/logoNew.png" },
};

// This app is entirely Supabase- and auth-driven; no page benefits from static
// generation. Forcing dynamic here (the root, server-component layout) keeps
// every route out of the build-time static-export pass, which crashes on
// Cloudflare inside shared client/provider code. Route segment config only takes
// effect from a Server Component, so it must live in a layout, not the
// "use client" pages.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
