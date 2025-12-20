import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@schoolgle/ed-widget'],
  // Explicitly use webpack (not Turbopack) to avoid config conflicts
  webpack: (config, { isServer }) => {
    // Handle ed-widget package
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Add empty turbopack config to silence the warning
  turbopack: {},
} as NextConfig;

export default nextConfig;
