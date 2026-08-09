import type { NextConfig } from "next";
import path from "path";

// Derive the Supabase hostname for next/image without letting a missing or
// malformed NEXT_PUBLIC_SUPABASE_URL crash the whole build at config-load time.
function supabaseImageHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "makeuoa.nz",
        port: "",
        pathname: "/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              port: "",
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "files.stripe.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // The legacy App Router scroll handler locates the new page by walking to
    // the segment's first DOM node. Every page here has `generateMetadata`, and
    // React hoists that <title>/<meta> into <head> — so the walk lands on a
    // zero-sized head element, skips through the rest of <head>, runs out of
    // siblings and bails without scrolling. The result: following a link left
    // you at the previous page's scroll offset, i.e. halfway down a project.
    // The new handler uses a fragment ref instead and never sees <head>.
    appNewScrollHandler: true,
  },
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
