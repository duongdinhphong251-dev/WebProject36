import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'tuoi-admin-session';
const API_BASE = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';

export async function hasValidAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !API_BASE) return false;

  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/auth/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAdminSessionAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}
