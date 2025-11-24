import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    if (!db) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get('partnerId') || 'test_partner_id';

    try {
        const results = {};

        // 1. metaWhatsAppConversations
        const convRef = db.collection('metaWhatsAppConversations').doc('init_test_conversation');
        await convRef.set({
            partnerId,
            platform: 'meta_whatsapp',
            customerPhone: '+15550000000',
            customerName: 'Test Customer',
            lastMessageAt: FieldValue.serverTimestamp(),
            unreadCount: 0,
            status: 'active',
            createdAt: FieldValue.serverTimestamp(),
            _isInitDoc: true
        }, { merge: true });
        results['metaWhatsAppConversations'] = 'Created/Updated init_test_conversation';

        // 2. metaWhatsAppMessages
        const msgRef = db.collection('metaWhatsAppMessages').doc('init_test_message');
        await msgRef.set({
            partnerId,
            conversationId: 'init_test_conversation',
            type: 'text',
            direction: 'inbound',
            content: 'This is a test message to initialize the collection',
            createdAt: FieldValue.serverTimestamp(),
            _isInitDoc: true
        }, { merge: true });
        results['metaWhatsAppMessages'] = 'Created/Updated init_test_message';

        // 3. metaMessageTemplates
        const tplRef = db.collection('metaMessageTemplates').doc('init_test_template');
        await tplRef.set({
            partnerId,
            name: 'hello_world',
            language: 'en_US',
            status: 'approved',
            category: 'MARKETING',
            components: [],
            createdAt: FieldValue.serverTimestamp(),
            _isInitDoc: true
        }, { merge: true });
        results['metaMessageTemplates'] = 'Created/Updated init_test_template';

        // 4. webhookLogs
        const logRef = db.collection('webhookLogs').doc('init_test_log');
        await logRef.set({
            partnerId,
            type: 'init_check',
            payload: { test: true },
            timestamp: FieldValue.serverTimestamp(),
            _isInitDoc: true
        }, { merge: true });
        results['webhookLogs'] = 'Created/Updated init_test_log';

        return NextResponse.json({
            success: true,
            message: 'Collections initialized successfully',
            results
        });

    } catch (error: any) {
        console.error('Error initializing collections:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
