import axios from 'axios';
import { API_V1_PREFIX } from '@/constants/api';
import { x_source } from '@/constants/common';

const base = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';

/** Axios instance nhẹ cho tracking — không cần auth, không qua handleResponse. */
const trackingApi = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
    'X-Source': x_source,
  },
});

/** SSR / client: tổng view+click spa + mọi deal của spa. */
export async function getSpaStoreEngagementCount(spaId: string): Promise<number> {
  try {
    const res = await trackingApi.get<{ data?: { viewCount?: number } }>(
      `${API_V1_PREFIX}/tracking/spa/${encodeURIComponent(spaId)}/store-engagement`,
    );
    const n = res.data?.data?.viewCount;
    return typeof n === 'number' && Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Ghi nhận mở trang (client). Fire-and-forget. */
export async function postRecordView(
  slug: string,
  entityType: 'deal' | 'spa',
): Promise<void> {
  if (!slug) return;
  try {
    await trackingApi.post(
      `${API_V1_PREFIX}/tracking/view/${encodeURIComponent(slug)}`,
      {},
      { headers: { 'x-entity-type': entityType } },
    );
  } catch {
    /* ignore */
  }
}

/** Ghi nhận click deal (client). Fire-and-forget. */
export async function postRecordClick(
  slug: string,
  entityType: 'deal' | 'spa',
): Promise<void> {
  if (!slug) return;
  try {
    await trackingApi.post(
      `${API_V1_PREFIX}/tracking/click`,
      { slug, entityType },
    );
  } catch {
    /* ignore */
  }
}
