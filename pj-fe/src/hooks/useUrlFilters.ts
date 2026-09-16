import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

const DEFAULT_PAGE_SIZE = 12;

/**
 * Parse URL search parameters into API filter parameters
 */
export function parseProductFilters(params: Record<string, any>): any {
  const filters: any = {
    page: Number(params.page) || 1,
    pageSize: Number(params.pageSize) || DEFAULT_PAGE_SIZE,
  };

  // Search query - use 'name' param
  if (params.name && params.name.trim() !== '') {
    filters.name = params.name.trim();
  }

  // Sort
  if (params.sort) {
    filters.sort = params.sort;
  }

  // Price range - use 'min' and 'max' params
  const min = Number(params.min);
  const max = Number(params.max);
  if (!Number.isNaN(min) && min >= 0) {
    filters.min = min;
  }
  if (!Number.isNaN(max) && max > 0) {
    filters.max = max;
  }

  // Brands - use 'brand' param (should be array of strings)
  if (params.brand) {
    // If it comes from URLSearchParams as multiple keys, Next.js page props might merge them?
    // Actually in page.tsx we pass searchParams.
    // If multiple brand[] params, searchParams might be { 'brand[]': ['lg', 'motorola'] } or similar depending on parser.
    // But safely: check if it's string or array.
    // The previous implementation assumed comma separated: "lg,samsung"
    // But API wants "brand[]=lg&brand[]=samsung".
    // When reading from Next.js searchParams in server component, standard URLSearchParams.getAll('brand[]') would work.
    // Here `params` is likely an object from searchParams.

    // Let's handle string (comma separated fallback) or array
    let brands: string[] = [];

    if (Array.isArray(params.brand)) {
      brands = params.brand;
    } else if (typeof params.brand === 'string') {
      brands = params.brand.split(',').filter(Boolean);
    } else if (params['brand[]']) { // If it's brand[] key
      if (Array.isArray(params['brand[]'])) {
        brands = params['brand[]'];
      } else if (typeof params['brand[]'] === 'string') {
        brands = [params['brand[]']];
      }
    }

    if (brands.length > 0) {
      filters.brand = brands;
    }
  }

  // Operating System
  if (params.os && typeof params.os === 'string' && params.os.trim() !== '') {
    filters.os = params.os.trim();
  }

  // Condition
  if (params.condition && params.condition.trim() !== '') {
    filters.condition = params.condition;
  }

  return filters;
}

/**
 * Build query string from filter parameters for API request
 */
export function buildQueryString(params: any, isApiRequest = false): string {
  const query = new URLSearchParams();

  if (params.page) {
    query.set('page', String(params.page));
  }
  if (params.pageSize) {
    query.set('pageSize', String(params.pageSize));
  }
  if (params.name) {
    query.set('name', params.name);
  }
  if (params.min !== undefined) {
    query.set('min', String(params.min));
  }
  if (params.max !== undefined) {
    query.set('max', String(params.max));
  }

  if (params.sort) {
    query.set('sort', params.sort);
  }

  if (params.brand?.length) {
    if (isApiRequest) {
      // API requires brand[]=a&brand[]=b
      params.brand.forEach((b: string) => query.append('brand[]', b));
    } else {
      // Browser URL prefers brand=a,b (cleaner)
      query.set('brand', params.brand.join(','));
    }
  }

  if (params.os) {
    query.set('os', params.os);
  }
  if (params.condition) {
    query.set('condition', params.condition);
  }

  return query.toString();
}

export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Parse URL params into canonical filter state
  const canonicalFilters = useMemo(
    () => {
      // Convert URLSearchParams to a plain object for the parser
      const params: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        // Handle array keys like brand[]
        if (key.endsWith('[]')) {
          if (!params[key]) {
            params[key] = [];
          }
          params[key].push(value);
        } else {
          params[key] = value;
        }
      });
      return parseProductFilters(params);
    },
    [searchParams],
  );

  // Local filter state (for immediate UI updates before committing to URL)
  const [localFilters, setLocalFilters] = useState<any>(canonicalFilters);

  // Sync local state when URL changes (e.g., browser back/forward)
  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setLocalFilters(canonicalFilters);
  }, [canonicalFilters]);

  // Set a single filter value
  const setFilter = useCallback(
    (key: string, value: any) => {
      setLocalFilters((prev: any) => {
        const updated: any = {
          ...prev,
          [key]: value,
        };

        // Reset page on filter change, except when changing page itself
        if (key !== 'page') {
          updated.page = 1;
        }

        return updated;
      });
    },
    [],
  );

  // Set multiple filters at once
  const setFilters = useCallback((next: Record<string, any>) => {
    setLocalFilters((prev: any) => ({
      ...prev,
      ...next,
      page: typeof next.page === 'number' ? next.page : 1,
    }));
  }, []);

  // Commit local filters to URL immediately
  const commit = useCallback((filtersToCommit?: any) => {
    const filters = filtersToCommit || localFilters;
    const query = buildQueryString(filters);

    startTransition(() => {
      // Use push instead of replace to force server component re-render
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }, [localFilters, pathname, router]);

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
    setLocalFilters({
      brand: [],
      page: 1,
    });
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return {
    // Current filter state (local, may not be in URL yet)
    filters: localFilters,
    // Canonical state from URL
    canonicalFilters,
    // Update functions
    setFilter,
    setFilters,
    commit,
    commitDebounced,
    resetFilters,
    // Loading state
    isPending,
  };
}
