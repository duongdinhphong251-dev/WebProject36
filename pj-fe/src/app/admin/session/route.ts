import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  hasValidAdminSession,
} from '@/libs/admin-session';

const API_BASE = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';

function createUnauthorizedResponse(message: string) {
  return NextResponse.json({ message }, { status: 401 });
}

export async function GET() {
  const authenticated = await hasValidAdminSession();
  return NextResponse.json({ authenticated });
}

export async function POST(request: Request) {
  if (!API_BASE) {
    return NextResponse.json({ message: 'Admin API base is not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null) as { username?: string; password?: string } | null;
  const username = body?.username?.trim() ?? '';
  const password = body?.password?.trim() ?? '';

  if (!username || !password) {
    return createUnauthorizedResponse('Username and password are required');
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return createUnauthorizedResponse('Invalid admin credentials');
    }

    const payload = await response.json().catch(() => null) as { token?: string; data?: { token?: string } } | null;
    const token = payload?.data?.token?.trim() ?? payload?.token?.trim() ?? '';
    if (!token) {
      return NextResponse.json({ message: 'Admin session token is missing' }, { status: 502 });
    }

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
  } catch {
    return NextResponse.json({ message: 'Cannot reach admin API' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true });
}
