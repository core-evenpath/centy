import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookHmac } from '@/lib/shopify-service';
import { handleShopifyWebhook } from '@/actions/shopify-actions';

export async function POST(request: NextRequest) {
    const topic = request.headers.get('X-Shopify-Topic');
    const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain');

    if (!topic || !hmacHeader || !shopDomain) {
        return NextResponse.json({ error: 'Missing required headers' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const rawBody = await request.text();

    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiSecret) {
        console.error('❌ SHOPIFY_API_SECRET not configured');
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    if (!verifyWebhookHmac(rawBody, hmacHeader, apiSecret)) {
        console.error('❌ Invalid webhook HMAC for topic:', topic);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log(`🛍️ Webhook received: ${topic} from ${shopDomain}`);

    handleShopifyWebhook(topic, shopDomain, payload).catch((err) => {
        console.error(`❌ Webhook processing error for ${topic}:`, err);
    });

    return NextResponse.json({ success: true }, { status: 200 });
}


export async function GET() {
    return NextResponse.json(
        {
            ok: true,
            endpoint: '/api/webhooks/shopify',
            message: 'Shopify webhook endpoint is live. Send signed POST requests from Shopify webhooks.',
        },
        { status: 200 }
    );
}
