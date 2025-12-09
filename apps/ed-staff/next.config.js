/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@schoolgle/ed-backend', '@schoolgle/shared'],
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

module.exports = nextConfig
