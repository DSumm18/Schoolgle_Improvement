import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@schoolgle/ed-widget': path.resolve(__dirname, 'src/lib/ed-widget-stub.ts'),
    };
    return config;
  },
  images: {
    domains: ['schoolgle.co.uk', 'www.schoolgle.co.uk', 'www.google.com'],
  },
  turbopack: {},
} as NextConfig;

export default withBundleAnalyzer(nextConfig);
