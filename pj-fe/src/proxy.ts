import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/_next/') || path.startsWith('/api/auth/') || /\.[a-zA-Z0-9]+$/.test(path)) return NextResponse.next();
  if (path === '/login' || path === '/register' || path === '/register/owner') return NextResponse.next();
  if (!request.cookies.get('session')) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  if (path === '/') return NextResponse.redirect(new URL('/vi', request.url));
  return NextResponse.next();
}

export const config = { matcher: '/((?!_next/static|_next/image|favicon.ico).*)' };
