import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const API_URL = process.env.API_URL || 'http://localhost:8081/api/v1';

export async function api<T>(path: string): Promise<T> {
  const token = (await cookies()).get('session')?.value;
  if (!token) redirect('/login');
  const response = await fetch(`${API_URL}/${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (response.status === 401) redirect('/login');
  if (!response.ok) throw new Error(`API ${path}: ${response.status}`);
  return response.json() as Promise<T>;
}

export type User = { id: string; phone: string; fullName: string; role: 'user' | 'spa_owner' | 'admin'; status: string };
export type City = { id: number; nameVi: string | null; nameEn: string | null; slug: string | null };
export type Spa = { id: string; name: string | null; address: string | null; description: string | null; phone?: string | null; zalo?: string | null; image?: string | null; city?: string | null; cityId?: number | null; approvalStatus?: string; reviews?: { rating: number; comment: string; author: string }[] };
export type Deal = { id: number; spaId: string; spaName?: string | null; titleVi: string | null; titleEn?: string | null; description?: string | null; image?: string | null; priceVnd?: number | null; discountPercent?: string | null; endAt?: string | null; approvalStatus?: string };
