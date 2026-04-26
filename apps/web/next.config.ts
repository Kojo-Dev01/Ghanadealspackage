import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Prefer AVIF then WebP — both are ~30-50% smaller than JPEG
    formats: ["image/avif", "image/webp"],
    // Cache optimised images on-disk for 30 days.
    // Next.js fetches each unique (url, width, quality) combination from Wasabi
    // exactly once, then serves the cached result for the TTL duration.
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.eu-central-1.wasabisys.com"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
