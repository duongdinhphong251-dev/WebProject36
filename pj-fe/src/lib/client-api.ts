// Browser requests go through Next.js; the session cookie stays HttpOnly.
export async function requestJson<T = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: object | FormData,
): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(url, {
    method,
    headers: multipart ? undefined : { 'Content-Type': 'application/json' },
    body: multipart ? body : body ? JSON.stringify(body) : undefined,
  });
  if (
    response.redirected ||
    (response.status === 401 && url.startsWith('/api/backend/'))
  )
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');

  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message;
    throw new Error(message || 'Có lỗi xảy ra');
  }
  return data as T;
}

export function errorMessage(
  error: unknown,
  fallback = 'Không thể kết nối máy chủ.',
) {
  return error instanceof Error && !(error instanceof TypeError)
    ? error.message
    : fallback;
}
