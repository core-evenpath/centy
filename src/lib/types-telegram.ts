// src/lib/types-telegram.ts
// Telegram Bot Integration Types

export interface TelegramConfig {
    botToken: string;
    encryptedBotToken: string;
    botUsername: string;
    botId: string;
    webhookUrl?: string;
    webhookConfigured: boolean;
    status: 'pending' | 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
    lastVerifiedAt?: string;
    secretToken?: string;
}

export interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
}

export interface TelegramChat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
}

export interface TelegramMessage {
    message_id: number;
    message_thread_id?: number;
    from?: TelegramUser;
    sender_chat?: TelegramChat;
    date: number;
    chat: TelegramChat;
    forward_origin?: any;
    reply_to_message?: TelegramMessage;
    text?: string;
    caption?: string;
    entities?: TelegramMessageEntity[];
    caption_entities?: TelegramMessageEntity[];
    photo?: TelegramPhotoSize[];
    document?: TelegramDocument;
    video?: TelegramVideo;
    audio?: TelegramAudio;
    voice?: TelegramVoice;
    video_note?: TelegramVideoNote;
    sticker?: TelegramSticker;
    location?: TelegramLocation;
    contact?: TelegramContact;
}

export interface TelegramMessageEntity {
    type: 'mention' | 'hashtag' | 'cashtag' | 'bot_command' | 'url' | 'email' | 'phone_number' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code' | 'pre' | 'text_link' | 'text_mention';
    offset: number;
    length: number;
    url?: string;
    user?: TelegramUser;
    language?: string;
}

export interface TelegramPhotoSize {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
}

export interface TelegramDocument {
    file_id: string;
    file_unique_id: string;
    thumbnail?: TelegramPhotoSize;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
}

export interface TelegramVideo {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    duration: number;
    thumbnail?: TelegramPhotoSize;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
}

export interface TelegramAudio {
    file_id: string;
    file_unique_id: string;
    duration: number;
    performer?: string;
    title?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
    thumbnail?: TelegramPhotoSize;
}

export interface TelegramVoice {
    file_id: string;
    file_unique_id: string;
    duration: number;
    mime_type?: string;
    file_size?: number;
}

export interface TelegramVideoNote {
    file_id: string;
    file_unique_id: string;
    length: number;
    duration: number;
    thumbnail?: TelegramPhotoSize;
    file_size?: number;
}

export interface TelegramSticker {
    file_id: string;
    file_unique_id: string;
    type: 'regular' | 'mask' | 'custom_emoji';
    width: number;
    height: number;
    is_animated: boolean;
    is_video: boolean;
    thumbnail?: TelegramPhotoSize;
    emoji?: string;
    set_name?: string;
    file_size?: number;
}

export interface TelegramLocation {
    latitude: number;
    longitude: number;
    horizontal_accuracy?: number;
}

export interface TelegramContact {
    phone_number: string;
    first_name: string;
    last_name?: string;
    user_id?: number;
    vcard?: string;
}

export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
    edited_message?: TelegramMessage;
    channel_post?: TelegramMessage;
    edited_channel_post?: TelegramMessage;
    callback_query?: TelegramCallbackQuery;
}

export interface TelegramCallbackQuery {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    inline_message_id?: string;
    chat_instance: string;
    data?: string;
}

export interface TelegramConversation {
    id: string;
    partnerId: string;
    platform: 'telegram';
    chatId: number;
    chatType: 'private' | 'group' | 'supergroup' | 'channel';
    customerTelegramId: number;
    customerUsername?: string;
    customerFirstName?: string;
    customerLastName?: string;
    customerLanguageCode?: string;
    title: string;
    isActive: boolean;
    messageCount: number;
    unreadCount: number;
    lastMessageAt: any;
    lastMessagePreview?: string;
    createdAt: any;
    updatedAt?: any;
    contactId?: string;
    tags?: string[];
    assignedAssistantIds?: string[];
}

export interface TelegramStoredMessage {
    id: string;
    conversationId: string;
    partnerId: string;
    telegramMessageId: number;
    type: 'text' | 'photo' | 'document' | 'video' | 'audio' | 'voice' | 'video_note' | 'sticker' | 'location' | 'contact';
    content: string;
    direction: 'inbound' | 'outbound';
    platform: 'telegram';
    telegramMetadata: {
        messageId: number;
        chatId: number;
        fromId?: number;
        fromUsername?: string;
        date: number;
        mediaFileId?: string;
        mediaUrl?: string;
        storagePath?: string;
        mimeType?: string;
        fileName?: string;
        fileSize?: number;
        caption?: string;
        status?: 'sent' | 'delivered' | 'read';
        audioTranscription?: string;
    };
    createdAt: any;
    updatedAt?: any;
}

export interface TelegramBotMapping {
    botId: string;
    partnerId: string;
    botUsername: string;
    createdAt: string;
}

export interface SendTelegramMessageInput {
    partnerId: string;
    chatId: number;
    message?: string;
    conversationId?: string;
    mediaUrl?: string;
    mediaType?: 'photo' | 'document' | 'video' | 'audio' | 'voice';
    filename?: string;
    replyToMessageId?: number;
}

export interface SendTelegramMessageResult {
    success: boolean;
    message: string;
    messageId?: string;
    telegramMessageId?: number;
    conversationId?: string;
}

export interface TelegramApiResponse<T = any> {
    ok: boolean;
    result?: T;
    description?: string;
    error_code?: number;
}

export interface TelegramSendMessageParams {
    chat_id: number | string;
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    entities?: TelegramMessageEntity[];
    disable_web_page_preview?: boolean;
    disable_notification?: boolean;
    protect_content?: boolean;
    reply_to_message_id?: number;
    reply_markup?: any;
}

export interface TelegramSendPhotoParams {
    chat_id: number | string;
    photo: string;
    caption?: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_to_message_id?: number;
}

export interface TelegramSendDocumentParams {
    chat_id: number | string;
    document: string;
    caption?: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_to_message_id?: number;
}

export interface TelegramFile {
    file_id: string;
    file_unique_id: string;
    file_size?: number;
    file_path?: string;
}

export interface TelegramWebhookInfo {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    ip_address?: string;
    last_error_date?: number;
    last_error_message?: string;
    last_synchronization_error_date?: number;
    max_connections?: number;
    allowed_updates?: string[];
}
