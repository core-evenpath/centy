import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookHmac } from '@/lib/shopify-service';
import { handleComplianceWebhook } from '@/actions/shopify-actions';

export async function POST(request: NextRequest) {
    const topic = request.headers.get('X-Shopify-Topic');
    const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain');

    if (!hmacHeader || !shopDomain) {
        return NextResponse.json({ error: 'Missing required headers' }, { status: 401 });
    }

    const rawBody = await request.text();

    const apiSecret = process.env.SHOPIFY_API_SECRET;
    if (!apiSecret) {
        console.error('SHOPIFY_API_SECRET not configured');
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    if (!verifyWebhookHmac(rawBody, hmacHeader, apiSecret)) {
        console.error(`Invalid HMAC for compliance webhook: ${topic}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const webhookTopic = topic || 'unknown';
    console.log(`Compliance webhook: ${webhookTopic} from ${shopDomain}`);

    handleComplianceWebhook(webhookTopic, shopDomain, payload).catch((err) => {
        console.error(`Error processing compliance webhook ${webhookTopic}:`, err);
    });

    return NextResponse.json({ success: true }, { status: 200 });
}
