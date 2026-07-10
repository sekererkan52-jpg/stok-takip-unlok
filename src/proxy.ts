// src/proxy.ts
import { NextResponse, NextRequest } from 'next/server';
import { verifyToken } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes – allow without auth
  const publicPaths = ['/login', '/api/login', '/api/logout', '/api/reset-password'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;
  if (!token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Attach user info to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.id));
  requestHeaders.set('x-user-role', String(payload.role));
  if (payload.storeId) {
    requestHeaders.set('x-user-store-id', String(payload.storeId));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api\\/login|api\\/logout|login|_next\\/static|_next\\/image|favicon\\.ico).*)'],
};
