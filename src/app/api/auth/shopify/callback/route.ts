import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { completeShopifyOAuth } from '@/actions/shopify-actions';

function verifyHmac(query: URLSearchParams, secret: string): boolean {
    const hmac = query.get('hmac');
    if (!hmac) return false;

    const params = new URLSearchParams();
    query.forEach((value, key) => {
        if (key !== 'hmac') {
            params.append(key, value);
        }
    });

    const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    const hash = crypto
        .createHmac('sha256', secret)
        .update(sortedParams)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pingbox.io';
    const redirectBase = `${baseUrl}/partner/apps/shopify`;

    if (!code || !shop || !state || !hmac) {
        return NextResponse.redirect(
            `${redirectBase}?error=${encodeURIComponent('Missing required parameters from Shopify')}`
        );
    }

    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiSecret) {
        return NextResponse.redirect(
            `${redirectBase}?error=${encodeURIComponent('Server configuration error')}`
        );
    }

    if (!verifyHmac(searchParams, apiSecret)) {
        return NextResponse.redirect(
            `${redirectBase}?error=${encodeURIComponent('Invalid request signature')}`
        );
    }

    const result = await completeShopifyOAuth(code, shop, state);

    if (result.success) {
        return NextResponse.redirect(`${redirectBase}?connected=true`);
    }

    return NextResponse.redirect(
        `${redirectBase}?error=${encodeURIComponent(result.message)}`
    );
}
