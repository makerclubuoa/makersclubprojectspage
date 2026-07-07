import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";
import { DM_Sans } from "next/font/google";
import { Holtwood_One_SC } from "next/font/google";

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
        {/* <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var s=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t===null&&s)){document.body.dataset.mode='dark';document.documentElement.style.colorScheme='dark';}else{document.body.dataset.mode='light';}})()` }} /> */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
