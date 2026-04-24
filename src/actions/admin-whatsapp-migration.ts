'use server';

// One-off backfill for Meta WhatsApp messages that were stored with a bare
// placeholder content (e.g. "[UNSUPPORTED]", "[INTERACTIVE]", "[REACTION]")
// before the webhook fix shipped. Two entry points:
//
//   previewWhatsAppContentBackfill()  — read-only; returns counts + a sample
//   executeWhatsAppContentBackfill()  — does the rewrite + refreshes every
//                                       affected conversation's preview
//
// Strategy:
//   1. Stream `webhookLogs` for platform 'meta_whatsapp' into an in-memory
//      Map<metaMessageId, MetaWebhookMessage> so we can rebuild the exact
//      content the live webhook would produce today.
//   2. Scan `metaWhatsAppMessages` for documents whose `type` is one of the
//      previously-defaulting types AND whose `content` still matches the
//      stale `[TAG]` format.
//   3. For each stale doc: call parseMetaWebhookMessage on the original
//      payload if we have it; otherwise fall back to fallbackContentForType.
//   4. Commit updates in Firestore batches (<500 writes each).
//   5. For every conversation touched, re-read its most recent message and
//      refresh `lastMessagePreview` so the inbox sidebar stops showing the
//      stale tag.
//   6. Write an audit entry to `whatsappMigrationAudit`.

import { db } from '@/lib/firebase-admin';
import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import {
    parseMetaWebhookMessage,
    fallbackContentForType,
} from '@/lib/meta-whatsapp-message-parser';
import type {
    MetaWebhookPayload,
    MetaWebhookMessage,
} from '@/lib/types-meta-whatsapp';

// Types whose content was previously flattened to `[${TYPE.toUpperCase()}]`
// by the webhook default branch. Media types (image/video/document/audio/
// voice/sticker) are intentionally excluded — their bracket tags are still
// written by the current webhook for captionless media and stay legitimate.
const MIGRATABLE_TYPES = [
    'unsupported',
    'interactive',
    'button',
    'reaction',
    'order',
    'system',
    'template',
] as const;

const STALE_CONTENT_RE = /^\[[A-Z_]+\]$/;
const BATCH_SIZE = 400;

export interface BackfillPreview {
    ok: true;
    staleMessageCount: number;
    byType: Record<string, number>;
    affectedConversationCount: number;
    reconstructableCount: number;
    fallbackCount: number;
    sampleMessageIds: string[];
    webhookLogCount: number;
    scannedMessages: number;
}

export interface BackfillResult {
    ok: true;
    updatedMessages: number;
    reconstructedFromPayload: number;
    fallbackUsed: number;
    updatedConversations: number;
    auditId: string;
    errors: string[];
}

export interface BackfillError {
    ok: false;
    error: string;
}

interface StaleMessageRecord {
    docId: string;
    conversationId: string;
    type: string;
    messageId: string | undefined;
    existingContent: string;
}

interface RebuildOutcome {
    content: string;
    errorCode?: number;
    errorMessage?: string;
    reconstructed: boolean;
}

// Walk every webhookLog document for this platform and index each nested
// message by its Meta message id. A single webhook entry can carry multiple
// messages, so we flatten.
async function loadWebhookMessageIndex(): Promise<Map<string, MetaWebhookMessage>> {
    if (!db) throw new Error('Database not available');

    const index = new Map<string, MetaWebhookMessage>();
    const snapshot = await db
        .collection('webhookLogs')
        .where('platform', '==', 'meta_whatsapp')
        .get();

    for (const doc of snapshot.docs) {
        const payload = doc.data()?.payload as MetaWebhookPayload | undefined;
        const entries = payload?.entry;
        if (!Array.isArray(entries)) continue;

        for (const entry of entries) {
            for (const change of entry.changes ?? []) {
                for (const m of change.value?.messages ?? []) {
                    if (m?.id) index.set(m.id, m);
                }
            }
        }
    }

    return index;
}

async function loadStaleMessages(): Promise<{
    stale: StaleMessageRecord[];
    scanned: number;
}> {
    if (!db) throw new Error('Database not available');

    const stale: StaleMessageRecord[] = [];
    let scanned = 0;

    // Firestore's `in` operator accepts up to 30 values; we have 7 types so
    // a single query works. Platform filter narrows it down further.
    const snapshot = await db
        .collection('metaWhatsAppMessages')
        .where('platform', '==', 'meta_whatsapp')
        .where('type', 'in', MIGRATABLE_TYPES as unknown as string[])
        .get();

    for (const doc of snapshot.docs) {
        scanned += 1;
        const data = doc.data();
        const content: string = data.content ?? '';
        if (!STALE_CONTENT_RE.test(content)) continue;

        stale.push({
            docId: doc.id,
            conversationId: data.conversationId,
            type: data.type,
            messageId: data.metaMetadata?.messageId,
            existingContent: content,
        });
    }

    return { stale, scanned };
}

function rebuildContent(
    record: StaleMessageRecord,
    webhookIndex: Map<string, MetaWebhookMessage>,
): RebuildOutcome {
    const original = record.messageId ? webhookIndex.get(record.messageId) : undefined;
    if (original) {
        const parsed = parseMetaWebhookMessage(original);
        return {
            content: parsed.content,
            errorCode: parsed.errorCode,
            errorMessage: parsed.errorMessage,
            reconstructed: true,
        };
    }
    return {
        content: fallbackContentForType(record.type),
        reconstructed: false,
    };
}

export async function previewWhatsAppContentBackfill(): Promise<
    BackfillPreview | BackfillError
> {
    if (!db) return { ok: false, error: 'Database not available' };

    try {
        const [webhookIndex, { stale, scanned }] = await Promise.all([
            loadWebhookMessageIndex(),
            loadStaleMessages(),
        ]);

        const byType: Record<string, number> = {};
        const conversations = new Set<string>();
        let reconstructable = 0;
        let fallback = 0;

        for (const record of stale) {
            byType[record.type] = (byType[record.type] ?? 0) + 1;
            if (record.conversationId) conversations.add(record.conversationId);
            if (record.messageId && webhookIndex.has(record.messageId)) {
                reconstructable += 1;
            } else {
                fallback += 1;
            }
        }

        return {
            ok: true,
            staleMessageCount: stale.length,
            byType,
            affectedConversationCount: conversations.size,
            reconstructableCount: reconstructable,
            fallbackCount: fallback,
            sampleMessageIds: stale.slice(0, 10).map(r => r.docId),
            webhookLogCount: webhookIndex.size,
            scannedMessages: scanned,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    }
}

export async function executeWhatsAppContentBackfill(): Promise<
    BackfillResult | BackfillError
> {
    if (!db) return { ok: false, error: 'Database not available' };

    try {
        const [webhookIndex, { stale }] = await Promise.all([
            loadWebhookMessageIndex(),
            loadStaleMessages(),
        ]);

        let reconstructed = 0;
        let fallback = 0;
        const touchedConversations = new Set<string>();
        const errors: string[] = [];

        // Commit message updates in chunks of BATCH_SIZE.
        for (let i = 0; i < stale.length; i += BATCH_SIZE) {
            const chunk = stale.slice(i, i + BATCH_SIZE);
            const batch = db.batch();

            for (const record of chunk) {
                const outcome = rebuildContent(record, webhookIndex);
                if (outcome.reconstructed) reconstructed += 1;
                else fallback += 1;
                if (record.conversationId) touchedConversations.add(record.conversationId);

                const update: Record<string, unknown> = {
                    content: outcome.content,
                    updatedAt: FieldValue.serverTimestamp(),
                };
                if (outcome.errorCode !== undefined) {
                    update['metaMetadata.errorCode'] = outcome.errorCode;
                }
                if (outcome.errorMessage !== undefined) {
                    update['metaMetadata.errorMessage'] = outcome.errorMessage;
                }

                batch.update(
                    db.collection('metaWhatsAppMessages').doc(record.docId),
                    update,
                );
            }

            try {
                await batch.commit();
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                errors.push(`message batch at offset ${i}: ${message}`);
            }
        }

        // Refresh each affected conversation's lastMessagePreview from its
        // actual newest message. This also picks up any non-stale newer
        // messages so we don't regress a preview that was already accurate.
        let updatedConversations = 0;
        for (const conversationId of touchedConversations) {
            try {
                const latestSnap = await db
                    .collection('metaWhatsAppMessages')
                    .where('conversationId', '==', conversationId)
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .get();
                if (latestSnap.empty) continue;

                const latest = latestSnap.docs[0].data();
                const latestContent: string = latest.content ?? '';
                const preview =
                    latestContent.length > 50
                        ? latestContent.slice(0, 50) + '...'
                        : latestContent;

                await db
                    .collection('metaWhatsAppConversations')
                    .doc(conversationId)
                    .update({
                        lastMessagePreview: preview,
                        updatedAt: FieldValue.serverTimestamp(),
                    });
                updatedConversations += 1;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                errors.push(`conversation ${conversationId}: ${message}`);
            }
        }

        const auditRef = await db.collection('whatsappMigrationAudit').add({
            kind: 'content_backfill',
            createdAt: FieldValue.serverTimestamp(),
            updatedMessages: stale.length,
            reconstructedFromPayload: reconstructed,
            fallbackUsed: fallback,
            updatedConversations,
            errorCount: errors.length,
        });

        return {
            ok: true,
            updatedMessages: stale.length,
            reconstructedFromPayload: reconstructed,
            fallbackUsed: fallback,
            updatedConversations,
            auditId: auditRef.id,
            errors,
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
    }
}

// Used by the migration audit row type — exported for any future UI that
// wants to list past runs. Kept minimal for now.
export interface WhatsappMigrationAuditEntry {
    kind: 'content_backfill';
    createdAt: Timestamp;
    updatedMessages: number;
    reconstructedFromPayload: number;
    fallbackUsed: number;
    updatedConversations: number;
    errorCount: number;
}
