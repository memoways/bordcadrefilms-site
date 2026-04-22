import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Keep prefetched route payloads warm longer for instant back-and-forth navigation.
    staleTimes: {
      dynamic: 900,
      static: 900,
    },
  },
  turbopack: {
    // Pin the root to this project so Turbopack doesn't pick up the stray
    // package.json at C:\Users\souhail and watch the entire user home dir.
    root: process.cwd(),
    // Alias tailwindcss to its absolute path so enhanced-resolve never traverses
    // up to the stray C:\Users\souhail\package.json and fails to find it there.
    resolveAlias: {
      tailwindcss: path.resolve(process.cwd(), "node_modules/tailwindcss"),
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
