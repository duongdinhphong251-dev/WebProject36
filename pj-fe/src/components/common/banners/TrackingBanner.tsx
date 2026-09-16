'use client';

/**
 * @file TrackingBanner.tsx
 * @description Component wrapper tái sử dụng cho các banner có tracking GTM.
 *
 * Khi người dùng click vào bất kỳ vùng nào bên trong component này,
 * sự kiện `banner_click` sẽ tự động được push vào GTM DataLayer.
 *
 * @example
 * ```tsx
 * <TrackingBanner bannerName="fitness_banner">
 *   <img src="/fitness.jpg" alt="Fitness" />
 * </TrackingBanner>
 * ```
 *
 * @example Với className và element tùy chỉnh
 * ```tsx
 * <TrackingBanner
 *   bannerName="hero_banner"
 *   className="relative w-full"
 *   as="section"
 * >
 *   <HeroBannerContent />
 * </TrackingBanner>
 * ```
 */

import { trackBannerClick } from '@/libs/gtm';
import type { ElementType, MouseEvent, ReactNode } from 'react';

/** Danh sách HTML tag được phép dùng làm wrapper */
type AllowedTag = 'div' | 'section' | 'article' | 'aside' | 'span';

interface TrackingBannerProps {
  /** Tên định danh của banner, sẽ được gửi vào DataLayer */
  bannerName: string;
  /** Nội dung bên trong banner */
  children: ReactNode;
  /** Class CSS tuỳ chỉnh cho wrapper element */
  className?: string;
  /** Vị trí hiển thị của banner (ví dụ: 'home_slot', 'breadcrumb') */
  placement?: string;
  /** Đường dẫn đích khi click vào banner */
  targetUrl?: string;
  /** Thứ tự hiển thị của banner (1, 2, 3,...) */
  index?: number;
  /**
   * HTML tag dùng làm wrapper.
   * @default 'div'
   */
  as?: AllowedTag;
  /**
   * Click handler bổ sung (nếu cần xử lý thêm ngoài tracking).
   * Tracking GTM luôn được gọi trước.
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Wrapper component tự động tracking click banner vào GTM DataLayer.
 *
 * - Không lỗi khi SSR vì `trackBannerClick` tự bảo vệ `window` access.
 * - Sử dụng `'use client'` để đảm bảo event handler hoạt động đúng.
 */
export function TrackingBanner({
  bannerName,
  children,
  className,
  placement,
  targetUrl,
  index,
  as: Tag = 'div',
  onClick,
}: TrackingBannerProps) {
  function handleClick(event: MouseEvent<HTMLElement>): void {
    // Push sự kiện tracking vào GTM DataLayer
    trackBannerClick(bannerName, placement, targetUrl, undefined, index);

    // Gọi handler bổ sung nếu được truyền vào
    onClick?.(event);
  }

  const Component = Tag as ElementType;

  return (
    <Component
      className={className}
      onClick={handleClick}
      // Accessibility: thêm role và cursor để người dùng biết vùng này clickable
      role="button"
      style={{ cursor: 'pointer' }}
    >
      {children}
    </Component>
  );
}
