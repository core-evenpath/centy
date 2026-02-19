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
    groupIds?: string[],
    variableMappings?: Array<{
        token: string;
        source: 'contact' | 'custom';
        contactField?: string;
        customValue: string;
    }>,
    ctaButtons?: Array<{ type: string; text: string; url: string }>
): Promise<BroadcastSendResult> {
    try {
        // 1. Get contacts based on selection type
        let recipients: Array<{ id: string; phone: string; name?: string; telegramChatId?: string; email?: string; company?: string; customFields?: Record<string, any>;[key: string]: any }> = [];

        const mapContactDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
            const data = doc.data()!;
            return {
                id: doc.id,
                phone: data.phone,
                name: data.name,
                email: data.email,
                company: data.company,
                area: data.customFields?.area,
                budget: data.customFields?.budget,
                telegramChatId: data.telegramChatId,
                customFields: data.customFields || {},
            };
        };

        if (recipientType === 'all') {
            // Get all contacts (removing status check as requested)
            const contactsSnapshot = await db
                .collection(`partners/${partnerId}/contacts`)
                .get();

            recipients = contactsSnapshot.docs
                .map(mapContactDoc)
                .filter(c => c.phone && c.phone.trim() !== '');

        } else if (recipientType === 'individual' && contactIds && contactIds.length > 0) {
            // Get specific contacts
            const contactsPromises = contactIds.map(id =>
                db.collection(`partners/${partnerId}/contacts`).doc(id).get()
            );
            const contactsDocs = await Promise.all(contactsPromises);

            recipients = contactsDocs
                .filter(doc => doc.exists)
                .map(mapContactDoc)
                .filter(c => c.phone && c.phone.trim() !== '');

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
                .filter(doc => doc.exists)
                .map(mapContactDoc)
                .filter(c => c.phone && c.phone.trim() !== '');
        }

        if (recipients.length === 0) {
            return {
                success: false,
                message: 'No valid recipients found',
            };
        }

        // 2. Send messages to all recipients
        let delivered = 0;
        let failed = 0;
        const results: BroadcastSendResult['results'] = [];

        // Helper to convert markdown to WhatsApp format
        function markdownToWhatsApp(text: string): string {
            let formatted = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
            formatted = formatted.replace(/__(.*?)__/g, '_$1_');
            return formatted;
        }

        // Helper to personalize message
        const personalizeMessage = (template: string, contact: any): string => {
            if (!variableMappings || variableMappings.length === 0) return template;

            return variableMappings.reduce((msg, mapping) => {
                let value = '';
                if (mapping.source === 'contact' && mapping.contactField) {
                    value = contact[mapping.contactField]
                        || contact.customFields?.[mapping.contactField]
                        || getFallback(mapping.contactField);
                } else {
                    value = mapping.customValue || '';
                }
                return msg.replace(
                    new RegExp(mapping.token.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g'),
                    value
                );
            }, template);
        };

        const getFallback = (field: string): string => {
            const fallbacks: Record<string, string> = {
                name: 'Friend',
                area: 'your area',
                email: '',
                phone: '',
                company: 'your company',
            };
            return fallbacks[field] || '';
        };

        for (const contact of recipients) {
            try {
                let result;

                // Personalize message for this contact
                const personalizedMessage = personalizeMessage(message, { ...contact, ...contact.customFields });

                if (channel === 'whatsapp') {
                    if (!contact.phone) {
                        failed++;
                        results.push({
                            contactId: contact.id,
                            contactName: contact.name,
                            phone: 'N/A',
                            status: 'failed',
                            error: 'No phone number'
                        });
                        continue;
                    }

                    const safePhone = String(contact.phone);
                    const normalizedPhone = safePhone.replace(/\D/g, '');
                    let conversationId: string | undefined;
                    let phoneToUse = safePhone;

                    // Try to find existing conversation
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
                            phoneToUse = convData.customerPhone || safePhone;
                        } else {
                            const phoneWithPlus = safePhone.startsWith('+') ? safePhone : `+${normalizedPhone}`;
                            const altConvSnapshot = await db
                                .collection('metaWhatsAppConversations')
                                .where('partnerId', '==', partnerId)
                                .where('customerPhone', '==', phoneWithPlus)
                                .limit(1)
                                .get();

                            if (!altConvSnapshot.empty) {
                                const convData = altConvSnapshot.docs[0].data();
                                conversationId = altConvSnapshot.docs[0].id;
                                phoneToUse = convData.customerPhone || safePhone;
                            }
                        }
                    } catch (err) {
                        console.error('Error looking up conversation:', err);
                    }

                    const formattedMessage = markdownToWhatsApp(String(personalizedMessage || ''));

                    result = await sendMetaWhatsAppMessageAction({
                        partnerId,
                        to: phoneToUse,
                        message: formattedMessage,
                        mediaUrl,
                        mediaType: mediaUrl ? 'image' : undefined,
                        conversationId,
                        interactiveButtons: ctaButtons?.filter(b => b.text && b.url).map(b => ({
                            type: 'url' as const,
                            text: b.text,
                            url: b.url,
                        })),
                    });

                } else if (channel === 'telegram') {
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

                    let conversationId: string | undefined;
                    let chatIdToUse = contact.telegramChatId;

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
                            chatIdToUse = convData.chatId || contact.telegramChatId;
                        }
                    } catch (err) {
                        console.error('Error looking up Telegram conversation:', err);
                    }

                    result = await sendTelegramMessageAction({
                        partnerId,
                        chatId: chatIdToUse as any,
                        message: personalizedMessage,
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

        // 3. Update campaign with metrics
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
    try {
        let recipients: Array<{ id: string; phone: string; name?: string }> = [];

        const mapContactDoc = (doc: FirebaseFirestore.DocumentSnapshot) => ({
            id: doc.id,
            phone: doc.data()?.phone,
            name: doc.data()?.name,
        });

        if (recipientType === 'all') {
            const contactsSnapshot = await db
                .collection(`partners/${partnerId}/contacts`)
                // .where('status', '==', 'active') // REMOVED filter as per requirement
                .limit(50) // Increased limit slightly to have better pool, though preview is usually small
                .get();

            recipients = contactsSnapshot.docs
                .map(mapContactDoc)
                .filter(c => c.phone && c.phone.trim() !== '')
                .slice(0, 10);

        } else if (recipientType === 'individual' && contactIds) {
            const contactsPromises = contactIds.slice(0, 10).map(id =>
                db.collection(`partners/${partnerId}/contacts`).doc(id).get()
            );
            const contactsDocs = await Promise.all(contactsPromises);

            recipients = contactsDocs
                .filter(doc => doc.exists)
                .map(mapContactDoc)
                .filter(c => c.phone && c.phone.trim() !== '');

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
                .filter(doc => doc.exists)
                .map(mapContactDoc)
                .filter(c => c.phone && c.phone.trim() !== '');
        }

        // Get total count
        let totalCount = recipients.length;

        if (recipientType === 'all') {
            const allContactsSnapshot = await db
                .collection(`partners/${partnerId}/contacts`)
                .get();

            totalCount = allContactsSnapshot.docs
                .filter(doc => doc.data().phone && doc.data().phone.trim() !== '')
                .length;
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
