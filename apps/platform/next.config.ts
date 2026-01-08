import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly use webpack (not Turbopack) to avoid config conflicts
  webpack: (config, { isServer }) => {
    // Handle ed-widget package
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    // Make @schoolgle/ed-widget optional for marketing site - alias to stub module
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@schoolgle/ed-widget': path.resolve(__dirname, 'src/lib/ed-widget-stub.ts'),
    };
    return config;
  },
  // Add empty turbopack config to silence the warning
  turbopack: {},
} as NextConfig;

export default nextConfig;
