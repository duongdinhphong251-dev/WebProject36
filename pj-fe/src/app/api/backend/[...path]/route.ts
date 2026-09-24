import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = (await cookies()).get('session')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { path } = await context.params;
  const response = await fetch(`${API_URL}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, {
    method: request.method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    cache: 'no-store',
  });
  return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json' } });
}
export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
