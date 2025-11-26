import { NextRequest, NextResponse } from 'next/server';
import { getDecryptedAccessToken, getPartnerMetaConfig } from '@/lib/meta-whatsapp-service';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const partnerId = searchParams.get('partnerId');
        const waId = searchParams.get('waId');

        if (!partnerId || !waId) {
            return NextResponse.json({
                error: 'partnerId and waId required',
                usage: '?partnerId=xxx&waId=919655574591'
            }, { status: 400 });
        }

        const config = await getPartnerMetaConfig(partnerId);
        if (!config) {
            return NextResponse.json({ error: 'Partner config not found' }, { status: 404 });
        }

        const accessToken = await getDecryptedAccessToken(partnerId);

        // Test different API endpoints
        const tests = [];

        // Test 1: Profile picture endpoint (documented)
        try {
            const response1 = await fetch(
                `https://graph.facebook.com/v18.0/${waId}/profile_picture`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            tests.push({
                endpoint: `/v18.0/${waId}/profile_picture`,
                status: response1.status,
                ok: response1.ok,
                body: response1.ok ? await response1.json() : await response1.text()
            });
        } catch (e: any) {
            tests.push({
                endpoint: `/v18.0/${waId}/profile_picture`,
                error: e.message
            });
        }

        // Test 2: Try with phone number ID instead
        try {
            const response2 = await fetch(
                `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            tests.push({
                endpoint: `/v18.0/${config.phoneNumberId}`,
                status: response2.status,
                ok: response2.ok,
                body: response2.ok ? await response2.json() : await response2.text()
            });
        } catch (e: any) {
            tests.push({
                endpoint: `/v18.0/${config.phoneNumberId}`,
                error: e.message
            });
        }

        return NextResponse.json({
            partnerId,
            waId,
            phoneNumberId: config.phoneNumberId,
            tests,
            note: 'Profile pictures may not be available via API - this is a Meta WhatsApp Business limitation'
        });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
