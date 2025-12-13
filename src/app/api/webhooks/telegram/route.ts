import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
    findPartnerByBotId,
    getDecryptedBotToken,
    extractMessageContent,
    downloadTelegramFile,
    getFile,
} from '@/lib/telegram-service';
import type {
    TelegramUpdate,
    TelegramMessage,
    TelegramConversation,
    TelegramStoredMessage,
} from '@/lib/types-telegram';

async function getOrCreateConversation(
    partnerId: string,
    message: TelegramMessage
): Promise<string> {
    if (!db) {
        throw new Error('Database not available');
    }

    const chatId = message.chat.id;
    const fromUser = message.from;

    const existingConvSnapshot = await db
        .collection('telegramConversations')
        .where('partnerId', '==', partnerId)
        .where('chatId', '==', chatId)
        .limit(1)
        .get();

    if (!existingConvSnapshot.empty) {
        const convId = existingConvSnapshot.docs[0].id;
        const updates: Record<string, any> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (fromUser) {
            if (fromUser.first_name) updates.customerFirstName = fromUser.first_name;
            if (fromUser.last_name) updates.customerLastName = fromUser.last_name;
            if (fromUser.username) updates.customerUsername = fromUser.username;
            if (fromUser.language_code) updates.customerLanguageCode = fromUser.language_code;
        }

        await existingConvSnapshot.docs[0].ref.update(updates);
        return convId;
    }

    const customerName = fromUser
        ? `${fromUser.first_name || ''} ${fromUser.last_name || ''}`.trim()
        : message.chat.first_name || message.chat.title || 'Unknown';

    const newConvRef = db.collection('telegramConversations').doc();
    const newConversation: Omit<TelegramConversation, 'id'> = {
        partnerId,
        platform: 'telegram',
        chatId,
        chatType: message.chat.type,
        customerTelegramId: fromUser?.id || chatId,
        customerUsername: fromUser?.username || message.chat.username,
        customerFirstName: fromUser?.first_name || message.chat.first_name,
        customerLastName: fromUser?.last_name || message.chat.last_name,
        customerLanguageCode: fromUser?.language_code,
        title: customerName || `Telegram: ${chatId}`,
        isActive: true,
        messageCount: 0,
        unreadCount: 0,
        lastMessageAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
    };

    await newConvRef.set({ id: newConvRef.id, ...newConversation });
    return newConvRef.id;
}

async function handleMediaUpload(
    partnerId: string,
    botToken: string,
    fileId: string,
    messageType: string
): Promise<{ storagePath: string; downloadUrl: string } | null> {
    if (!storage) {
        console.warn('Storage not available, skipping media upload');
        return null;
    }

    try {
        const fileResponse = await getFile(botToken, fileId);
        if (!fileResponse.ok || !fileResponse.result?.file_path) {
            console.error('Failed to get file info:', fileResponse.description);
            return null;
        }

        const fileBuffer = await downloadTelegramFile(botToken, fileResponse.result.file_path);
        if (!fileBuffer) {
            console.error('Failed to download file');
            return null;
        }

        const timestamp = Date.now();
        const fileName = fileResponse.result.file_path.split('/').pop() || `${timestamp}.bin`;
        const storagePath = `chat/${partnerId}/telegram/incoming/${timestamp}_${fileName}`;

        const bucket = storage.bucket();
        const file = bucket.file(storagePath);

        await file.save(fileBuffer, {
            metadata: {
                contentType: getContentType(messageType, fileName),
                metadata: {
                    partnerId,
                    source: 'telegram',
                    uploadedAt: new Date().toISOString(),
                },
            },
        });

        const [downloadUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

        return { storagePath, downloadUrl };
    } catch (error) {
        console.error('Error uploading media:', error);
        return null;
    }
}

function getContentType(messageType: string, fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mp3: 'audio/mpeg',
        ogg: 'audio/ogg',
        wav: 'audio/wav',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    if (extension && mimeTypes[extension]) {
        return mimeTypes[extension];
    }

    switch (messageType) {
        case 'photo':
            return 'image/jpeg';
        case 'video':
            return 'video/mp4';
        case 'audio':
            return 'audio/mpeg';
        case 'voice':
            return 'audio/ogg';
        default:
            return 'application/octet-stream';
    }
}

async function handleIncomingMessage(
    partnerId: string,
    botToken: string,
    message: TelegramMessage
): Promise<void> {
    if (!db) {
        throw new Error('Database not available');
    }

    const conversationId = await getOrCreateConversation(partnerId, message);
    const { type, content, fileId, mimeType, fileName, fileSize } = extractMessageContent(message);

    let mediaUpload: { storagePath: string; downloadUrl: string } | null = null;
    if (fileId) {
        mediaUpload = await handleMediaUpload(partnerId, botToken, fileId, type);
    }

    const messageRef = db.collection('telegramMessages').doc();
    const storedMessage: Omit<TelegramStoredMessage, 'id'> = {
        conversationId,
        partnerId,
        telegramMessageId: message.message_id,
        type,
        content,
        direction: 'inbound',
        platform: 'telegram',
        telegramMetadata: {
            messageId: message.message_id,
            chatId: message.chat.id,
            fromId: message.from?.id,
            fromUsername: message.from?.username,
            date: message.date,
            mediaFileId: fileId,
            mediaUrl: mediaUpload?.downloadUrl,
            storagePath: mediaUpload?.storagePath,
            mimeType,
            fileName,
            fileSize,
            caption: message.caption,
        },
        createdAt: FieldValue.serverTimestamp(),
    };

    await messageRef.set({ id: messageRef.id, ...storedMessage });

    const messagePreview = type === 'text'
        ? content.substring(0, 50)
        : `📎 ${type}`;

    await db.collection('telegramConversations').doc(conversationId).update({
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessagePreview: messagePreview,
        messageCount: FieldValue.increment(1),
        unreadCount: FieldValue.increment(1),
        isActive: true,
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`Telegram message saved: ${messageRef.id} for conversation: ${conversationId}`);
}

export async function POST(request: NextRequest) {
    const webhookLogData: Record<string, any> = {
        platform: 'telegram',
        timestamp: new Date().toISOString(),
        success: false,
    };

    try {
        const update: TelegramUpdate = await request.json();
        webhookLogData.updateId = update.update_id;
        webhookLogData.payload = update;

        console.log('\n========== TELEGRAM WEBHOOK RECEIVED ==========');
        console.log('Update ID:', update.update_id);

        const message = update.message || update.edited_message;
        if (!message) {
            console.log('No message in update, skipping');
            webhookLogData.error = 'No message in update';
            if (db) {
                await db.collection('webhookLogs').add(webhookLogData);
            }
            return NextResponse.json({ ok: true });
        }

        let partnerId: string | null = null;

        // Try to find partner by looking at bot mappings
        if (db) {
            const mappingsSnapshot = await db.collection('telegramBotMappings').get();
            for (const doc of mappingsSnapshot.docs) {
                const mapping = doc.data();
                partnerId = mapping.partnerId;
                break;
            }
        }

        if (!partnerId) {
            console.error('Partner not found for Telegram message');
            webhookLogData.error = 'Partner not found';
            if (db) {
                await db.collection('webhookLogs').add(webhookLogData);
            }
            return NextResponse.json({ ok: true });
        }

        webhookLogData.partnerId = partnerId;

        const botToken = await getDecryptedBotToken(partnerId);
        if (!botToken) {
            console.error('Bot token not found for partner:', partnerId);
            webhookLogData.error = 'Bot token not found';
            if (db) {
                await db.collection('webhookLogs').add(webhookLogData);
            }
            return NextResponse.json({ ok: true });
        }

        await handleIncomingMessage(partnerId, botToken, message);

        webhookLogData.success = true;
        if (db) {
            await db.collection('webhookLogs').add(webhookLogData);
        }

        console.log('========== TELEGRAM WEBHOOK COMPLETE ==========\n');

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Telegram webhook error:', error);
        webhookLogData.error = error.message;
        if (db) {
            await db.collection('webhookLogs').add(webhookLogData);
        }
        return NextResponse.json({ ok: true });
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Telegram webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}
