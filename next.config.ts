import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      tailwindcss: path.resolve(process.cwd(), "node_modules/tailwindcss"),
    },
  },
  experimental: {
    // Disable client-side prefetch reuse: Airtable signed image URLs expire after
    // ~2h, so any cached HTML can ship dead URLs that paint as broken images on
    // navigation. Re-fetching on every Link click keeps URLs always fresh; cost
    // is ~50–200 ms per navigation vs the previous "instant" feel.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  async rewrites() {
    return [
      {
        // SimpleCommenter widget issues same-origin requests to /api/js/*;
        // proxy them to simplecommenter.com so it works on any deployment domain.
        source: "/api/js/:path*",
        destination: "https://simplecommenter.com/api/js/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        // Static assets in /public/news/ — long cache, they're immutable placeholders
        source: "/news/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400, // 31 days — Airtable images are stable once uploaded
    remotePatterns: [
      {
        protocol: "https",
        hostname: "v5.airtableusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.cmsfly.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
