import type { MetaWebhookMessage } from '@/lib/types-meta-whatsapp';

export interface ParsedMetaMessage {
    content: string;
    mediaId?: string;
    mimeType?: string;
    filename?: string;
    errorCode?: number;
    errorMessage?: string;
}

// Pure derivation of content + media/error metadata from an inbound Meta
// webhook message. Shared between the live webhook handler and the one-off
// backfill migration so both produce identical text.
export function parseMetaWebhookMessage(message: MetaWebhookMessage): ParsedMetaMessage {
    switch (message.type) {
        case 'text':
            return { content: message.text?.body || '' };

        case 'image':
            return {
                content: message.image?.caption || '[IMAGE]',
                mediaId: message.image?.id,
                mimeType: message.image?.mime_type,
            };

        case 'document':
            return {
                content: message.document?.caption || '[DOCUMENT]',
                mediaId: message.document?.id,
                mimeType: message.document?.mime_type,
                filename: message.document?.filename,
            };

        case 'audio':
            return {
                content: '[AUDIO]',
                mediaId: message.audio?.id,
                mimeType: message.audio?.mime_type,
            };

        case 'voice':
            return {
                content: '[VOICE]',
                mediaId: message.voice?.id,
                mimeType: message.voice?.mime_type || 'audio/ogg',
            };

        case 'video':
            return {
                content: message.video?.caption || '[VIDEO]',
                mediaId: message.video?.id,
                mimeType: message.video?.mime_type,
            };

        case 'sticker':
            return {
                content: '[STICKER]',
                mediaId: message.sticker?.id,
                mimeType: message.sticker?.mime_type,
            };

        case 'location': {
            const loc = message.location;
            if (!loc) return { content: '' };
            return {
                content: `📍 Location: ${loc.name || ''} (${loc.latitude}, ${loc.longitude})`.trim(),
            };
        }

        case 'contacts': {
            const contacts = message.contacts;
            if (!contacts?.length) return { content: '' };
            const names = contacts.map(c => c.name.formatted_name).join(', ');
            return {
                content: `👤 Shared contact${contacts.length > 1 ? 's' : ''}: ${names}`,
            };
        }

        case 'interactive': {
            const interactive = message.interactive;
            if (interactive?.type === 'button_reply' && interactive.button_reply) {
                return { content: interactive.button_reply.title };
            }
            if (interactive?.type === 'list_reply' && interactive.list_reply) {
                const { title, description } = interactive.list_reply;
                return { content: description ? `${title} — ${description}` : title };
            }
            return { content: '[Interactive reply]' };
        }

        case 'button':
            return { content: message.button?.text || '[Button reply]' };

        case 'reaction':
            return {
                content: message.reaction?.emoji
                    ? `Reacted ${message.reaction.emoji}`
                    : 'Removed reaction',
            };

        case 'order': {
            const order = message.order;
            const itemCount = order?.product_items?.length ?? 0;
            const note = order?.text ? ` — "${order.text}"` : '';
            return {
                content: `🛒 Order placed (${itemCount} item${itemCount === 1 ? '' : 's'})${note}`,
            };
        }

        case 'system':
            return { content: message.system?.body || 'System notification' };

        case 'unsupported': {
            // Meta sends this when the customer sent a message feature the Cloud API
            // cannot deliver: view-once, polls, payment requests, third-party stickers,
            // disappearing messages, live location, etc. The reason is in `errors`.
            // https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
            const err = message.errors?.[0];
            const errorCode = err?.code;
            const errorMessage = err?.error_data?.details || err?.message || err?.title;
            const reason = errorMessage || 'This message type is not supported by WhatsApp Cloud API.';
            return {
                content: `⚠️ Unsupported message: ${reason}`,
                errorCode,
                errorMessage,
            };
        }

        default:
            return { content: `⚠️ Unhandled message type (${(message as { type: string }).type})` };
    }
}

// Generic fallback used by the backfill when the original webhook payload
// is no longer available in webhookLogs (e.g. pruned). Keyed on the stored
// message type.
export function fallbackContentForType(type: string | undefined): string {
    switch (type) {
        case 'unsupported':
            return '⚠️ Unsupported message (original reason unavailable)';
        case 'interactive':
            return '(Interactive reply)';
        case 'button':
            return '(Button reply)';
        case 'reaction':
            return '(Reaction)';
        case 'order':
            return '🛒 Order placed';
        case 'system':
            return 'System notification';
        default:
            return type ? `(${type} message)` : '(Message)';
    }
}
