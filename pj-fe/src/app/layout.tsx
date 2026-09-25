import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nhom36 Spa',
  description: 'Tìm spa và voucher theo thành phố',
  icons: { icon: '/assets/images/common/logo_x.png' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
