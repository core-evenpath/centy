import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId');

    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        environment: {
            hasVerifyToken: !!process.env.META_WHATSAPP_VERIFY_TOKEN,
            hasEncryptionKey: !!process.env.ENCRYPTION_SECRET_KEY,
        },
        database: {
            connected: !!db,
        },
        partner: null,
    };

    if (!db) {
        return NextResponse.json({
            ...diagnostics,
            error: 'Database not connected',
        });
    }

    try {
        if (partnerId) {
            const partnerDoc = await db.collection('partners').doc(partnerId).get();

            if (partnerDoc.exists) {
                const data = partnerDoc.data();
                const config = data?.metaWhatsAppConfig;

                diagnostics.partner = {
                    id: partnerId,
                    hasMetaConfig: !!config,
                    status: config?.status || 'not configured',
                    phoneNumberId: config?.phoneNumberId || null,
                    webhookConfigured: config?.webhookConfigured || false,
                };
            } else {
                diagnostics.partner = { error: 'Partner not found' };
            }
        }

        return NextResponse.json(diagnostics);

    } catch (error: any) {
        return NextResponse.json({
            ...diagnostics,
            error: error.message,
        }, { status: 500 });
    }
}
