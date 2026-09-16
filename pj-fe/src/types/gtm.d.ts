/**
 * @file gtm.d.ts
 * @description TypeScript type declarations cho Google Tag Manager (GTM).
 *
 * Mở rộng interface `Window` để bổ sung typing cho:
 * - `window.dataLayer` — mảng dùng để truyền dữ liệu vào GTM
 * - `window.gtag`     — hàm Google Analytics 4 (nếu dùng gtag.js song song)
 *
 * File này được TypeScript tự động nhận diện nhờ cơ chế "ambient declaration"
 * (không cần import thủ công ở bất kỳ đâu).
 */

/** Kiểu cho một entry trong GTM DataLayer */
export interface DataLayerEntry {
  event?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    /**
     * GTM DataLayer — mảng chứa tất cả các event/variable
     * được push vào Google Tag Manager.
     *
     * Được khởi tạo bởi GTM snippet hoặc bởi `pushToDataLayer()`.
     */
    dataLayer: DataLayerEntry[];

    /**
     * Hàm `gtag` của Google Analytics 4 / Google Ads.
     * Có thể undefined nếu script gtag.js chưa được load.
     */
    gtag?: (...args: unknown[]) => void;
  }
}
