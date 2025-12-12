import { NextRequest, NextResponse } from 'next/server';

const META_API_VERSION = 'v24.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Authorization code is required' },
                { status: 400 }
            );
        }

        const appId = process.env.NEXT_PUBLIC_META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;

        if (!appId || !appSecret) {
            console.error('❌ Meta app credentials not configured');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const tokenUrl = `${META_API_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;

        console.log('🔄 Exchanging code for token via API route...');

        const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Token exchange failed:', data);
            return NextResponse.json(
                {
                    success: false,
                    error: data.error?.message || 'Failed to exchange code for token',
                    details: data.error,
                },
                { status: 400 }
            );
        }

        console.log('✅ Token exchange successful via API route');

        return NextResponse.json({
            success: true,
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
        });
    } catch (error: any) {
        console.error('❌ Token exchange error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
