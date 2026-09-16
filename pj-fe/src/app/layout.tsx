import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ModalRendererClient } from '@/components/common/modal/ModalRendererClient';
import { NotifySnackbar } from '@/components/common/notify/NotifySnackbar';
import QueryProvider from '@/providers/QueryProvider';
import { Env } from '@/libs/Env';
import AppProgressProvider from '@/providers/AppProgressProvider';
import { HistoryPatchProvider } from '@/providers/HistoryPatchProvider';
import { SmartRedirector } from '@/components/shared/SmartRedirector';
import '@/styles/global.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(Env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  applicationName: 'Nhom36',
  title: {
    default: 'Nhom36 - Tìm kiếm Spa và Deal',
    template: '%s | Nhom36',
  },
  description:
    'Nhom36 - Web tìm kiếm spa, dịch vụ làm đẹp và các ưu đãi theo khu vực.',
  icons: [
    { rel: 'icon', url: '/favicon.png' },
    { rel: 'apple-touch-icon', url: '/favicon.png' },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <AppProgressProvider>
          <HistoryPatchProvider />
          <SmartRedirector />
          <QueryProvider>
            {children}
            <ModalRendererClient />
            <NotifySnackbar />
          </QueryProvider>
        </AppProgressProvider>
      </body>
    </html>
  );
}