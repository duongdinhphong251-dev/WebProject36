import type { NextConfig } from 'next';
import './src/libs/Env';

const isDev = process.env.NODE_ENV === 'development';

function toOrigin(value?: string): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function toWsOrigin(value?: string): string | null {
  const origin = toOrigin(value);
  if (!origin) return null;
  if (origin.startsWith('https://')) return origin.replace('https://', 'wss://');
  if (origin.startsWith('http://')) return origin.replace('http://', 'ws://');
  return null;
}

function toRemotePattern(value?: string): { protocol: 'http' | 'https'; hostname: string; port?: string; pathname: string } | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol === 'http:' ? 'http' : 'https',
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN);
const apiRemotePattern = toRemotePattern(process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN);
const appWsOrigin = toWsOrigin(process.env.NEXT_PUBLIC_APP_URL);
const envConnectSrc = Array.from(new Set([
  ...(apiOrigin ? [apiOrigin] : []),
  ...(appWsOrigin ? [appWsOrigin] : []),
])).join(' ');

const devConnectSrc = Array.from(new Set([
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'ws://localhost:3000',
  'ws://127.0.0.1:3000',
])).join(' ');

// Define the base Next.js configuration
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
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      ...(apiRemotePattern ? [apiRemotePattern] : []),
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

  async redirects() {
    return [
      // Strip trailing slash on locale roots: /vi/ → /vi, /en/ → /en, /ko/ → /ko
      {
        source: '/:locale(vi|en|ko)/',
        destination: '/:locale',
        permanent: true,
      },
      // Redirect legacy single sitemaps to the new chunked sitemaps structure
      {
        source: '/sitemap-:locale(vi|en|ko).xml',
        destination: '/sitemaps/:locale/1.xml',
        permanent: true,
      },
      // 301 Redirects for legacy category URLs to new 8 main service groups
      {
        source: '/:locale(vi|en|ko)/nha-hang',
        destination: '/:locale/food-drink',
        permanent: true,
      },
      {
        source: '/:locale(vi|en|ko)/khach-san-resort',
        destination: '/:locale/stay',
        permanent: true,
      },
      {
        source: '/:locale(vi|en|ko)/hotel-resort',
        destination: '/:locale/stay',
        permanent: true,
      },
      {
        source: '/:locale(vi|en|ko)/du-lich',
        destination: '/:locale/tours',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // SEO
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",

              // Ảnh: GCS bucket + Unsplash + Google Maps + Hotjar recording + base64 placeholder + tracking pixel fallbacks
              `img-src 'self' https://storage.googleapis.com https://images.unsplash.com https://maps.googleapis.com https://maps.gstatic.com https://static.hotjar.com https://script.hotjar.com https://c.clarity.ms https://www.facebook.com https://analytics.tiktok.com https://ads.tiktok.com https://www.google-analytics.com https://www.googletagmanager.com https://ssl.google-analytics.com https://*.google https://*.google.com https://www.google.com.vn https://*.googlesyndication.com https://stats.g.doubleclick.net https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.googleadservices.com https://*.googleadservices.com https://*.googleusercontent.com data: blob:${apiOrigin ? ` ${apiOrigin}` : ''}${isDev ? ' http://localhost:8081 http://127.0.0.1:8081' : ''}`,

              // Script: Next.js inline hydration (unsafe-inline) + analytics/tracking
              // 'unsafe-eval' cần thiết cả production vì AdSense sodar2.js sử dụng eval()
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://tagmanager.google.com https://static.hotjar.com https://script.hotjar.com https://www.clarity.ms https://scripts.clarity.ms https://connect.facebook.net https://analytics.tiktok.com https://ads.tiktok.com https://static.cloudflareinsights.com https://*.google https://*.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://*.googleadservices.com https://tpc.googlesyndication.com`,

              // Style: Tailwind inline + Google Fonts + AdSense inline styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.google https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net",

              "font-src 'self' https://fonts.gstatic.com https://script.hotjar.com",

              `connect-src 'self' https://api.glowexplore.com https://stg.glowexplore.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://tagassistant.google.com https://vars.hotjar.com https://in.hotjar.com https://vc.hotjar.io wss://ws.hotjar.com https://q.clarity.ms https://www.facebook.com https://analytics.tiktok.com https://api.tiktok.com https://ads.tiktok.com https://analytics-ipv6.tiktokw.us https://cloudflareinsights.com https://*.a.run.app https://*.google https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.googleadservices.com${envConnectSrc ? ` ${envConnectSrc}` : ''}${isDev ? ` ${devConnectSrc}` : ''}`,

              // Hotjar session recording dùng worker
              "worker-src blob:",

              "frame-src 'self' https://www.facebook.com https://*.google https://*.google.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://pagead2.googlesyndication.com https://*.googlesyndication.com https://tpc.googlesyndication.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://www.facebook.com",
            ].join('; '),
          },

          // Chặn MIME-type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // Chặn clickjacking (iframe embedding)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // Kiểm soát Referer gửi đi khi navigate sang domain khác
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // Tắt các browser API nhạy cảm không dùng đến
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
