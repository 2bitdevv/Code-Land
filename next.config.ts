import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {},
  allowedDevOrigins: ["https://*.trycloudflare.com"],
  staticPageGenerationTimeout: 120,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
