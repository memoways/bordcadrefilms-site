import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      tailwindcss: path.resolve(process.cwd(), "node_modules/tailwindcss"),
    },
  },
  experimental: {
    // Film images are served via /api/img/film/<slug> (302 → current Airtable
    // signed URL), so URLs in cached HTML never go dead — the router cache is
    // safe again. 30s on dynamic, 3min on static.
    staleTimes: {
      dynamic: 30,
      static: 180,
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
    // Extend Next 16 defaults to cover literal widths used in components:
    // 80 (festival logo), 144 (director profile), 300 (FilmDetail poster),
    // 320 (FilmCard poster). Without these, the optimizer rejects requests
    // for `?w=` values not in this list with a 400.
    imageSizes: [16, 32, 48, 64, 80, 96, 128, 144, 256, 300, 320, 384],
    // Airtable signed URLs expire ~2h. A long TTL here means the optimizer's LRU
    // can hold a cached blob whose origin URL is already dead — on cache miss it
    // refetches with the expired URL → 502 → random images break on detail pages
    // until F5. 1h keeps refetches frequent enough that the URL is still alive
    // (since unstable_cache rotates Films every 15 min, fresh URLs are available).
    minimumCacheTTL: 3600,
    // Allow same-origin proxy URLs through next/image (Next.js 16 requires
    // explicit local-pattern entries for any same-origin image source).
    // No querystrings → no `search` constraint needed.
    localPatterns: [
      { pathname: "/api/img/**" },
    ],
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
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
        pathname: "/video/**",
      },
    ],
  },
};

export default nextConfig;
