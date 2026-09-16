import { NextResponse } from 'next/server';
import { buildLocaleSitemap, renderSitemapXml } from '@/libs/sitemap-helpers';

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  const { locale, id } = await params; // 'vi', 'en', or 'ko'
  // params.id will be something like '1.xml' or '2.xml'
  const pageIdStr = id.replace('.xml', '');
  const pageId = parseInt(pageIdStr, 10) || 1;

  // Ideally, buildLocaleSitemap should accept pageId to fetch chunks of 50,000 URLs.
  // For now, we will pass pageId down to the helper function.
  const entries = await buildLocaleSitemap(locale, pageId);
  
  if (entries.length === 0) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const xml = renderSitemapXml(entries);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate`,
      'X-Sitemap-Locale': locale,
      'X-Sitemap-Page': String(pageId),
    },
  });
}
