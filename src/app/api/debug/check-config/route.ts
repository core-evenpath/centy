import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId');

        if (!partnerId) {
            return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
        }

        // Check metaWhatsAppConfig
        const configDoc = await adminDb
            .collection('metaWhatsAppConfig')
            .doc(partnerId)
            .get();

        // Check metaPhoneMappings
        const mappingsSnapshot = await adminDb
            .collection('metaPhoneMappings')
            .get();

        const mappings = mappingsSnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        }));

        return NextResponse.json({
            config: configDoc.exists ? {
                id: configDoc.id,
                ...configDoc.data()
            } : null,
            phoneMappings: mappings
        });

    } catch (error: any) {
        console.error('Error checking config:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
