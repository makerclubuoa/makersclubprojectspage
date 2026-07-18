import Footer from "../components/Footer";
import JoinSection from "../components/homepage/JoinSection";
import Nav from "../components/Nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit | Maker Club",
  icons: { icon: "/logoNew.png" },
};

// Force dynamic so this auth-gated client page isn't prerendered at build time.
// Must live in the server-component layout: segment config is ignored when
// exported from a "use client" page.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav></Nav>
      {children}
      <div className="h-[50dvh]">
        <JoinSection />
      </div>
      <Footer />
    </div>
  );
}
