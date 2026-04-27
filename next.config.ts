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
    // Airtable signed URLs expire ~2h. A long TTL here means the optimizer's LRU
    // can hold a cached blob whose origin URL is already dead — on cache miss it
    // refetches with the expired URL → 502 → random images break on detail pages
    // until F5. 1h keeps refetches frequent enough that the URL is still alive
    // (since unstable_cache rotates Films every 15 min, fresh URLs are available).
    minimumCacheTTL: 3600,
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
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
};

export default nextConfig;
