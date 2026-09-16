'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { GeoChild } from '@/types/geo';
import { buildGeoUrl } from '@/libs/geo-service';

interface GeoLinkProps {
  geoChild: GeoChild;
  baseUrl: string;
  className?: string;
}

export function GeoLink({
  geoChild,
  baseUrl,
  className = '',
}: GeoLinkProps) {
  const searchParams = useSearchParams();

  // Build URL using the geoChild's path (which includes all ancestors and itself)
  const url = buildGeoUrl(baseUrl, geoChild.path);

  // Preserve existing query params (gender, price, rating)
  const queryString = searchParams.toString();
  const urlWithParams = queryString ? `${url}?${queryString}` : url;

  return (
    <Link
      href={urlWithParams}
      className={`block px-4 py-2 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-colors ${className}`}
    >
      <span className="text-sm font-medium text-gray-700 hover:text-brand-500">
        {geoChild.name}
      </span>
    </Link>
  );
}
