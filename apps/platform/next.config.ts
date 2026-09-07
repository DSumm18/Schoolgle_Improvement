import type { NextConfig } from "next";
import path from "path";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      { source: "/worlds/play", destination: "/worlds/play/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/worlds/play/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
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
      "@schoolgle/platform": path.resolve(__dirname, "src"),
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      "@schoolgle/ed-widget": "../../packages/ed-widget/src",
      "@schoolgle/ed-agents": "../../packages/ed-agents/src",
      "@schoolgle/ed-agents/*": "../../packages/ed-agents/src/*",
      "@schoolgle/platform": "./src",
      "@schoolgle/platform/*": "./src/*",
    },
  },
} as NextConfig;

export default withBundleAnalyzer(nextConfig);
