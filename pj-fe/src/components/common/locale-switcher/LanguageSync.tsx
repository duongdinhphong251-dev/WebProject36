'use client';

import { useState, useLayoutEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { LANGUAGE_COOKIE, locales } from '@/i18n/settings';
import { Loader2 } from 'lucide-react';

export function LanguageSync({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isMismatch, setIsMismatch] = useState(false);

  // useLayoutEffect runs synchronously before browser paint, preventing the flash of old text
  useLayoutEffect(() => {
    const locale = params?.locale as string;
    if (!locale) return;

    const cookieLocale = getCookie(LANGUAGE_COOKIE) as string;
    
    if (cookieLocale && locales.includes(cookieLocale as any) && cookieLocale !== locale) {
      setIsMismatch(true);
      const search = window.location.search;
      let newPathname = pathname;
      
      if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
        newPathname = pathname.replace(`/${locale}`, `/${cookieLocale}`);
      } else {
        newPathname = `/${cookieLocale}${pathname === '/' ? '' : pathname}`;
      }
      
      router.replace(`${newPathname}${search}`, { scroll: false });
    } else {
      setIsMismatch(false);
    }
  }, [params?.locale, pathname, router]);

  return (
    <div className="relative min-h-screen">
      <div 
        className="transition-opacity duration-200 ease-in-out"
        style={{ opacity: isMismatch ? 0 : 1, pointerEvents: isMismatch ? 'none' : 'auto' }}
      >
        {children}
      </div>
      
      {/* Optional: Show a smooth loading spinner while fetching the new language page */}
      {isMismatch && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-app-bg/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#093E06]" />
        </div>
      )}
    </div>
  );
}
