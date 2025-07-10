/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Handle TypeScript files
    config.resolve.extensionAlias = {
      '.js': ['.js', '.jsx', '.ts', '.tsx'],
    };
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
