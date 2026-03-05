import type { NextConfig } from "next";
import path from "path";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'schoolgle.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'www.schoolgle.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      '@schoolgle/ed-widget': path.resolve(__dirname, 'src/lib/ed-widget-stub.ts'),
      '@schoolgle/ed-agents': path.resolve(__dirname, '../../packages/ed-agents/src'),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      '@schoolgle/ed-widget': './src/lib/ed-widget-stub.ts',
      '@schoolgle/ed-agents': '../../packages/ed-agents/src',
      '@schoolgle/ed-agents/*': '../../packages/ed-agents/src/*',
    },
  },
} as NextConfig;

export default withBundleAnalyzer(nextConfig);
