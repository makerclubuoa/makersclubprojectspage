import { Metadata } from "next";
import Footer from "../components/Footer";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "Vending Machine | Maker Club",
  icons: { icon: "/logoNew.png" },
};

export default function VendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav></Nav>
      {children}
      <div className="w-full border-t-4">
        <Footer />
      </div>
    </div>
  );
}
