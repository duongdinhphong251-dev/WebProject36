'use client';

/**
 * @file BannerClickLink.tsx
 * @description Component Link hoặc Thẻ anchor hỗ trợ tracking tự động khi click.
 *
 * Tận dụng utility `pushToDataLayer` và các type declaration từ `gtm.d.ts`.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackBannerClick } from '@/libs/gtm';

interface BannerClickLinkProps {
  href: string;
  className?: string;
  gaClickTag?: string | null;
  bannerName: string;
  placement: 'home_slot' | 'breadcrumb';
  children: ReactNode;
  /** Vị trí thứ tự của banner (1, 2, 3,...) */
  index?: number;
}

export function BannerClickLink({
  href,
  className,
  gaClickTag,
  bannerName,
  placement,
  children,
  index,
}: BannerClickLinkProps) {
  const isExternal = /^https?:\/\//i.test(href);

  function handleClick() {
    try {
      trackBannerClick(bannerName, placement, href, gaClickTag ?? undefined, index);
    } catch (error) {
      console.log('error', error)
    }
  }

  if (isExternal) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={bannerName}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      aria-label={bannerName}
    >
      {children}
    </Link>
  );
}

