'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { encrypt, decrypt } from '@/lib/encryption';
import {
    getMe,
    setWebhook,
    deleteWebhook,
    getWebhookInfo,
    sendTelegramTextMessage,
    sendTelegramPhoto,
    sendTelegramDocument,
    sendTelegramVideo,
    sendTelegramAudio,
    getPartnerTelegramConfig,
} from '@/lib/telegram-service';
import type {
    TelegramConfig,
    TelegramConversation,
    TelegramStoredMessage,
    TelegramBotMapping,
    SendTelegramMessageInput,
    SendTelegramMessageResult,
} from '@/lib/types-telegram';

export async function connectTelegramBot(
    partnerId: string,
    botToken: string
): Promise<{ success: boolean; message: string; botUsername?: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const botInfo = await getMe(botToken);
        if (!botInfo.ok || !botInfo.result) {
            return {
                success: false,
                message: botInfo.description || 'Invalid bot token. Please check and try again.',
            };
        }

        const bot = botInfo.result;
        const botId = bot.id.toString();
        const botUsername = bot.username || '';

        const existingMapping = await db.collection('telegramBotMappings').doc(botId).get();
        if (existingMapping.exists && existingMapping.data()?.partnerId !== partnerId) {
            return {
                success: false,
                message: 'This bot is already connected to another workspace.',
            };
        }

        const encryptedBotToken = encrypt(botToken);

        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`
            : 'https://www.centy.dev/api/webhooks/telegram';

        const secretToken = `telegram_${partnerId}_${Date.now()}`;
        const webhookResult = await setWebhook(botToken, webhookUrl, {
            allowed_updates: ['message', 'edited_message', 'callback_query'],
            secret_token: secretToken,
            drop_pending_updates: true,
        });

        if (!webhookResult.ok) {
            console.error('Failed to set webhook:', webhookResult.description);
        }

        const configData: TelegramConfig = {
            botToken: '',
            encryptedBotToken,
            botUsername,
            botId,
            webhookUrl,
            webhookConfigured: webhookResult.ok,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastVerifiedAt: new Date().toISOString(),
            secretToken,
        };

        await db.collection('partners').doc(partnerId).update({
            telegramConfig: configData,
        });

        const botMapping: TelegramBotMapping = {
            botId,
            partnerId,
            botUsername,
            createdAt: new Date().toISOString(),
        };

        await db.collection('telegramBotMappings').doc(botId).set(botMapping);

        console.log(`Telegram bot connected for partner: ${partnerId}, bot: @${botUsername}`);

        return {
            success: true,
            message: `Bot @${botUsername} connected successfully!`,
            botUsername,
        };
    } catch (error: any) {
        console.error('Error connecting Telegram bot:', error);
        return { success: false, message: error.message };
    }
}

export async function disconnectTelegramBot(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const config = await getPartnerTelegramConfig(partnerId);
        if (!config) {
            return { success: false, message: 'Telegram bot not connected' };
        }

        if (config.encryptedBotToken) {
            try {
                const botToken = decrypt(config.encryptedBotToken);
                await deleteWebhook(botToken, true);
            } catch (err) {
                console.warn('Could not delete webhook:', err);
            }
        }

        if (config.botId) {
            await db.collection('telegramBotMappings').doc(config.botId).delete();
        }

        await db.collection('partners').doc(partnerId).update({
            telegramConfig: FieldValue.delete(),
        });

        console.log(`Telegram bot disconnected for partner: ${partnerId}`);
        return { success: true, message: 'Telegram bot disconnected successfully' };
    } catch (error: any) {
        console.error('Error disconnecting Telegram bot:', error);
        return { success: false, message: error.message };
    }
}

export async function getTelegramStatus(
    partnerId: string
): Promise<{
    connected: boolean;
    config: Partial<TelegramConfig> | null;
    webhookInfo?: any;
}> {
    if (!db) {
        return { connected: false, config: null };
    }

    try {
        const config = await getPartnerTelegramConfig(partnerId);
        if (!config) {
            return { connected: false, config: null };
        }

        const { encryptedBotToken, secretToken, ...safeConfig } = config;

        let webhookInfo = null;
        if (config.encryptedBotToken) {
            try {
                const botToken = decrypt(config.encryptedBotToken);
                const webhookResult = await getWebhookInfo(botToken);
                if (webhookResult.ok) {
                    webhookInfo = webhookResult.result;
                }
            } catch (err) {
                console.warn('Could not get webhook info:', err);
            }
        }

        return {
            connected: config.status === 'active',
            config: safeConfig,
            webhookInfo,
        };
    } catch (error) {
        console.error('Error getting Telegram status:', error);
        return { connected: false, config: null };
    }
}

export async function refreshTelegramWebhook(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const config = await getPartnerTelegramConfig(partnerId);
        if (!config?.encryptedBotToken) {
            return { success: false, message: 'Telegram bot not connected' };
        }

        const botToken = decrypt(config.encryptedBotToken);
        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`
            : 'https://www.centy.dev/api/webhooks/telegram';

        const secretToken = `telegram_${partnerId}_${Date.now()}`;

        await deleteWebhook(botToken, true);

        const webhookResult = await setWebhook(botToken, webhookUrl, {
            allowed_updates: ['message', 'edited_message', 'callback_query'],
            secret_token: secretToken,
            drop_pending_updates: true,
        });

        if (!webhookResult.ok) {
            return {
                success: false,
                message: webhookResult.description || 'Failed to set webhook',
            };
        }

        await db.collection('partners').doc(partnerId).update({
            'telegramConfig.webhookUrl': webhookUrl,
            'telegramConfig.webhookConfigured': true,
            'telegramConfig.secretToken': secretToken,
            'telegramConfig.updatedAt': new Date().toISOString(),
            'telegramConfig.lastVerifiedAt': new Date().toISOString(),
        });

        return { success: true, message: 'Webhook refreshed successfully' };
    } catch (error: any) {
        console.error('Error refreshing webhook:', error);
        return { success: false, message: error.message };
    }
}

export async function sendTelegramMessageAction(
    input: SendTelegramMessageInput
): Promise<SendTelegramMessageResult> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const config = await getPartnerTelegramConfig(input.partnerId);
        if (!config || config.status !== 'active') {
            return { success: false, message: 'Telegram bot not configured or inactive' };
        }

        if (!input.chatId) {
            return { success: false, message: 'No chat ID provided' };
        }

        if (!input.message && !input.mediaUrl) {
            return { success: false, message: 'No message content or media provided' };
        }

        let telegramResponse;
        if (input.mediaUrl && input.mediaType) {
            switch (input.mediaType) {
                case 'photo':
                    telegramResponse = await sendTelegramPhoto(
                        input.partnerId,
                        input.chatId,
                        input.mediaUrl,
                        input.message,
                        input.replyToMessageId
                    );
                    break;
                case 'document':
                    telegramResponse = await sendTelegramDocument(
                        input.partnerId,
                        input.chatId,
                        input.mediaUrl,
                        input.message,
                        input.replyToMessageId
                    );
                    break;
                case 'video':
                    telegramResponse = await sendTelegramVideo(
                        input.partnerId,
                        input.chatId,
                        input.mediaUrl,
                        input.message,
                        input.replyToMessageId
                    );
                    break;
                case 'audio':
                    telegramResponse = await sendTelegramAudio(
                        input.partnerId,
                        input.chatId,
                        input.mediaUrl,
                        input.message,
                        input.replyToMessageId
                    );
                    break;
                default:
                    telegramResponse = await sendTelegramDocument(
                        input.partnerId,
                        input.chatId,
                        input.mediaUrl,
                        input.message,
                        input.replyToMessageId
                    );
            }
        } else {
            telegramResponse = await sendTelegramTextMessage(
                input.partnerId,
                input.chatId,
                input.message || '',
                { reply_to_message_id: input.replyToMessageId }
            );
        }

        if (!telegramResponse.ok || !telegramResponse.result) {
            return {
                success: false,
                message: telegramResponse.description || 'Failed to send message',
            };
        }

        const telegramMessageId = telegramResponse.result.message_id;

        let conversationId = input.conversationId;
        if (!conversationId) {
            const existingConvSnapshot = await db
                .collection('telegramConversations')
                .where('partnerId', '==', input.partnerId)
                .where('chatId', '==', input.chatId)
                .limit(1)
                .get();

            if (!existingConvSnapshot.empty) {
                conversationId = existingConvSnapshot.docs[0].id;
            } else {
                const newConvRef = db.collection('telegramConversations').doc();
                const newConversation: Omit<TelegramConversation, 'id'> = {
                    partnerId: input.partnerId,
                    platform: 'telegram',
                    chatId: input.chatId,
                    chatType: 'private',
                    customerTelegramId: input.chatId,
                    title: `Telegram: ${input.chatId}`,
                    isActive: true,
                    messageCount: 0,
                    unreadCount: 0,
                    lastMessageAt: FieldValue.serverTimestamp(),
                    createdAt: FieldValue.serverTimestamp(),
                };
                await newConvRef.set({ id: newConvRef.id, ...newConversation });
                conversationId = newConvRef.id;
            }
        }

        const messageRef = db.collection('telegramMessages').doc();
        const messageData: Omit<TelegramStoredMessage, 'id'> = {
            conversationId,
            partnerId: input.partnerId,
            telegramMessageId,
            type: input.mediaType || 'text',
            content: input.message || (input.mediaType ? `[${input.mediaType}]` : ''),
            direction: 'outbound',
            platform: 'telegram',
            telegramMetadata: {
                messageId: telegramMessageId,
                chatId: input.chatId,
                date: Math.floor(Date.now() / 1000),
                mediaUrl: input.mediaUrl,
                fileName: input.filename,
            },
            createdAt: FieldValue.serverTimestamp(),
        };

        await messageRef.set({ id: messageRef.id, ...messageData });

        const messagePreview = input.mediaType
            ? `📎 ${input.mediaType}`
            : (input.message?.substring(0, 50) || 'Message');

        await db.collection('telegramConversations').doc(conversationId).update({
            lastMessageAt: FieldValue.serverTimestamp(),
            lastMessagePreview: messagePreview,
            messageCount: FieldValue.increment(1),
            isActive: true,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            message: 'Message sent successfully',
            messageId: messageRef.id,
            telegramMessageId,
            conversationId,
        };
    } catch (error: any) {
        console.error('Error sending Telegram message:', error);
        return { success: false, message: error.message };
    }
}

export async function markTelegramConversationAsRead(
    partnerId: string,
    conversationId: string
): Promise<{ success: boolean }> {
    if (!db) {
        return { success: false };
    }

    try {
        await db.collection('telegramConversations').doc(conversationId).update({
            unreadCount: 0,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function deleteTelegramConversation(
    partnerId: string,
    conversationId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const convRef = db.collection('telegramConversations').doc(conversationId);
        const convDoc = await convRef.get();

        if (!convDoc.exists) {
            return { success: false, message: 'Conversation not found' };
        }

        if (convDoc.data()?.partnerId !== partnerId) {
            return { success: false, message: 'Unauthorized' };
        }

        const messagesSnapshot = await db
            .collection('telegramMessages')
            .where('conversationId', '==', conversationId)
            .get();

        const batch = db.batch();
        messagesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        batch.delete(convRef);
        await batch.commit();

        return { success: true, message: 'Conversation deleted' };
    } catch (error: any) {
        console.error('Error deleting conversation:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteTelegramMessage(
    partnerId: string,
    messageId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const msgRef = db.collection('telegramMessages').doc(messageId);
        const msgDoc = await msgRef.get();

        if (!msgDoc.exists) {
            return { success: false, message: 'Message not found' };
        }

        if (msgDoc.data()?.partnerId !== partnerId) {
            return { success: false, message: 'Unauthorized' };
        }

        await msgRef.delete();
        return { success: true, message: 'Message deleted' };
    } catch (error: any) {
        console.error('Error deleting message:', error);
        return { success: false, message: error.message };
    }
}
