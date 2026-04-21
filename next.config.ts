import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {},
  staticPageGenerationTimeout: 120,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
