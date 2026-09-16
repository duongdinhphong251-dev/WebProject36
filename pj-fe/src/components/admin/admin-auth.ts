'use client';

export const ADMIN_API_BASE = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';
export const ADMIN_PROXY_BASE = '/admin/proxy';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function normalizeResponse<T>(payload: T | { data: T }): T {
  return (payload as { data?: T }).data ?? (payload as T);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function normalizePaginatedResponse<T>(payload: PaginatedResponse<T> | { data: T[]; meta?: PaginationMeta }) {
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    meta: payload.meta ?? {
      page: 1,
      limit: Array.isArray(payload.data) ? payload.data.length || 20 : 20,
      total: Array.isArray(payload.data) ? payload.data.length : 0,
      totalPages: 1,
    },
  };
}
