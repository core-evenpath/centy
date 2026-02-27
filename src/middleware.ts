import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get shop parameter from query string
  const shop = request.nextUrl.searchParams.get('shop');

  if (shop) {
    // Embedded app - allow framing from Shopify admin and the specific shop
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors https://${shop} https://admin.shopify.com`
    );
  } else {
    // No shop parameter - disallow framing
    response.headers.set(
      'Content-Security-Policy',
      "frame-ancestors 'none'"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
