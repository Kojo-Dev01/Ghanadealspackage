import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' https: data:",
  "img-src 'self' https: data: blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
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
