import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";
import { DM_Sans } from "next/font/google";
import { Holtwood_One_SC } from "next/font/google";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import JoinSection from "./components/homepage/JoinSection";

export const metadata: Metadata = {
  title: "PROJECTS · MAKER CLUB",
  icons: { icon: "/logo.png" },
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const holtwood = Holtwood_One_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-holtwood",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${holtwood.variable}`}>
      <head />
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
