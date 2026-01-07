// src/actions/broadcast-send-actions.ts
'use server';

import { sendMetaWhatsAppMessageAction } from './meta-whatsapp-actions';
import { sendTelegramMessageAction } from './telegram-actions';
import { updateCampaignAction } from './broadcast-actions';
import { db } from '@/lib/firebase-admin';

interface BroadcastSendResult {
    success: boolean;
    message?: string;
    totalRecipients?: number;
    delivered?: number;
    failed?: number;
    results?: Array<{
        contactId: string;
        contactName?: string;
        phone: string;
        status: 'delivered' | 'failed';
        error?: string;
    }>;
}

/**
 * Send a broadcast campaign to multiple recipients
 * Similar to how /partner/inbox sends messages, but to multiple contacts
 */
export async function sendBroadcastCampaignAction(
    partnerId: string,
    campaignId: string,
    channel: 'whatsapp' | 'telegram',
    message: string,
    mediaUrl?: string,
    recipientType?: 'group' | 'individual' | 'all',
    contactIds?: string[],
    groupIds?: string[]
): Promise<BroadcastSendResult> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        // 1. Get contacts based on selection type
        let recipients: Array<{ id: string; phone: string; name?: string; telegramChatId?: string }> = [];

        try {
            if (recipientType === 'all') {
                // Get all active contacts
                const contactsSnapshot = await db
                    .collection(`partners/${partnerId}/contacts`)
                    .where('status', '==', 'active')
                    .get();

                recipients = contactsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    phone: doc.data().phone,
                    name: doc.data().name,
                    telegramChatId: doc.data().telegramChatId,
                })).filter(c => c.phone); // Only include contacts with phone numbers

            } else if (recipientType === 'individual' && contactIds && contactIds.length > 0) {
                // Get specific contacts
                const contactsPromises = contactIds.map(id =>
                    db.collection(`partners/${partnerId}/contacts`).doc(id).get()
                );
                const contactsDocs = await Promise.all(contactsPromises);

                recipients = contactsDocs
                    .filter(doc => doc.exists && doc.data()?.phone)
                    .map(doc => ({
                        id: doc.id,
                        phone: doc.data()!.phone,
                        name: doc.data()!.name,
                        telegramChatId: doc.data()!.telegramChatId,
                    }));

            } else if (recipientType === 'group' && groupIds && groupIds.length > 0) {
                // Get contacts from broadcast groups
                const groupsPromises = groupIds.map(id =>
                    db.collection(`partners/${partnerId}/broadcastGroups`).doc(id).get()
                );
                const groupsDocs = await Promise.all(groupsPromises);

                const allContactIds = groupsDocs
                    .filter(doc => doc.exists)
                    .flatMap(doc => doc.data()?.contactIds || []);

                // Remove duplicates
                const uniqueContactIds = Array.from(new Set(allContactIds));

                // Get contact details
                const contactsPromises = uniqueContactIds.map(id =>
                    db.collection(`partners/${partnerId}/contacts`).doc(id).get()
                );
                const contactsDocs = await Promise.all(contactsPromises);

                recipients = contactsDocs
                    .filter(doc => doc.exists && doc.data()?.phone)
                    .map(doc => ({
                        id: doc.id,
                        phone: doc.data()!.phone,
                        name: doc.data()!.name,
                        telegramChatId: doc.data()!.telegramChatId,
                    }));
            }
        } catch (fetchError: any) {
            console.error('Error fetching recipients:', fetchError);
            return {
                success: false,
                message: `Failed to fetch recipients: ${fetchError.message || 'Database error'}`,
            };
        }

        if (recipients.length === 0) {
            return {
                success: false,
                message: 'No valid recipients found',
            };
        }

        // 2. Send messages to all recipients (using same logic as inbox)
        let delivered = 0;
        let failed = 0;
        const results: BroadcastSendResult['results'] = [];

        // Helper to convert markdown to WhatsApp format (from Inbox)
        function markdownToWhatsApp(text: string): string {
            // Convert **bold** to *bold*
            let formatted = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
            // Convert __italic__ to _italic_
            formatted = formatted.replace(/__(.*?)__/g, '_$1_');
            return formatted;
        }

        for (const contact of recipients) {
            try {
                let result;

                if (channel === 'whatsapp') {
                    // EXACT INBOX LOGIC: Look up existing conversation first
                    // Normalize phone for lookup (remove non-digits)
                    const normalizedPhone = contact.phone.replace(/\D/g, '');
                    let conversationId: string | undefined;
                    let phoneToUse = contact.phone; // Default to contact's phone

                    // Try to find existing conversation by customerWaId (like inbox does)
                    // Wrap in try-catch to handle Firestore connection errors
                    try {
                        const existingConvSnapshot = await db
                            .collection('metaWhatsAppConversations')
                            .where('partnerId', '==', partnerId)
                            .where('customerWaId', '==', normalizedPhone)
                            .limit(1)
                            .get();

                        if (!existingConvSnapshot.empty) {
                            const convData = existingConvSnapshot.docs[0].data();
                            conversationId = existingConvSnapshot.docs[0].id;
                            // Use the conversation's customerPhone (exact inbox behavior)
                            phoneToUse = convData.customerPhone || contact.phone;
                        } else {
                            // Also try with full phone format
                            const phoneWithPlus = contact.phone.startsWith('+') ? contact.phone : `+${normalizedPhone}`;
                            const altConvSnapshot = await db
                                .collection('metaWhatsAppConversations')
                                .where('partnerId', '==', partnerId)
                                .where('customerPhone', '==', phoneWithPlus)
                                .limit(1)
                                .get();

                            if (!altConvSnapshot.empty) {
                                const convData = altConvSnapshot.docs[0].data();
                                conversationId = altConvSnapshot.docs[0].id;
                                // Use the conversation's customerPhone (exact inbox behavior)
                                phoneToUse = convData.customerPhone || contact.phone;
                            }
                        }
                    } catch (lookupError) {
                        // If conversation lookup fails, continue with contact's phone
                        console.warn(`Conversation lookup failed for ${contact.phone}, using contact phone:`, lookupError);
                    }

                    // Use the same WhatsApp sending action as inbox, with formatting
                    const formattedMessage = markdownToWhatsApp(message);

                    // EXACT INBOX LOGIC: Pass phone from conversation when available
                    result = await sendMetaWhatsAppMessageAction({
                        partnerId,
                        to: phoneToUse,
                        message: formattedMessage,
                        mediaUrl,
                        mediaType: mediaUrl ? 'image' : undefined,
                        conversationId,
                    });

                } else if (channel === 'telegram') {
                    // For Telegram, we need chatId
                    if (!contact.telegramChatId) {
                        failed++;
                        results.push({
                            contactId: contact.id,
                            contactName: contact.name,
                            phone: contact.phone,
                            status: 'failed',
                            error: 'No Telegram chat ID found',
                        });
                        continue;
                    }

                    // EXACT INBOX LOGIC: Look up existing Telegram conversation by chatId
                    let conversationId: string | undefined;
                    let chatIdToUse = contact.telegramChatId;

                    // Wrap in try-catch to handle Firestore connection errors
                    try {
                        const existingConvSnapshot = await db
                            .collection('telegramConversations')
                            .where('partnerId', '==', partnerId)
                            .where('chatId', '==', contact.telegramChatId)
                            .limit(1)
                            .get();

                        if (!existingConvSnapshot.empty) {
                            const convData = existingConvSnapshot.docs[0].data();
                            conversationId = existingConvSnapshot.docs[0].id;
                            // Use the conversation's chatId (exact inbox behavior)
                            chatIdToUse = convData.chatId || contact.telegramChatId;
                        }
                    } catch (lookupError) {
                        // If conversation lookup fails, continue with contact's chatId
                        console.warn(`Telegram conversation lookup failed for ${contact.telegramChatId}, using contact chatId:`, lookupError);
                    }

                    // EXACT INBOX LOGIC: Use the same Telegram sending action as inbox
                    result = await sendTelegramMessageAction({
                        partnerId,
                        chatId: chatIdToUse as any,
                        message,
                        mediaUrl,
                        conversationId,
                    });
                }

                if (result?.success) {
                    delivered++;
                    results.push({
                        contactId: contact.id,
                        contactName: contact.name,
                        phone: contact.phone,
                        status: 'delivered',
                    });
                } else {
                    failed++;
                    results.push({
                        contactId: contact.id,
                        contactName: contact.name,
                        phone: contact.phone,
                        status: 'failed',
                        error: result?.message || 'Unknown error',
                    });
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error: any) {
                console.error(`Error sending to ${contact.phone}:`, error);
                failed++;
                results.push({
                    contactId: contact.id,
                    contactName: contact.name,
                    phone: contact.phone,
                    status: 'failed',
                    error: error.message || 'Failed to send',
                });
            }
        }

        // 3. Update campaign with metrics (same as inbox updates conversation)
        try {
            await updateCampaignAction(partnerId, campaignId, {
                status: 'sent',
                sentAt: new Date().toISOString() as any,
                recipientCount: recipients.length,
                delivered,
                failed,
                read: 0,
                replied: 0,
            } as any);
        } catch (error) {
            console.error('Error updating campaign:', error);
            // Don't fail the whole operation if update fails
        }

        return {
            success: true,
            totalRecipients: recipients.length,
            delivered,
            failed,
            results,
        };

    } catch (error: any) {
        console.error('Error sending broadcast campaign:', error);
        return {
            success: false,
            message: error.message || 'Failed to send broadcast',
        };
    }
}

/**
 * Get preview of recipients before sending
 */
export async function getBroadcastRecipientsPreviewAction(
    partnerId: string,
    recipientType: 'group' | 'individual' | 'all',
    contactIds?: string[],
    groupIds?: string[]
): Promise<{
    success: boolean;
    count: number;
    preview: Array<{ id: string; name?: string; phone: string }>;
}> {
    if (!db) {
        return { success: false, count: 0, preview: [] };
    }

    try {
        let recipients: Array<{ id: string; phone: string; name?: string }> = [];

        if (recipientType === 'all') {
            const contactsSnapshot = await db
                .collection(`partners/${partnerId}/contacts`)
                .where('status', '==', 'active')
                .limit(10) // Just preview first 10
                .get();

            recipients = contactsSnapshot.docs.map(doc => ({
                id: doc.id,
                phone: doc.data().phone,
                name: doc.data().name,
            })).filter(c => c.phone);

        } else if (recipientType === 'individual' && contactIds) {
            const contactsPromises = contactIds.slice(0, 10).map(id =>
                db.collection(`partners/${partnerId}/contacts`).doc(id).get()
            );
            const contactsDocs = await Promise.all(contactsPromises);

            recipients = contactsDocs
                .filter(doc => doc.exists && doc.data()?.phone)
                .map(doc => ({
                    id: doc.id,
                    phone: doc.data()!.phone,
                    name: doc.data()!.name,
                }));

        } else if (recipientType === 'group' && groupIds) {
            const groupsPromises = groupIds.map(id =>
                db.collection(`partners/${partnerId}/broadcastGroups`).doc(id).get()
            );
            const groupsDocs = await Promise.all(groupsPromises);

            const allContactIds = groupsDocs
                .filter(doc => doc.exists)
                .flatMap(doc => doc.data()?.contactIds || []);

            const uniqueContactIds = Array.from(new Set(allContactIds)).slice(0, 10);

            const contactsPromises = uniqueContactIds.map(id =>
                db.collection(`partners/${partnerId}/contacts`).doc(id).get()
            );
            const contactsDocs = await Promise.all(contactsPromises);

            recipients = contactsDocs
                .filter(doc => doc.exists && doc.data()?.phone)
                .map(doc => ({
                    id: doc.id,
                    phone: doc.data()!.phone,
                    name: doc.data()!.name,
                }));
        }

        // Get total count
        let totalCount = recipients.length;

        if (recipientType === 'all') {
            const countSnapshot = await db
                .collection(`partners/${partnerId}/contacts`)
                .where('status', '==', 'active')
                .count()
                .get();
            totalCount = countSnapshot.data().count;
        }

        return {
            success: true,
            count: totalCount,
            preview: recipients,
        };

    } catch (error: any) {
        console.error('Error getting recipients preview:', error);
        return {
            success: false,
            count: 0,
            preview: [],
        };
    }
}
