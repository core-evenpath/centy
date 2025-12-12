import { NextRequest, NextResponse } from 'next/server';
import { getPlatformMetaConfig } from '@/actions/admin-platform-actions';

const ENV_VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN;

export async function GET(request: NextRequest) {
    // This endpoint helps test webhook configuration
    const platformConfig = await getPlatformMetaConfig();
    const verifyToken = platformConfig?.verifyToken || ENV_VERIFY_TOKEN;

    return NextResponse.json({
        status: 'ok',
        message: 'Webhook endpoint is reachable',
        timestamp: new Date().toISOString(),
        configuration: {
            callbackUrl: 'https://www.centy.dev/api/webhooks/meta/whatsapp',
            verifyTokenConfigured: !!verifyToken,
            verifyTokenHint: verifyToken ? `${verifyToken.substring(0, 4)}...${verifyToken.substring(verifyToken.length - 4)}` : null,
        },
        instructions: {
            step1: 'Go to Meta Business Suite → Your App → Webhooks',
            step2: 'Set Callback URL to: https://www.centy.dev/api/webhooks/meta/whatsapp',
            step3: 'Set Verify Token to match your META_WHATSAPP_VERIFY_TOKEN env variable',
            step4: 'Subscribe to the "messages" field',
            step5: 'Click "Verify and Save"',
        }
    });
}

// Simulate a webhook POST to test logging
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));

    console.log('🧪 TEST WEBHOOK POST RECEIVED:', JSON.stringify(body, null, 2));

    return NextResponse.json({
        status: 'received',
        message: 'Test webhook POST received successfully',
        timestamp: new Date().toISOString(),
        receivedPayload: body,
    });
}
