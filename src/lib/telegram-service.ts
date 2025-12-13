// src/lib/telegram-service.ts
import { db } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
import type {
    TelegramConfig,
    TelegramApiResponse,
    TelegramMessage,
    TelegramSendMessageParams,
    TelegramSendPhotoParams,
    TelegramSendDocumentParams,
    TelegramFile,
    TelegramUser,
    TelegramWebhookInfo,
} from '@/lib/types-telegram';

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

export async function getPartnerTelegramConfig(partnerId: string): Promise<TelegramConfig | null> {
    if (!db) return null;

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        if (!partnerDoc.exists) return null;

        const data = partnerDoc.data();
        return data?.telegramConfig || null;
    } catch (error) {
        console.error('Error getting Telegram config:', error);
        return null;
    }
}

export async function getDecryptedBotToken(partnerId: string): Promise<string | null> {
    const config = await getPartnerTelegramConfig(partnerId);
    if (!config?.encryptedBotToken) return null;

    try {
        return decrypt(config.encryptedBotToken);
    } catch (error) {
        console.error('Error decrypting bot token:', error);
        return null;
    }
}

export async function findPartnerByBotId(botId: string): Promise<string | null> {
    if (!db) return null;

    try {
        const mappingDoc = await db.collection('telegramBotMappings').doc(botId).get();
        if (mappingDoc.exists) {
            return mappingDoc.data()?.partnerId || null;
        }
        return null;
    } catch (error) {
        console.error('Error finding partner by bot ID:', error);
        return null;
    }
}

async function telegramRequest<T>(
    botToken: string,
    method: string,
    params?: Record<string, any>
): Promise<TelegramApiResponse<T>> {
    const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: params ? JSON.stringify(params) : undefined,
        });

        const data = await response.json();
        return data as TelegramApiResponse<T>;
    } catch (error: any) {
        console.error(`Telegram API error (${method}):`, error);
        return {
            ok: false,
            description: error.message,
        };
    }
}

export async function getMe(botToken: string): Promise<TelegramApiResponse<TelegramUser>> {
    return telegramRequest<TelegramUser>(botToken, 'getMe');
}

export async function setWebhook(
    botToken: string,
    url: string,
    options?: {
        certificate?: string;
        ip_address?: string;
        max_connections?: number;
        allowed_updates?: string[];
        drop_pending_updates?: boolean;
        secret_token?: string;
    }
): Promise<TelegramApiResponse<boolean>> {
    return telegramRequest<boolean>(botToken, 'setWebhook', {
        url,
        ...options,
    });
}

export async function deleteWebhook(
    botToken: string,
    dropPendingUpdates?: boolean
): Promise<TelegramApiResponse<boolean>> {
    return telegramRequest<boolean>(botToken, 'deleteWebhook', {
        drop_pending_updates: dropPendingUpdates,
    });
}

export async function getWebhookInfo(botToken: string): Promise<TelegramApiResponse<TelegramWebhookInfo>> {
    return telegramRequest<TelegramWebhookInfo>(botToken, 'getWebhookInfo');
}

export async function sendTelegramTextMessage(
    partnerId: string,
    chatId: number,
    text: string,
    options?: Partial<TelegramSendMessageParams>
): Promise<TelegramApiResponse<TelegramMessage>> {
    const botToken = await getDecryptedBotToken(partnerId);
    if (!botToken) {
        return { ok: false, description: 'Bot token not found' };
    }

    return telegramRequest<TelegramMessage>(botToken, 'sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
    });
}

export async function sendTelegramPhoto(
    partnerId: string,
    chatId: number,
    photo: string,
    caption?: string,
    replyToMessageId?: number
): Promise<TelegramApiResponse<TelegramMessage>> {
    const botToken = await getDecryptedBotToken(partnerId);
    if (!botToken) {
        return { ok: false, description: 'Bot token not found' };
    }

    const params: TelegramSendPhotoParams = {
        chat_id: chatId,
        photo,
        caption,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
    };

    return telegramRequest<TelegramMessage>(botToken, 'sendPhoto', params);
}

export async function sendTelegramDocument(
    partnerId: string,
    chatId: number,
    document: string,
    caption?: string,
    replyToMessageId?: number
): Promise<TelegramApiResponse<TelegramMessage>> {
    const botToken = await getDecryptedBotToken(partnerId);
    if (!botToken) {
        return { ok: false, description: 'Bot token not found' };
    }

    const params: TelegramSendDocumentParams = {
        chat_id: chatId,
        document,
        caption,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
    };

    return telegramRequest<TelegramMessage>(botToken, 'sendDocument', params);
}

export async function sendTelegramVideo(
    partnerId: string,
    chatId: number,
    video: string,
    caption?: string,
    replyToMessageId?: number
): Promise<TelegramApiResponse<TelegramMessage>> {
    const botToken = await getDecryptedBotToken(partnerId);
    if (!botToken) {
        return { ok: false, description: 'Bot token not found' };
    }

    return telegramRequest<TelegramMessage>(botToken, 'sendVideo', {
        chat_id: chatId,
        video,
        caption,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
    });
}

export async function sendTelegramAudio(
    partnerId: string,
    chatId: number,
    audio: string,
    caption?: string,
    replyToMessageId?: number
): Promise<TelegramApiResponse<TelegramMessage>> {
    const botToken = await getDecryptedBotToken(partnerId);
    if (!botToken) {
        return { ok: false, description: 'Bot token not found' };
    }

    return telegramRequest<TelegramMessage>(botToken, 'sendAudio', {
        chat_id: chatId,
        audio,
        caption,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
    });
}

export async function getFile(botToken: string, fileId: string): Promise<TelegramApiResponse<TelegramFile>> {
    return telegramRequest<TelegramFile>(botToken, 'getFile', { file_id: fileId });
}

export async function downloadTelegramFile(botToken: string, filePath: string): Promise<Buffer | null> {
    const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error('Failed to download Telegram file:', response.statusText);
            return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Error downloading Telegram file:', error);
        return null;
    }
}

export async function getFileUrl(botToken: string, fileId: string): Promise<string | null> {
    const fileResponse = await getFile(botToken, fileId);
    if (!fileResponse.ok || !fileResponse.result?.file_path) {
        return null;
    }
    return `https://api.telegram.org/file/bot${botToken}/${fileResponse.result.file_path}`;
}

export async function sendChatAction(
    partnerId: string,
    chatId: number,
    action: 'typing' | 'upload_photo' | 'upload_video' | 'upload_audio' | 'upload_document' | 'find_location' | 'record_video' | 'record_voice'
): Promise<TelegramApiResponse<boolean>> {
    const botToken = await getDecryptedBotToken(partnerId);
    if (!botToken) {
        return { ok: false, description: 'Bot token not found' };
    }

    return telegramRequest<boolean>(botToken, 'sendChatAction', {
        chat_id: chatId,
        action,
    });
}

export function extractMessageContent(message: TelegramMessage): {
    type: 'text' | 'photo' | 'document' | 'video' | 'audio' | 'voice' | 'video_note' | 'sticker' | 'location' | 'contact';
    content: string;
    fileId?: string;
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
} {
    if (message.text) {
        return { type: 'text', content: message.text };
    }

    if (message.photo && message.photo.length > 0) {
        const largestPhoto = message.photo[message.photo.length - 1];
        return {
            type: 'photo',
            content: message.caption || '[Photo]',
            fileId: largestPhoto.file_id,
            fileSize: largestPhoto.file_size,
        };
    }

    if (message.document) {
        return {
            type: 'document',
            content: message.caption || `[Document: ${message.document.file_name || 'file'}]`,
            fileId: message.document.file_id,
            mimeType: message.document.mime_type,
            fileName: message.document.file_name,
            fileSize: message.document.file_size,
        };
    }

    if (message.video) {
        return {
            type: 'video',
            content: message.caption || '[Video]',
            fileId: message.video.file_id,
            mimeType: message.video.mime_type,
            fileName: message.video.file_name,
            fileSize: message.video.file_size,
        };
    }

    if (message.audio) {
        return {
            type: 'audio',
            content: message.caption || `[Audio: ${message.audio.title || 'audio'}]`,
            fileId: message.audio.file_id,
            mimeType: message.audio.mime_type,
            fileName: message.audio.file_name,
            fileSize: message.audio.file_size,
        };
    }

    if (message.voice) {
        return {
            type: 'voice',
            content: '[Voice Message]',
            fileId: message.voice.file_id,
            mimeType: message.voice.mime_type,
            fileSize: message.voice.file_size,
        };
    }

    if (message.video_note) {
        return {
            type: 'video_note',
            content: '[Video Note]',
            fileId: message.video_note.file_id,
            fileSize: message.video_note.file_size,
        };
    }

    if (message.sticker) {
        return {
            type: 'sticker',
            content: message.sticker.emoji || '[Sticker]',
            fileId: message.sticker.file_id,
            fileSize: message.sticker.file_size,
        };
    }

    if (message.location) {
        return {
            type: 'location',
            content: `[Location: ${message.location.latitude}, ${message.location.longitude}]`,
        };
    }

    if (message.contact) {
        return {
            type: 'contact',
            content: `[Contact: ${message.contact.first_name} ${message.contact.last_name || ''} - ${message.contact.phone_number}]`,
        };
    }

    return { type: 'text', content: '[Unsupported message type]' };
}
