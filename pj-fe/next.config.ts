import type { NextConfig } from 'next';
import './src/libs/Env';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  images: {
    qualities: [25, 50, 70, 75, 80, 85, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8081',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;