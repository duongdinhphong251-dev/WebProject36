'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/stores/filter/useFilterStore';
import { filterStateToParams, paramsToFilterState } from '@/libs/filter-utils';

export function useFilterUrlSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useFilterStore();

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const stateFromUrl = paramsToFilterState(params);

    const currentFilters = useFilterStore.getState().filters;
    const currentParamsStr = JSON.stringify(filterStateToParams(currentFilters));
    const urlParamsStr = JSON.stringify(filterStateToParams(stateFromUrl));

    if (currentParamsStr !== urlParamsStr) {
      setFilters(stateFromUrl);
    }
  }, [searchParams, setFilters]);

  useEffect(() => {
    const params = filterStateToParams(filters);
    const newSearchParams = new URLSearchParams(searchParams.toString());

    let hasChanges = false;

    const setParam = (key: string, value?: string) => {
      if (value) {
        if (newSearchParams.get(key) !== value) {
          newSearchParams.set(key, value);
          hasChanges = true;
        }
      } else {
        if (newSearchParams.has(key)) {
          newSearchParams.delete(key);
          hasChanges = true;
        }
      }
    };

    setParam('gender', params.gender);
    setParam('minRating', params.minRating);
    setParam('priceSort', params.priceSort);

    if (hasChanges) {
      const queryString = newSearchParams.toString();
      const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
      router.push(newUrl, { scroll: false });
    }
  }, [filters, router, searchParams]);
}
