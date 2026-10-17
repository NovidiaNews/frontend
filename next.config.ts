import type { NextConfig } from "next";

// Optional CDN host for user media (avatars, backgrounds, article images).
// Set CDN_HOSTNAME at build time (e.g. "cdn.novidia.eu") to allow the Next
// image optimizer to fetch from it. Normalized so "https://cdn.x/" works too.
const cdnHost = (process.env.CDN_HOSTNAME || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "")
  .trim();

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

module.exports = {
      allowedDevOrigins: ['192.168.1.19'],
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://images.pexels.com/**"),
      ...(cdnHost ? [new URL(`https://${cdnHost}/**`)] : []),
    ],
  },
  
  // The API is a separate service. In production the frontend talks to it
  // directly through NEXT_PUBLIC_API_URL (e.g. https://api.novidia.eu) — see
  // src/lib/api.ts. This rewrite is only a convenience fallback for local
  // development where NEXT_PUBLIC_API_URL is not configured yet.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
