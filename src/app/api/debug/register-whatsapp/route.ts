import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedAccessToken } from '@/lib/meta-whatsapp-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { partnerId, pin } = body;

        if (!partnerId || !pin) {
            return NextResponse.json({ error: 'Missing partnerId or pin' }, { status: 400 });
        }

        if (pin.length !== 6) {
            return NextResponse.json({ error: 'PIN must be 6 digits' }, { status: 400 });
        }

        // 1. Get the access token and phone number ID
        const config = await getDecryptedAccessToken(partnerId);
        if (!config) {
            return NextResponse.json({ error: 'Partner configuration not found' }, { status: 404 });
        }

        const { phoneNumberId, accessToken } = config;

        console.log(`🔌 Registering Phone Number ID: ${phoneNumberId}`);

        // 2. Call Meta Register Endpoint
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/register`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                pin: pin
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Registration failed:', data);
            return NextResponse.json({
                success: false,
                error: data.error?.message || 'Registration failed',
                details: data
            }, { status: response.status });
        }

        console.log('✅ Registration successful:', data);
        return NextResponse.json({
            success: true,
            message: 'Phone number registered successfully',
            data
        });

    } catch (error: any) {
        console.error('❌ Registration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
