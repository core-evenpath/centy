import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { findPartnerByPhoneNumberId, processAndUploadMedia, getWhatsAppProfilePicture } from '@/lib/meta-whatsapp-service';
import { getPlatformMetaConfig, getDecryptedAppSecret } from '@/actions/admin-platform-actions';
import crypto from 'crypto';
import type {
    MetaWebhookPayload,
    MetaWebhookMessage,
    MetaWebhookStatus,
    MetaWhatsAppMessage,
    MetaWhatsAppConversation
} from '@/lib/types-meta-whatsapp';

// Fallback to env var if platform config is not set
const ENV_VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Fetch platform config
    const platformConfig = await getPlatformMetaConfig();
    const expectedToken = platformConfig?.verifyToken || ENV_VERIFY_TOKEN;

    console.log('🔔 Meta Webhook Verification Request:', {
        mode,
        token,
        expectedToken: expectedToken ? '***' : 'not_set',
        match: token === expectedToken
    });

    if (mode === 'subscribe' && token === expectedToken) {
        console.log('✅ Webhook verified successfully');
        return new NextResponse(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    console.error('❌ Webhook verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
    console.log('\n🔔 ========== META WHATSAPP WEBHOOK ==========');
    const startTime = Date.now();

    // 1. Get Raw Body for Signature Verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // 2. Verify Signature if App Secret is configured
    const appSecret = await getDecryptedAppSecret();

    if (appSecret && signature) {
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', appSecret)
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('❌ Invalid Webhook Signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        console.log('🔐 Webhook Signature Verified');
    } else if (!appSecret) {
        console.warn('⚠️ App Secret not configured in Admin - skipping signature verification');
    }

    const webhookLogData: any = {
        timestamp: FieldValue.serverTimestamp(),
        platform: 'meta_whatsapp',
        success: false,
        error: null,
        payload: {},
        processingTimeMs: 0,
    };

    try {
        const payload: MetaWebhookPayload = JSON.parse(rawBody);
        webhookLogData.payload = payload;

        console.log('📦 Webhook payload received');

        if (payload.object !== 'whatsapp_business_account') {
            console.log('⚠️ Not a WhatsApp Business webhook, ignoring');
            return NextResponse.json({ status: 'ignored' }, { status: 200 });
        }

        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                if (change.field !== 'messages') continue;

                const value = change.value;
                const phoneNumberId = value.metadata.phone_number_id;
                const displayPhoneNumber = value.metadata.display_phone_number;

                console.log(`📱 Phone Number ID: ${phoneNumberId}`);
                console.log(`📱 Display Number: ${displayPhoneNumber}`);

                const partnerId = await findPartnerByPhoneNumberId(phoneNumberId);

                if (!partnerId) {
                    console.error(`❌ No partner found for phoneNumberId: ${phoneNumberId}`);
                    webhookLogData.error = `Partner not found for phoneNumberId: ${phoneNumberId}`;
                    continue;
                }

                console.log(`✅ Found partner: ${partnerId}`);
                webhookLogData.partnerId = partnerId;

                if (value.statuses) {
                    for (const status of value.statuses) {
                        await handleStatusUpdate(partnerId, status);
                    }
                }

                if (value.messages && value.contacts) {
                    for (let i = 0; i < value.messages.length; i++) {
                        const message = value.messages[i];
                        const contact = value.contacts[i] || value.contacts[0];

                        await handleIncomingMessage(
                            partnerId,
                            phoneNumberId,
                            message,
                            contact.profile.name,
                            contact.wa_id
                        );
                    }
                }
            }
        }

        webhookLogData.success = true;
        webhookLogData.processingTimeMs = Date.now() - startTime;

        if (db) {
            await db.collection('webhookLogs').add(webhookLogData);
        }

        console.log(`✅ ========== META WEBHOOK COMPLETE (${webhookLogData.processingTimeMs}ms) ==========\n`);
        return NextResponse.json({ status: 'ok' }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Meta webhook error:', error);
        webhookLogData.error = error.message;
        webhookLogData.processingTimeMs = Date.now() - startTime;

        if (db) {
            await db.collection('webhookLogs').add(webhookLogData);
        }

        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

async function getOrCreateConversation(
    partnerId: string,
    phoneNumberId: string,
    customerWaId: string,
    customerName?: string
): Promise<string> {
    if (!db) {
        throw new Error('Database not available');
    }

    const customerPhone = `+${customerWaId}`;

    const existingConvSnapshot = await db
        .collection('metaWhatsAppConversations')
        .where('partnerId', '==', partnerId)
        .where('customerWaId', '==', customerWaId)
        .limit(1)
        .get();

    if (!existingConvSnapshot.empty) {
        const convDoc = existingConvSnapshot.docs[0];
        console.log(`📋 Found existing conversation: ${convDoc.id}`);

        if (customerName && customerName !== convDoc.data().customerName) {
            await convDoc.ref.update({
                customerName,
                updatedAt: FieldValue.serverTimestamp()
            });
        }

        return convDoc.id;
    }

    const newConvRef = db.collection('metaWhatsAppConversations').doc();

    // Fetch profile picture
    let profilePictureUrl: string | undefined;
    try {
        profilePictureUrl = await getWhatsAppProfilePicture(partnerId, customerWaId) || undefined;
    } catch (err) {
        console.log('Could not fetch profile picture, using default');
    }

    const newConversation: Omit<MetaWhatsAppConversation, 'id'> = {
        partnerId,
        platform: 'meta_whatsapp',
        customerPhone,
        customerWaId,
        customerName: customerName || customerPhone,
        phoneNumberId,
        type: 'direct',
        title: `WhatsApp: ${customerName || customerPhone}`,
        isActive: true,
        messageCount: 0,
        unreadCount: 0,
        lastMessageAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        customerProfilePicture: profilePictureUrl,
    };

    await newConvRef.set({ id: newConvRef.id, ...newConversation });
    console.log(`✨ Created new conversation: ${newConvRef.id}`);

    return newConvRef.id;
}

async function handleIncomingMessage(
    partnerId: string,
    phoneNumberId: string,
    message: MetaWebhookMessage,
    customerName: string,
    customerWaId: string
): Promise<void> {
    if (!db) {
        throw new Error('Database not available');
    }

    console.log(`📨 Processing ${message.type} message from ${customerWaId}`);

    const conversationId = await getOrCreateConversation(
        partnerId,
        phoneNumberId,
        customerWaId,
        customerName
    );
    let content = '';
    let mediaUrl = '';
    let mimeType = '';
    let filename = '';
    let mediaId = '';

    switch (message.type) {
        case 'text':
            content = message.text?.body || '';
            break;
        case 'image':
            content = message.image?.caption || '[IMAGE]';
            mediaId = message.image?.id || '';
            mimeType = message.image?.mime_type || '';
            break;
        case 'document':
            content = message.document?.caption || '[DOCUMENT]';
            mediaId = message.document?.id || '';
            mimeType = message.document?.mime_type || '';
            filename = message.document?.filename || '';
            break;
        case 'audio':
            content = '[AUDIO]';
            mediaId = message.audio?.id || '';
            mimeType = message.audio?.mime_type || '';
            break;
        case 'video':
            content = message.video?.caption || '[VIDEO]';
            mediaId = message.video?.id || '';
            mimeType = message.video?.mime_type || '';
            break;
        case 'sticker':
            content = '[STICKER]';
            mediaId = message.sticker?.id || '';
            mimeType = message.sticker?.mime_type || '';
            break;
        case 'location':
            if (message.location) {
                const loc = message.location;
                content = `📍 Location: ${loc.name || ''} (${loc.latitude}, ${loc.longitude})`.trim();
            }
            break;
        case 'contacts':
            if (message.contacts) {
                const names = message.contacts.map(c => c.name.formatted_name).join(', ');
                content = `👤 Shared contact${message.contacts.length > 1 ? 's' : ''}: ${names}`;
            }
            break;
        default:
            content = `[${message.type.toUpperCase()}]`;
    }

    // Process Media if mediaId exists
    if (mediaId) {
        console.log(`📸 Processing ${message.type} media with ID: ${mediaId}`);
        try {
            const uploadedUrl = await processAndUploadMedia(partnerId, mediaId);
            if (uploadedUrl) {
                mediaUrl = uploadedUrl;
                console.log(`✅ Media URL stored: ${uploadedUrl.substring(0, 50)}...`);
            } else {
                console.error(`❌ Failed to upload media for ID: ${mediaId}`);
            }
        } catch (err) {
            console.error(`❌ Error processing media:`, err);
        }
    }

    const messageRef = db.collection('metaWhatsAppMessages').doc();
    const messageData: Omit<MetaWhatsAppMessage, 'id'> = {
        conversationId,
        senderId: customerWaId,
        partnerId,
        type: message.type as any,
        content,
        direction: 'inbound',
        platform: 'meta_whatsapp',
        metaMetadata: {
            messageId: message.id,
            phoneNumberId,
            waId: customerWaId,
            timestamp: message.timestamp,
            mediaUrl: mediaUrl || undefined,
            mimeType: mimeType || undefined,
            filename: filename || undefined,
            mediaId: mediaId || undefined,
        },
        createdAt: FieldValue.serverTimestamp(),
    };

    await messageRef.set({ id: messageRef.id, ...messageData });
    console.log(`✅ Saved message: ${messageRef.id}`);

    const messagePreview = content.length > 50
        ? content.substring(0, 50) + '...'
        : content;

    await db.collection('metaWhatsAppConversations').doc(conversationId).update({
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessagePreview: messagePreview,
        messageCount: FieldValue.increment(1),
        unreadCount: FieldValue.increment(1),
        isActive: true,
        customerName: customerName || undefined,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

async function handleStatusUpdate(
    partnerId: string,
    status: MetaWebhookStatus
): Promise<void> {
    if (!db) return;

    console.log(`📊 Status update: ${status.id} -> ${status.status}`);

    const messagesSnapshot = await db
        .collection('metaWhatsAppMessages')
        .where('metaMetadata.messageId', '==', status.id)
        .limit(1)
        .get();

    if (!messagesSnapshot.empty) {
        const messageDoc = messagesSnapshot.docs[0];
        const updateData: any = {
            'metaMetadata.status': status.status,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (status.errors?.length) {
            console.error('❌ Message delivery errors:', status.errors);
            updateData['metaMetadata.errorCode'] = status.errors[0].code;
            updateData['metaMetadata.errorMessage'] = status.errors[0].message;
        }

        await messageDoc.ref.update(updateData);
        console.log(`✅ Updated message status: ${messageDoc.id} -> ${status.status}`);
    }
}
