import type { BreadcrumbItemDto } from "@/types/api";

import { Env } from "@/libs/Env";

interface BreadcrumbsJsonLdProps {
  items: BreadcrumbItemDto[];
  baseUrl?: string;
}

/**
 * BreadcrumbsJsonLd — Server Component only.
 * Renders the BreadcrumbList JSON-LD schema in the initial HTML for SEO.
 *
 * ⚠️  Uses a plain <script> tag, NOT next/script.
 * next/script deduplicates scripts by id and persists them across client-side
 * navigations — causing breadcrumb data from a previously visited page to
 * "bleed" into the current page's schema (entity leakage).
 * A plain <script> is re-rendered fresh on every route change.
 *
 * Must NOT be used inside a Client Component.
 */
export function BreadcrumbsJsonLd({
  items,
  baseUrl = Env.NEXT_PUBLIC_APP_URL || "https://Nhom36.com",
}: BreadcrumbsJsonLdProps) {
  if (!items || items.length === 0) return null;

  // Filter out placeholder "#" urls and items without a label
  const validItems = items.filter((item) => item.url && item.url !== "#" && item.label?.trim());
  if (validItems.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: validItems.map((item, index) => {
      const normalBase = baseUrl.replace(/\/+$/, '');
      const absoluteItem = item.url.startsWith("http")
        ? item.url
        : `${normalBase}${item.url.startsWith('/') ? item.url : `/${item.url}`}`;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: {
          "@id": absoluteItem,
        },
      };
    }),
  };

  // Escape & → \u0026 to prevent HTML-entity encoding in <script> raw text
  const json = JSON.stringify(schema).replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
