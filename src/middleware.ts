import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'app', 'admin', 'partner', 'relay',
  'mail', 'smtp', 'ftp', 'docs', 'help', 'support',
  'status', 'blog', 'cdn', 'assets', 'static',
  'dev', 'staging', 'test', 'demo',
]);

const RELAY_DOMAIN = process.env.NEXT_PUBLIC_RELAY_DOMAIN || 'pingbox.io';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  let slug: string | null = null;

  if (hostname.endsWith(`.${RELAY_DOMAIN}`)) {
    slug = hostname.replace(`.${RELAY_DOMAIN}`, '');
  } else if (hostname.includes('.localhost')) {
    slug = hostname.split('.localhost')[0];
  }

  if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
    const { pathname } = request.nextUrl;
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
      const url = request.nextUrl.clone();
      url.pathname = `/relay/s/${slug}`;
      return NextResponse.rewrite(url);
    }
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
