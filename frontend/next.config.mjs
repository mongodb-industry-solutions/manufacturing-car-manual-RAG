/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // This is temporary until LeafyGreen UI is fully compatible with React 19
    ignoreBuildErrors: true,
  },
  webpack(config) {
    // Polyfill Node.js core modules for browser environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };
    return config;
  }
};

export default nextConfig;
