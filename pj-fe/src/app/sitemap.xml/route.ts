import { NextResponse } from 'next/server';
import { base, renderSitemapIndexXml } from '@/libs/sitemap-helpers';
import { locales } from '@/i18n/settings';



// Revalidate daily — the index rarely changes
export const revalidate = 86400;

export async function GET() {
  const sitemapUrls: string[] = [];

  // TODO: Fetch total counts from API to determine exact number of pages.
  // For now, assume 2 pages per locale to demonstrate the chunking.
  const TOTAL_PAGES = 2;

  for (const locale of locales) {
    for (let pageId = 1; pageId <= TOTAL_PAGES; pageId++) {
      sitemapUrls.push(`${base}/sitemaps/${locale}/${pageId}.xml`);
    }
  }

  const xml = renderSitemapIndexXml(sitemapUrls);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate`,
    },
  });
}
