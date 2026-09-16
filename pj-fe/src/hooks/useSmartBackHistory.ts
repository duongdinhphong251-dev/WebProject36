'use client';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { ServiceResponseDto } from '@/types/api';
import { SERVICE_SLUGS } from '@/constants/services';
import type { LocaleTypes } from '@/i18n/settings';

// We rely on window.__APP_INITIAL_PATH__ set in layout.tsx
// to reliably capture the very first HTML load path, regardless of code splitting.

export function useSmartBackHistory(services?: ServiceResponseDto[]) {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params?.locale as string;

  useEffect(() => {
    const initialPath = (window as any).__APP_INITIAL_PATH__ || window.location.pathname;

    // If the current path doesn't match the path the app initially loaded on,
    // it means the user got here via client-side routing (they have a natural history).
    if (window.location.pathname !== initialPath) {
      return;
    }

    const refSlug = searchParams.get('ref');
    let fallbackSlug = refSlug ?? '';

    if (!fallbackSlug && services?.[0]) {
      const globalSlug = services[0].slugGlobal;
      if (globalSlug) {
        // Find the valid localized slug for this locale
        const localizedSlug = SERVICE_SLUGS[globalSlug as keyof typeof SERVICE_SLUGS]?.[locale as LocaleTypes];
        if (localizedSlug) {
          fallbackSlug = localizedSlug;
        } else if (services[0].targetUrl) {
          // If not found in our known service constants but targetUrl exists
          // we only use targetUrl if we are confident it's valid, otherwise fallback to home.
          // It's safer to fallback to home than a broken 404 page.
        }
      }
    }

    // We are a deep link or direct visit.
    // To bypass Chrome's "trivial session history" block, we do a real physical redirect 
    // to the fallback page first, passing the current detail URL so it can push us back.
    const currentPath = window.location.pathname + window.location.search;
    const fallbackUrl = fallbackSlug ? `/${locale}/${fallbackSlug}` : `/${locale}`;
    
    sessionStorage.setItem('smart_redirect_url', currentPath);
    
    // We must reset the global initialPath so it doesn't trigger again if the user navigates back to this page.
    (window as any).__APP_INITIAL_PATH__ = 'patched';
    window.location.replace(fallbackUrl);
  }, [services, searchParams, locale]);
}
