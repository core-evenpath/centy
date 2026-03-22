import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { widgetId, conversationId, name, contact, contactType, conversionType, itemName, details } = body;

        if (!contact || !conversionType) {
            return NextResponse.json({ error: 'Contact and conversionType are required' }, { status: 400 });
        }

        // Resolve partnerId from widgetId
        let partnerId: string | undefined;
        if (widgetId) {
            const widgetDoc = await adminDb.collection('relayWidgets').doc(widgetId).get();
            if (widgetDoc.exists) {
                partnerId = widgetDoc.data()?.partnerId;
            }
        }

        const leadData = {
            widgetId: widgetId || null,
            conversationId: conversationId || null,
            partnerId: partnerId || null,
            name: name || null,
            contact,
            contactType: contactType || 'phone',
            conversionType,
            itemName: itemName || null,
            details: details || null,
            status: 'new',
            createdAt: new Date().toISOString(),
        };

        const docRef = await adminDb.collection('relayLeads').add(leadData);

        return NextResponse.json({
            success: true,
            leadId: docRef.id,
        });
    } catch (error) {
        console.error('Lead capture error:', error);
        return NextResponse.json(
            { error: 'Failed to capture lead' },
            { status: 500 }
        );
    }
}
