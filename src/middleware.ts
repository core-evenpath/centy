import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'app', 'admin', 'partner', 'relay',
  'mail', 'smtp', 'ftp', 'docs', 'help', 'support',
  'status', 'blog', 'cdn', 'assets', 'static',
  'dev', 'staging', 'test', 'demo',
]);

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  let slug: string | null = null;

  if (hostname.endsWith('.pingbox.io')) {
    slug = hostname.replace('.pingbox.io', '');
  } else if (hostname.includes('.localhost')) {
    slug = hostname.split('.localhost')[0];
  }

  if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
    const url = request.nextUrl.clone();
    url.pathname = `/relay/s/${slug}`;
    return NextResponse.rewrite(url);
  }

  const response = NextResponse.next();

  const shop = request.nextUrl.searchParams.get('shop');

  if (shop) {
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors https://${shop} https://admin.shopify.com`
    );
  } else {
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'none'"
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|relay/widget.js).*)',
  ],
};
