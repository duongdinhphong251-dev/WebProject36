import { NextResponse } from 'next/server';
import { getAdminSessionAccessToken, hasValidAdminSession } from '@/libs/admin-session';

const API_BASE = process.env.NEXT_PUBLIC_API ?? process.env.NEXT_PUBLIC_API_DOMAIN ?? '';

async function forwardAdminRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!API_BASE) {
    return NextResponse.json({ message: 'Admin API base is not configured' }, { status: 500 });
  }

  const isAuthenticated = await hasValidAdminSession();
  if (!isAuthenticated) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = await getAdminSessionAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await context.params;
  const targetUrl = new URL(`${API_BASE}/api/v1/admin/${path.join('/')}`);
  const requestUrl = new URL(request.url);
  targetUrl.search = requestUrl.search;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${accessToken}`);
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get('content-type');
    if (responseContentType) {
      responseHeaders.set('content-type', responseContentType);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ message: 'Cannot reach admin API' }, { status: 502 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forwardAdminRequest(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forwardAdminRequest(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forwardAdminRequest(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return forwardAdminRequest(request, context);
}
