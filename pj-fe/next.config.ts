import type { NextConfig } from 'next';
const backendOrigin = new URL(
  process.env.API_URL || 'http://localhost:8081/api/v1',
).origin;
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};
export default config;
