import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Keep prefetched route payloads warm longer for instant back-and-forth navigation.
    staleTimes: {
      dynamic: 900,
      static: 900,
    },
  },
  images: {
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
