'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { appendPreservedGeoParams } from '@/libs/geo-url-params';
import { filterStateToParams, paramsToFilterState } from '@/libs/filter-utils';
import type { FilterState } from '@/types/filter';

export function useSpaUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Parse URL params into canonical filter state
  const canonicalFilters = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    return paramsToFilterState(params);
  }, [searchParams]);

  // Local filter state (for immediate UI updates before committing to URL)
  const [localFilters, setLocalFilters] = useState<FilterState>(canonicalFilters);

  // Sync local state when URL changes (e.g., browser back/forward, or after a commit)
  useEffect(() => {
    setLocalFilters(canonicalFilters);
  }, [canonicalFilters]);

  // Set multiple filters at once
  const setFilters = useCallback((next: Partial<FilterState>) => {
    setLocalFilters((prev) => ({
      ...prev,
      ...next,
    }));
  }, []);

  const updateGender = useCallback((gender: string[]) => {
    setFilters({ gender });
  }, [setFilters]);

  const updateRating = useCallback((minRating: number) => {
    setFilters({ minRating });
  }, [setFilters]);

  // Commit local filters to URL immediately
  const commit = useCallback((filtersToCommit?: FilterState) => {
    const filters = filtersToCommit || localFilters;
    const params = filterStateToParams(filters);
    
    // Convert to URLSearchParams
    const newSearchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newSearchParams.set(key, String(value));
      }
    });

    appendPreservedGeoParams(newSearchParams, searchParams);

    const queryString = newSearchParams.toString();

    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  }, [localFilters, pathname, router, searchParams]);

  // Timer ref for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Commit with debounce
  const commitDebounced = useCallback(
    (delay = 500) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        commit();
      }, delay);
    },
    [commit],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    const emptyState = paramsToFilterState({});
    setLocalFilters(emptyState);
    startTransition(() => {
      const next = new URLSearchParams();
      appendPreservedGeoParams(next, searchParams);
      const q = next.toString();
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  return {
    filters: localFilters,
    canonicalFilters,
    setFilters,
    updateGender,
    updateRating,
    commit,
    commitDebounced,
    resetFilters,
    isPending,
  };
}
