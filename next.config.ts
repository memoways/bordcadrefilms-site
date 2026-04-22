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
    // Keep prefetched route payloads warm longer for instant back-and-forth navigation.
    staleTimes: {
      dynamic: 900,
      static: 900,
    },
  },
  images: {
    minimumCacheTTL: 86400, // cache optimized images 24h — survives Airtable CDN URL expiry
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
    ],
  },
};

export default nextConfig;
