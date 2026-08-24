import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/holtwood-one-sc";
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";

export const metadata: Metadata = {
  title: "Maker Club",
  icons: { icon: "/logoNew.png" },
};

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
