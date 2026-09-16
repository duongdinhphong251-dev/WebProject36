// src/components/common/json-Ld/CollectionPageJsonLd.tsx
import { Env } from '@/libs/Env';
import { buildCollectionPageJsonLd } from '@/libs/seo/schema-builder';

interface Props {
  locale: string;
  path: string;
  title: string;
  description: string;
  items: Array<{
    '@type'?: 'Offer' | 'DaySpa' | 'HealthAndBeautyBusiness' | 'LocalBusiness' | string;
    name: string;
    url: string;
    
    // For Offer
    price?: string;
    priceCurrency?: string;
    priceValidUntil?: string;
    availability?: string;
    seller?: { '@type': string; name: string };

    // For Spa/LocalBusiness
    image?: string;
    aggregateRating?: {
      '@type': 'AggregateRating';
      ratingValue: number;
      reviewCount: number;
    };
  }>;
}

export function CollectionPageJsonLd({ locale, path, title, description, items }: Props) {
  const baseUrl = Env.NEXT_PUBLIC_APP_URL || 'https://Nhom36.com';
  const schema = buildCollectionPageJsonLd({
    baseUrl,
    locale,
    path,
    title,
    description,
    items,
  });

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
