import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!['login', 'register', 'register-owner', 'logout'].includes(action)) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  if (action === 'logout') {
    const result = NextResponse.json({ ok: true });
    result.cookies.delete('session');
    return result;
  }
  const endpoint = action === 'register-owner' ? 'register/owner' : action;
  const response = await fetch(`${API_URL}/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await request.text() });
  const data: unknown = await response.json();
  const result = NextResponse.json(data, { status: response.status });
  if (response.ok && typeof data === 'object' && data !== null && 'token' in data && typeof data.token === 'string') {
    result.cookies.set('session', data.token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 });
  }
  return result;
}
