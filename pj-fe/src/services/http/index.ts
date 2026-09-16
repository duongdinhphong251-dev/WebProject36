import { x_source } from '@/constants/common';

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const CACHE_DISABLE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function resolveTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : DEFAULT_TIMEOUT_MS;
}

function shouldDisableApiCache(): boolean {
  const raw = process.env.NEXT_PUBLIC_DISABLE_API_CACHE?.trim().toLowerCase();
  return raw ? CACHE_DISABLE_VALUES.has(raw) : false;
}

function resolveBaseUrl(explicitBaseUrl?: string): string {
  const rawBaseUrl =
    explicitBaseUrl
    ?? process.env.NEXT_PUBLIC_API
    ?? process.env.NEXT_PUBLIC_API_DOMAIN
    ?? 'http://35.240.213.110';

  if (typeof window !== 'undefined') return rawBaseUrl;

  try {
    const url = new URL(rawBaseUrl);
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    return rawBaseUrl;
  }

  return rawBaseUrl;
}

function buildGetOptions(options?: Omit<CustomOptions, 'body'>): Omit<CustomOptions, 'body'> {
  if (shouldDisableApiCache()) {
    return {
      ...options,
      cache: 'no-store',
      next: undefined,
    };
  }

  return {
    next: { revalidate: 0 },
    ...options,
  };
}

export class HttpError extends Error {
  status: number;
  data: {
    message: string;
    [key: string]: any;
  };

  constructor({ status, data }: { status: number; data: any }) {
    super('Http Error');
    this.status = status;
    this.data = data;
  }
}

const request = async <ResponseData>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
  url: string, 
  options?: CustomOptions | undefined,
  maxRetries = method === 'GET' ? 2 : 0
) => {
  let body: FormData | string | undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }
  const baseHeaders: {
    [key: string]: string;
  }
    = body instanceof FormData
      ? {}
      : {
        'Content-Type': 'application/json',
      };

  const baseUrl = resolveBaseUrl(options?.baseUrl);

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}${url}`;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const timeoutMs = resolveTimeoutMs();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    const externalSignal = options?.signal;

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
      }
    }

    let res: Response;
    try {
      res = await fetch(fullUrl, {
        ...options,
        headers: {
          ...baseHeaders,
          ...options?.headers,
          'X-Source': x_source,
          'X-Request-Build-Token': process.env.BUILD_TOKEN ?? '',
        } as any,
        body,
        method,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      let responseData: any;

      if (contentType.includes('application/json')) {
        // JSON hợp lệ
        responseData = await res.json();
      } else {
        // ❗ Non-JSON (HTML/text) → đọc text để debug
        const text = await res.text();
        responseData = { message: 'Non-JSON response', body: text.slice(0, 600) };
      }

      // Always log HTTP anomalies — needed for Cloud Run / production tracing
      if (!res.ok || !contentType.includes('application/json')) {
        console.error('[HTTP] upstream anomaly', {
          method,
          url: fullUrl,
          status: res.status,
          contentType,
          redirected: res.redirected,
          bodySnippet: typeof responseData?.body === 'string' ? responseData.body.slice(0, 300) : undefined,
        });
      }

      if (!res.ok) {
        // We only retry on 5xx errors or network timeouts. If it's a 4xx, we throw immediately.
        if (res.status >= 500 && attempt < maxRetries) {
          console.warn(`[HTTP] 5xx Error on ${fullUrl}, retrying (${attempt + 1}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw new HttpError({ status: res.status, data: responseData });
      }

      return { status: res.status, data: responseData as ResponseData };

    } catch (error) {
      clearTimeout(timeoutId);
      const reason = error instanceof Error ? error.message : 'Unknown fetch error';
      
      const isTimeoutOrAbort = reason.includes('aborted') || reason.includes('AbortError') || (error instanceof Error && error.name === 'AbortError');
      const isNetworkError = reason.includes('fetch failed');
      
      if ((isTimeoutOrAbort || isNetworkError) && attempt < maxRetries) {
         console.warn(`[HTTP] Timeout/Network error on ${fullUrl}, retrying (${attempt + 1}/${maxRetries})...`);
         await new Promise(r => setTimeout(r, 1000));
         continue;
      }

      if (isTimeoutOrAbort) {
        const e = new Error(reason);
        e.name = 'AbortError';
        throw e;
      }
      
      console.error('[HTTP] fetch failed', {
        method,
        url: fullUrl,
        reason,
      });
      throw new Error(`Fetch failed for ${method} ${fullUrl}: ${reason}`);
    }
  }

  throw new Error('Unreachable code in request retries');
};

const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('GET', url, buildGetOptions(options));
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('POST', url, { ...options, body });
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PUT', url, { ...options, body });
  },
  delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('DELETE', url, { ...options });
  },
};

export default http;
