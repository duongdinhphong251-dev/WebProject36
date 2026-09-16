'use client';

import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation';
import { locales } from '@/i18n/settings';

export const usePathname = () => {
  const pathname = useNextPathname();
  const locale = pathname.split('/')[1];

  // Check if the first segment is a locale
  if (locales.includes(locale as any)) {
    // Remove the locale from the pathname
    const newPathname = pathname.replace(`/${locale}`, '') || '/';
    return newPathname;
  }

  return pathname;
};

export const useRouter = useNextRouter;

// Simple redirect implementation if needed, or re-export from next/navigation
export { redirect } from 'next/navigation';
