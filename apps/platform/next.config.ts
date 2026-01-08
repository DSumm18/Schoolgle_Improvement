import type { NextConfig } from "next";
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
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@schoolgle/ed-widget': path.resolve(__dirname, 'src/lib/ed-widget-stub.ts'),
    };
    return config;
  },
  experimental: {
    turbo: {
      aliases: {
        '@schoolgle/ed-widget': './src/lib/ed-widget-stub.ts',
      },
    },
  },
} as NextConfig;

export default withBundleAnalyzer(nextConfig);
