import Footer from "../components/Footer";
import JoinSection from "../components/homepage/JoinSection";
import Nav from "../components/Nav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Nav></Nav>
      {children}
      <div className="min-h-[50dvh]">
        <JoinSection />
      </div>
      <Footer />
    </div>
  );
}
