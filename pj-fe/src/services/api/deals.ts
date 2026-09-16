import { cache } from 'react';
import type { DealDetailDto } from '@/types/deal-detail';
import http, { HttpError } from '@/services/http';

export const getDealBySlug = cache(async (
  slug: string,
  locale: string,
): Promise<DealDetailDto | null> => {
  try {
    const res = await http.get<{ data: DealDetailDto }>(`/api/v1/deals/${slug}?lang=${locale}`);
    return res.data.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    console.error(`Failed to fetch deal by slug: ${slug}`, error);
    return null;
  }
});

