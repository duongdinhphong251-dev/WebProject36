// src/components/seo/PageJsonLd.tsx
import { Env } from '@/libs/Env';
import Script from 'next/script';

const BASE = (Env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
const APP_NAME = Env.NEXT_PUBLIC_APP_NAME ?? 'Nhom36';

const withLeadingSlash = (p?: string) => (p && p.startsWith('/') ? p : `/${p ?? ''}`);
const toBcp47 = (loc?: string) => {
  if (loc === 'vi') return 'vi-VN';
  if (loc === 'ko') return 'ko-KR';
  return 'en-US';
};
const ensureArray = <T,>(v?: T | T[], fallback: T[] = []) => (Array.isArray(v) ? v : v ? [v] : fallback);
const toAbs = (u: string) => (u.startsWith('http') ? u : `${BASE}${withLeadingSlash(u)}`);

interface Crumb { name: string; href?: string } // href: relative ('/about-us') hoặc absolute
interface Props {
  title: string;
  description: string;
  locale: string; // 'en' | 'es'
  path?: string; // KHÔNG kèm locale, ví dụ '/about-us'
  images?: string | string[]; // relative/absolute; mảng hoặc string
  url?: string; // legacy override
  image?: string; // legacy override
  breadcrumbs?: Crumb[]; // tùy chọn: truyền trail đã dịch
  withBreadcrumb?: boolean; // mặc định true
  datePublished?: string;
  dateModified?: string;
}

export default function PageJsonLd({
  title,
  description,
  locale,
  path,
  images = ['common/logo.svg'],
  url,
  image,
  breadcrumbs,
  withBreadcrumb = true,
  datePublished,
  dateModified,
}: Props) {
  const canonical = url || `${BASE}/${locale}${withLeadingSlash(path)}`;

  const imgList = ensureArray(images, ensureArray(image)).map(toAbs).filter(Boolean);
  const primary = imgList[0];

  // ---------- WebPage JSON-LD ----------
  const webPageLd: any = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    'name': title,
    description,
    'url': canonical,
    'inLanguage': toBcp47(locale),
    'image': imgList,
    'publisher': {
      '@type': 'Organization',
      'name': APP_NAME,
      'logo': { '@type': 'ImageObject', 'url': toAbs('/common/logo.svg') },
    },
    'isPartOf': {
      '@type': 'WebSite',
      '@id': `${BASE}/#website`,
      'name': APP_NAME,
      'url': BASE,
      'inLanguage': toBcp47(locale),
    },
  };
  if (primary) {
    webPageLd.primaryImageOfPage = { '@type': 'ImageObject', 'url': primary };
  }

  // ---------- BreadcrumbList JSON-LD (optional) ----------
  let breadcrumbLd: any | null = null;
  if (withBreadcrumb) {
    const trail: Crumb[] = breadcrumbs && breadcrumbs.length
      ? breadcrumbs
      : [
        { name: 'Home', href: `` },
        { name: title, href: path || '/' },
      ];

    const validTrail = trail.filter(c => c.name?.trim());

    if (validTrail.length === 0) {
      breadcrumbLd = null;
    } else {
      const itemListElement = validTrail.map((c, idx) => {
        if (c.href && c.href.startsWith('http')) {
          return {
          '@type': 'ListItem',
          'position': idx + 1,
          'name': c.name,
          'item': {
            '@id': c.href,
          },
        };
      }

      const rel = c.href ?? '';

      const abs = rel === ''
        ? `${BASE}/${locale}`
        : `${BASE}/${locale}${withLeadingSlash(rel)}`;

      return {
        '@type': 'ListItem',
        'position': idx + 1,
        'name': c.name,
        'item': {
          '@id': abs,
        },
      };
    });

    breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };
    }
  }

  if (datePublished) {
    webPageLd.datePublished = datePublished;
  }
  if (dateModified) {
    webPageLd.dateModified = dateModified;
  }

  return (
    <>
      <Script
        type="application/ld+json"
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
      />
      {breadcrumbLd && (
        <Script
          type="application/ld+json"
          // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
    </>
  );
}
