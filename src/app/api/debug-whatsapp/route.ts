import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '10');
        const partnerId = searchParams.get('partnerId');

        console.log('🔍 Checking recent WhatsApp messages...');

        // Get recent webhook logs
        let logsQuery = db.collection('webhookLogs')
            .where('platform', '==', 'meta_whatsapp')
            .orderBy('timestamp', 'desc')
            .limit(limit);

        if (partnerId) {
            logsQuery = logsQuery.where('partnerId', '==', partnerId);
        }

        const logsSnapshot = await logsQuery.get();
        const logs = logsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || 'unknown'
        }));

        // Get recent messages
        let messagesQuery = db.collection('metaWhatsAppMessages')
            .orderBy('createdAt', 'desc')
            .limit(limit);

        if (partnerId) {
            messagesQuery = messagesQuery.where('partnerId', '==', partnerId);
        }

        const messagesSnapshot = await messagesQuery.get();
        const messages = messagesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type,
                content: data.content?.substring(0, 50) || '',
                direction: data.direction,
                hasMedia: !!data.metaMetadata?.mediaUrl,
                mediaUrl: data.metaMetadata?.mediaUrl || null,
                mediaId: data.metaMetadata?.mediaId || null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || 'unknown'
            };
        });

        // Check for image messages without mediaUrl (these failed to process)
        const failedImages = messages.filter(m =>
            (m.type === 'image' || m.type === 'video' || m.type === 'document') &&
            !m.hasMedia &&
            m.direction === 'inbound'
        );

        return NextResponse.json({
            success: true,
            summary: {
                totalWebhookLogs: logs.length,
                totalMessages: messages.length,
                failedMediaMessages: failedImages.length
            },
            recentWebhookLogs: logs.slice(0, 5),
            recentMessages: messages.slice(0, 10),
            failedMediaMessages: failedImages,
            diagnostics: {
                webhooksWorking: logs.length > 0,
                messagesReceived: messages.length > 0,
                mediaProcessingIssue: failedImages.length > 0,
                recommendation: failedImages.length > 0
                    ? 'Media messages are being received but not processed. Check server logs for errors.'
                    : logs.length === 0
                        ? 'No webhooks received. Check Meta webhook configuration.'
                        : 'System appears to be working correctly.'
            }
        });

    } catch (error: any) {
        console.error('❌ Diagnostic error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
