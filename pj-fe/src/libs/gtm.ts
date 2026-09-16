/**
 * @file gtm.ts
 * @description Utility functions cho Google Tag Manager (GTM) DataLayer.
 *
 * - An toàn với SSR: tất cả truy cập `window` đều được bảo vệ bằng
 *   kiểm tra `typeof window !== 'undefined'`.
 * - Tương thích Next.js App Router (có thể import ở cả Server và Client Component,
 *   nhưng chỉ thực sự push dữ liệu khi chạy trên client).
 */

/** Cấu trúc payload cho sự kiện banner_click */
export interface BannerClickPayload {
  event: 'banner_click';
  banner_name: string;
  banner_placement?: string;
  ga_click_tag?: string;
  target_url?: string;
  /** Pathname của trang hiện tại, ví dụ: "/vi/home" */
  page_path: string;
  /** Full URL của trang hiện tại */
  page_url: string;
}

/**
 * Push một object vào GTM DataLayer.
 *
 * Khởi tạo `window.dataLayer` nếu chưa tồn tại.
 * Hàm này là no-op khi chạy phía server (SSR/SSG).
 *
 * @param payload - Object bất kỳ hợp lệ với GTM DataLayer schema
 */
export function pushToDataLayer(payload: Record<string, unknown>): void {
  // Bảo vệ SSR: không truy cập `window` trên server
  if (typeof window === 'undefined') return;

  // Khởi tạo dataLayer nếu chưa có
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

/**
 * Gửi event trực tiếp lên Google Analytics 4 (GA4) qua hàm gtag.
 * Hỗ trợ dự án cài Google Tag trực tiếp (không qua GTM).
 *
 * @param eventName - Tên sự kiện (ví dụ: 'banner_click', 'deal_click')
 * @param params - Các thông số sự kiện đi kèm
 */
export function sendGAEvent(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  if (typeof window.gtag === 'function') {
    // Gọi hàm gtag trực tiếp
    window.gtag('event', eventName, params);
  } else {
    // Fallback nếu không có gtag (hoặc nếu gtag dùng dataLayer làm hàng đợi)
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: eventName, ...params });
  }
}

/**
 * Tracking sự kiện click banner vào GTM DataLayer.
 *
 * Tự động lấy `page_path` và `page_url` từ `window.location`.
 *
 * @param bannerName - Tên định danh của banner, ví dụ: "fitness_banner"
 *
 * @example
 * ```tsx
 * <Button onClick={() => trackBannerClick('fitness_banner')}>
 *   Xem chi tiết
 * </Button>
 * ```
 */
export function trackBannerClick(
  bannerName: string,
  placement?: string,
  targetUrl?: string,
  gaClickTag?: string,
  index?: number
): void {
  if (typeof window === 'undefined') return;

  // Kết hợp placement và index thành dạng "home_slot_1", "home_slot_2"...
  const formattedPlacement = placement && index !== undefined
    ? `${placement}_${index}`
    : placement;

  const payload: Omit<BannerClickPayload, 'event'> = {
    banner_name: bannerName,
    banner_placement: formattedPlacement,
    target_url: targetUrl,
    ga_click_tag: gaClickTag,
    page_path: window.location.pathname,
    page_url: window.location.href,
  };

  sendGAEvent('banner_click', payload as unknown as Record<string, unknown>);
}

/** Cấu trúc payload cho sự kiện deal_click */
export interface DealClickPayload {
  event: 'deal_click';
  deal_slug: string;
  page_path: string;
  page_url: string;
}

/**
 * Tracking sự kiện click deal vào GTM DataLayer.
 *
 * Tự động lấy `page_path` và `page_url` từ `window.location`.
 *
 * @param dealSlug - Canonical slug của deal.
 */
export function trackDealClick(dealSlug: string): void {
  if (typeof window === 'undefined') return;

  const payload: Omit<DealClickPayload, 'event'> = {
    deal_slug: dealSlug,
    page_path: window.location.pathname,
    page_url: window.location.href,
  };

  sendGAEvent('deal_click', payload as unknown as Record<string, unknown>);
}
