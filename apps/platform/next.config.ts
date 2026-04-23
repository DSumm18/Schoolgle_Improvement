import type { NextConfig } from "next";
import path from "path";
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "schoolgle.co.uk",
      },
      {
        protocol: "https",
        hostname: "www.schoolgle.co.uk",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };

      // Share single Three.js instance across all imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'three': require.resolve('three'),
      };

      // Ensure Three.js is only bundled once
      config.optimization = {
        ...config.optimization,
        runtimeChunk: false,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            three: {
              name: 'three',
              test: /[\\/]node_modules[\\/]three[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "@schoolgle/ed-widget": path.resolve(
        __dirname,
        "../../packages/ed-widget/src",
      ),
      "@schoolgle/ed-agents": path.resolve(
        __dirname,
        "../../packages/ed-agents/src",
      ),
      // Add alias for platform lib so ed-agents can import from it
      "@schoolgle/platform/lib": path.resolve(
        __dirname,
        "../platform/src/lib"
      ),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@schoolgle/ed-widget": "../../packages/ed-widget/src",
      "@schoolgle/ed-agents": "../../packages/ed-agents/src",
      "@schoolgle/ed-agents/*": "../../packages/ed-agents/src/*",
    },
  },
} as NextConfig;

export default withBundleAnalyzer(nextConfig);
