import Footer from "../components/Footer";
import JoinSection from "../components/homepage/JoinSection";
import Nav from "../components/Nav";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Maker Club",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav></Nav>
      {children}
    </div>
  );
}
