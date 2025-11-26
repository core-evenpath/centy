export interface MetaWhatsAppConfig {
    phoneNumberId: string;
    wabaId: string;
    encryptedAccessToken: string;
    verifyToken: string;
    displayPhoneNumber: string;
    businessName?: string;
    appId?: string;
    webhookConfigured: boolean;
    status: 'pending' | 'active' | 'disconnected' | 'error';
    lastVerifiedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MetaWebhookPayload {
    object: 'whatsapp_business_account';
    entry: MetaWebhookEntry[];
}

export interface MetaWebhookEntry {
    id: string;
    changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
    value: MetaWebhookValue;
    field: 'messages';
}

export interface MetaWebhookValue {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: MetaWebhookContact[];
    messages?: MetaWebhookMessage[];
    statuses?: MetaWebhookStatus[];
}

export interface MetaWebhookContact {
    profile: {
        name: string;
    };
    wa_id: string;
}

export interface MetaWebhookMessage {
    from: string;
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button' | 'reaction';
    text?: { body: string };
    image?: MetaMediaObject;
    document?: MetaMediaObject;
    audio?: MetaMediaObject;
    video?: MetaMediaObject;
    sticker?: MetaMediaObject;
    location?: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
    contacts?: MetaContactObject[];
    interactive?: MetaInteractiveObject;
    button?: { text: string; payload: string };
    reaction?: { message_id: string; emoji: string };
    context?: {
        from: string;
        id: string;
    };
}

export interface MetaMediaObject {
    id: string;
    mime_type: string;
    sha256?: string;
    caption?: string;
    filename?: string;
}

export interface MetaContactObject {
    name: { formatted_name: string; first_name?: string; last_name?: string };
    phones?: Array<{ phone: string; type: string }>;
}

export interface MetaInteractiveObject {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
}

export interface MetaWebhookStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
    conversation?: {
        id: string;
        origin: { type: 'user_initiated' | 'business_initiated' | 'referral_conversion' };
        expiration_timestamp?: string;
    };
    pricing?: {
        billable: boolean;
        pricing_model: string;
        category: string;
    };
    errors?: Array<{
        code: number;
        title: string;
        message: string;
        error_data?: { details: string };
    }>;
}

export interface MetaSendMessageRequest {
    messaging_product: 'whatsapp';
    recipient_type: 'individual';
    to: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template' | 'interactive';
    text?: { body: string; preview_url?: boolean };
    image?: { id?: string; link?: string; caption?: string };
    document?: { id?: string; link?: string; caption?: string; filename?: string };
    audio?: { id?: string; link?: string };
    video?: { id?: string; link?: string; caption?: string };
    template?: MetaTemplateMessage;
    interactive?: MetaInteractiveMessage;
}

export interface MetaTemplateMessage {
    name: string;
    language: { code: string };
    components?: MetaTemplateComponent[];
}

export interface MetaTemplateComponent {
    type: 'header' | 'body' | 'button';
    parameters?: MetaTemplateParameter[];
    sub_type?: 'quick_reply' | 'url';
    index?: string;
}

export interface MetaTemplateParameter {
    type: 'text' | 'image' | 'document' | 'video' | 'currency' | 'date_time';
    text?: string;
    image?: { link: string };
    document?: { link: string; filename?: string };
    video?: { link: string };
    currency?: { fallback_value: string; code: string; amount_1000: number };
    date_time?: { fallback_value: string };
}

export interface MetaInteractiveMessage {
    type: 'button' | 'list' | 'product' | 'product_list';
    header?: { type: 'text' | 'image' | 'document' | 'video'; text?: string; image?: { link: string } };
    body: { text: string };
    footer?: { text: string };
    action: {
        buttons?: Array<{ type: 'reply'; reply: { id: string; title: string } }>;
        button?: string;
        sections?: Array<{
            title: string;
            rows: Array<{ id: string; title: string; description?: string }>;
        }>;
    };
}

export interface MetaSendMessageResponse {
    messaging_product: 'whatsapp';
    contacts: Array<{ input: string; wa_id: string }>;
    messages: Array<{ id: string }>;
}

export interface MetaWhatsAppMessage {
    id: string;
    conversationId: string;
    senderId: string;
    partnerId: string;
    type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'interactive' | 'template' | 'sticker' | 'reaction';
    content: string;
    direction: 'inbound' | 'outbound';
    platform: 'meta_whatsapp';
    metaMetadata: {
        messageId: string;
        phoneNumberId: string;
        waId: string;
        status?: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        mediaId?: string;
        mediaUrl?: string;
        storagePath?: string;
        mimeType?: string;
        filename?: string;
        templateName?: string;
        errorCode?: number;
        errorMessage?: string;
    };
    createdAt: any;
    updatedAt?: any;
}

export interface MetaWhatsAppConversation {
    id: string;
    partnerId: string;
    platform: 'meta_whatsapp';
    customerPhone: string;
    customerWaId: string;
    customerName?: string;
    customerProfilePicture?: string;
    phoneNumberId: string;
    type: 'direct';
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
}

export interface SendMetaWhatsAppInput {
    partnerId: string;
    to: string;
    message?: string;
    conversationId?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'audio' | 'video';
    filename?: string;
    templateName?: string;
    templateLanguage?: string;
    templateParams?: string[];
    templateComponents?: MetaTemplateComponent[];
}

export interface SendMetaWhatsAppResult {
    success: boolean;
    message: string;
    messageId?: string;
    metaMessageId?: string;
    conversationId?: string;
}

export interface MetaMessageTemplate {
    id: string;
    partnerId: string;
    name: string;
    language: string;
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
    components: MetaTemplateComponentDef[];
    metaTemplateId?: string;
    rejectionReason?: string;
    createdAt: any;
    updatedAt?: any;
    lastSyncedAt?: any;
}

export interface MetaTemplateComponentDef {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
    text?: string;
    example?: {
        header_text?: string[];
        body_text?: string[][];
        header_handle?: string[];
    };
    buttons?: Array<{
        type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
        text: string;
        url?: string;
        phone_number?: string;
    }>;
}

export interface MetaTemplateCreateRequest {
    name: string;
    language: string;
    category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
    components: MetaTemplateComponentDef[];
}

export interface MetaTemplateListResponse {
    data: Array<{
        id: string;
        name: string;
        language: string;
        status: string;
        category: string;
        components: MetaTemplateComponentDef[];
    }>;
    paging?: {
        cursors: { before: string; after: string };
        next?: string;
    };
}

export interface MetaPhoneMapping {
    phoneNumberId: string;
    partnerId: string;
    displayPhoneNumber: string;
    wabaId: string;
    createdAt: any;
    updatedAt?: any;
}
