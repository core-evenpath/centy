import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { encrypt } from '@/lib/encryption';

/**
 * Admin endpoint to update WhatsApp access token for a partner
 *
 * This allows updating to a permanent System User Access Token
 * which doesn't expire (unlike user access tokens from embedded signup).
 *
 * Usage:
 * POST /api/admin/update-whatsapp-token
 * Body: { partnerId: string, accessToken: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { partnerId, accessToken } = body;

        if (!partnerId) {
            return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
        }

        if (accessToken.length < 50) {
            return NextResponse.json({
                error: 'Access token appears too short. Please provide a valid token.'
            }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ error: 'Database not available' }, { status: 500 });
        }

        // 1. Check if partner exists and has WhatsApp config
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        const partnerData = partnerDoc.data();
        const existingConfig = partnerData?.metaWhatsAppConfig;

        if (!existingConfig) {
            return NextResponse.json({
                error: 'No WhatsApp configuration found for this partner. Please complete embedded signup first.'
            }, { status: 400 });
        }

        // 2. Validate the new token by making a test API call
        const phoneNumberId = existingConfig.phoneNumberId;

        if (phoneNumberId) {
            console.log('🔍 Validating new access token...');
            const validationResponse = await fetch(
                `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=id,display_phone_number,verified_name`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            const validationData = await validationResponse.json();

            if (!validationResponse.ok) {
                return NextResponse.json({
                    error: 'Token validation failed',
                    details: validationData.error?.message || 'Could not validate token with Meta API',
                }, { status: 400 });
            }

            console.log('✅ Token validated successfully:', {
                phoneNumber: validationData.display_phone_number,
                verifiedName: validationData.verified_name,
            });
        }

        // 3. Encrypt and store the new token
        const encryptedAccessToken = encrypt(accessToken);

        await db.collection('partners').doc(partnerId).update({
            'metaWhatsAppConfig.encryptedAccessToken': encryptedAccessToken,
            'metaWhatsAppConfig.tokenType': 'system_user', // Mark as system user token
            'metaWhatsAppConfig.tokenUpdatedAt': new Date().toISOString(),
            'metaWhatsAppConfig.tokenExpiresAt': null, // System user tokens don't expire
            'metaWhatsAppConfig.updatedAt': new Date().toISOString(),
        });

        console.log(`✅ Access token updated for partner: ${partnerId}`);

        return NextResponse.json({
            success: true,
            message: 'Access token updated successfully',
            details: {
                partnerId,
                tokenType: 'system_user',
                tokenLength: accessToken.length,
                expiresAt: 'Never (System User Token)',
            },
        });

    } catch (error: any) {
        console.error('❌ Error updating access token:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET endpoint to check current token status
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
        return NextResponse.json({ error: 'Missing partnerId parameter' }, { status: 400 });
    }

    if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }

        const config = partnerDoc.data()?.metaWhatsAppConfig;

        if (!config) {
            return NextResponse.json({
                hasConfig: false,
                message: 'No WhatsApp configuration found',
            });
        }

        return NextResponse.json({
            hasConfig: true,
            status: config.status,
            phoneNumberId: config.phoneNumberId,
            displayPhoneNumber: config.displayPhoneNumber,
            tokenType: config.tokenType || 'user_access_token',
            tokenUpdatedAt: config.tokenUpdatedAt,
            tokenExpiresAt: config.tokenExpiresAt || 'Not set',
            hasToken: !!config.encryptedAccessToken,
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
