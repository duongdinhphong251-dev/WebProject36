'use client';

import { useEffect, useRef } from 'react';

import { postRecordView } from '@/services/api/tracking';

type Entity = 'deal' | 'spa';

/**
 * Một lần mỗi mount: POST view để tăng engagement (không chặn UI).
 */
export function EngagementBeacon({ slug, entityType }: { slug: string; entityType: Entity }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!slug || sent.current) return;
    sent.current = true;
    void postRecordView(slug, entityType);
  }, [slug, entityType]);

  return null;
}
