// Force dynamic so this auth-gated client page isn't prerendered at build time.
// Must live in the server-component layout: segment config is ignored when
// exported from a "use client" page.
export const dynamic = "force-dynamic";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
