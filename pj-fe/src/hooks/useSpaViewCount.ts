'use client';

import { useQuery } from '@tanstack/react-query';
import { funcApiAuth } from '@/services/settings/instance-api-auth';
import { API_V1_PREFIX } from '@/constants/api';

export function useSpaViewCount(slug: string) {
  return useQuery({
    queryKey: ['spa-view-count', slug],
    queryFn: async () => {
      try {
        const res = await funcApiAuth.getByRouter(
          `${API_V1_PREFIX}/tracking/view/${encodeURIComponent(slug)}`,
          undefined,
          { headers: { 'x-entity-type': 'spa' } },
        );
        return (res as { data?: { viewCount?: number } })?.data?.viewCount ?? 0;
      } catch {
        return 0;
      }
    },
    initialData: 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
