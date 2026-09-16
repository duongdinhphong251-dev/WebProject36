import type { Metadata, Viewport } from 'next';
import { GoogleTagManager } from '@next/third-parties/google';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { ModalRendererClient } from '@/components/common/modal/ModalRendererClient';
import { NotifySnackbar } from '@/components/common/notify/NotifySnackbar';
import QueryProvider from '@/providers/QueryProvider';
import { Env } from '@/libs/Env';
import AppProgressProvider from '@/providers/AppProgressProvider';
import { HistoryPatchProvider } from '@/providers/HistoryPatchProvider';
import { SmartRedirector } from '@/components/shared/SmartRedirector';
import { buildWebSiteJsonLd } from '@/libs/seo/schema-builder';
import '@/styles/global.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(Env.NEXT_PUBLIC_APP_URL || 'https://glowexplore.com'),
  applicationName: 'GlowExplore',
  title: {
    default: 'GlowExplore - Trải Nghiệm Địa Phương Đỉnh Nhất - Ăn, Ở, Thư Giãn, Khám Phá',
    template: '%s | GlowExplore',
  },
  description: 'Đừng chỉ đi du lịch, hãy khám phá như người bản địa. GlowExplore tổng hợp spa, tour, ẩm thực và homestay đẹp — được đánh giá thật, chọn lọc kỹ, dễ tìm dễ đặt.',
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png?v=3' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png?v=3' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png?v=3' },
    { rel: 'icon', url: '/favicon.ico?v=3' },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const webSiteJsonLd = buildWebSiteJsonLd();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
  if (sessionStorage.getItem('smart_redirect_url')) {
    document.documentElement.style.visibility = 'hidden';
    // LƯU Ý: giá trị này phải khớp với timeout tương ứng ở src/components/shared/SmartRedirector.tsx.
    // Đây là lưới an toàn cho trường hợp JS lỗi/route không mount được — KHÔNG ảnh hưởng
    // tốc độ hiển thị của user bình thường (họ luôn được unhide sớm hơn qua pathname effect).
    setTimeout(function() {
      document.documentElement.style.visibility = '';
    }, 6000);
  }
} catch (e) {}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APP_INITIAL_PATH__ = window.location.pathname;`,
          }}
        />
      </head>
      {Env.NEXT_PUBLIC_GTM_ID ? <GoogleTagManager gtmId={Env.NEXT_PUBLIC_GTM_ID} /> : null}
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <AppProgressProvider>
          <HistoryPatchProvider />
          <SmartRedirector />
          <QueryProvider>
            {children}
            <ModalRendererClient />
            <NotifySnackbar />
          </QueryProvider>
        </AppProgressProvider>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8014282449698560"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
