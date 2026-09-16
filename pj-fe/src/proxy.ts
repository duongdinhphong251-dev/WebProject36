import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { locales, fallbackLng } from './i18n/settings';

const PUBLIC_FILE = /\.(?:png|jpe?g|gif|svg|webp|bmp|ico|mobileconfig|ttf|pdf)$/i;
// Sitemap files must be served directly — never redirect to /[locale]/sitemap-*.xml
// No ^ anchor: also catches /vi/sitemap-vi.xml (stale browser cache of old redirect)
const SITEMAP_FILE = /\/sitemap[\w.-]*\.xml$/i;
const LOCALE_SET: Set<string> = new Set(locales);

const PROTECTED_PREFIXES: Set<string> = new Set(
  ['/account'].flatMap(segment => locales.map(locale => `/${locale}${segment}`)),
);

function getLocaleFromPathname(pathname: string): (typeof locales)[number] {
  const segment = pathname.split('/')[1] ?? '';
  return LOCALE_SET.has(segment) ? (segment as (typeof locales)[number]) : fallbackLng;
}

function isProtectedPath(pathname: string): boolean {
  return [...PROTECTED_PREFIXES].some(prefix => pathname.startsWith(prefix));
}

export function detectLocaleFromAcceptLanguage(header: string | null | undefined): (typeof locales)[number] {
  if (!header || !header.trim()) {
    return fallbackLng;
  }

  const tags = header
    .split(',')
    .map(part => part.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  if (tags.length === 0) {
    return fallbackLng;
  }

  for (const tag of tags) {
    if (tag.startsWith('vi')) return 'vi';
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('en')) return 'en';
  }

  // Header exists but none of vi/ko/en matched (e.g. fr-FR, ja-JP)
  return 'en';
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('/api/') || PUBLIC_FILE.test(request.nextUrl.pathname)) {
    return;
  }

  if (pathname.startsWith('/sitemaps') || pathname === '/sitemap.xml') {
    return NextResponse.next();
  }

  // Sitemap files: if accessed with a locale prefix (e.g. /vi/sitemap-vi.xml from stale cache),
  // redirect to the canonical root path (/sitemap-vi.xml).
  if (SITEMAP_FILE.test(pathname)) {
    const sitemapMatch = pathname.match(/\/sitemap[\w.-]*\.xml$/i);
    const sitemapFile = sitemapMatch?.[0]; // e.g. /sitemap-vi.xml
    if (sitemapFile && pathname !== sitemapFile) {
      // Has a locale prefix — redirect to canonical
      return NextResponse.redirect(new URL(sitemapFile, request.url), { status: 301 });
    }
    // Already at root level — serve directly
    return;
  }

  if (isProtectedPath(pathname)) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      const locale = getLocaleFromPathname(pathname);
      const signInUrl = new URL(`/${locale}/sign-in`, request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  const pathnameIsMissingLocale = locales.every(
    locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  const cookieLocale = request.cookies.get('preferred_language')?.value;

  if (pathnameIsMissingLocale) {
    const hasValidCookie = !!(cookieLocale && locales.includes(cookieLocale as any));
    let locale: (typeof locales)[number];
    let status = 308;

    if (hasValidCookie) {
      locale = cookieLocale as (typeof locales)[number];
      status = 308;
    } else {
      const acceptLanguageHeader = request.headers.get('accept-language');
      locale = detectLocaleFromAcceptLanguage(acceptLanguageHeader);
      status = (acceptLanguageHeader && acceptLanguageHeader.trim()) ? 302 : 308;
    }

    const url = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
    url.search = request.nextUrl.searchParams.toString();
    return NextResponse.redirect(url, { status });
  }

  const currentUrlLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (currentUrlLocale && cookieLocale && locales.includes(cookieLocale as any)) {
    if (currentUrlLocale !== cookieLocale) {
      const newPathname = pathname.replace(`/${currentUrlLocale}`, `/${cookieLocale}`);
      const url = new URL(newPathname, request.url);
      url.search = request.nextUrl.searchParams.toString();
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|ads.txt|sitemap.xml|sitemap-vi.xml|sitemap-en.xml|sitemap-ko.xml|manifest.json|android-chrome-192x192.png|apple-touch-icon.png|browserconfig.xml|mstile-150x150.png|safari-pinned-tab.svg|site.webmanifest|favicon-.*.png|.ttf|.pdf|.svg).*)',
  ],
};
