import type { Metadata } from "next";
import Footer from "@/app/components/Footer";
import Nav from "@/app/components/Nav";

export const metadata: Metadata = {
  title: "Join | Maker Club",
  description: "Join the University of Auckland Maker Club for free.",
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
