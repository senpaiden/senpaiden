import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (process.env.NODE_ENV === 'development') {
      return withSecurityHeaders(NextResponse.next());
    }
    const adminKey = request.headers.get('x-admin-key') ?? request.nextUrl.searchParams.get('key');
    const expectedKey = process.env.ADMIN_SECRET_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }
  return withSecurityHeaders(NextResponse.next());
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|icon.png).*)'] };
