import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure experimental features are compatible
  experimental: {
    esmExternals: true,
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit for image uploads
    },
  },
  // @ts-ignore - allowedDevOrigins might not be in the current NextConfig type definition yet but is required by the runtime warning
  allowedDevOrigins: ['192.168.1.5', '192.168.1.5:9002'],
  // Add webpack configuration for better module resolution
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
