'use client';

import Script from 'next/script';
import * as React from 'react';

interface FaqItem {
  title: string;
  content: string;
}

interface FaqJsonLdProps {
  faqs: FaqItem[];
}

const FaqJsonLd: React.FC<FaqJsonLdProps> = ({ faqs }) => {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': Array.isArray(faqs) && faqs.map(faq => ({
      '@type': 'Question',
      'name': typeof faq?.title === 'string'
        ? faq?.title.replace(/^\d+[.\-)]?\s*/, '')
        : '',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.content,
      },
    })),
  };

  return (
    <Script
      type="application/ld+json"
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      id="faqJsonLd"
    />
  );
};

export default FaqJsonLd;
