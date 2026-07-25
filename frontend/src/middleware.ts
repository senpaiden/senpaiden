import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminKey = request.headers.get('x-admin-key') ?? request.nextUrl.searchParams.get('key');
    const expectedKey = process.env.ADMIN_SECRET_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
