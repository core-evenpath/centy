'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { encrypt, decrypt, generateVerifyToken } from '@/lib/encryption';
import {
    sendMetaTextMessage,
    sendMetaMediaMessage,
    getPartnerMetaConfig,
    findPartnerByPhoneNumberId
} from '@/lib/meta-whatsapp-service';
import type {
    MetaWhatsAppConfig,
    SendMetaWhatsAppInput,
    SendMetaWhatsAppResult,
    MetaWhatsAppMessage,
    MetaWhatsAppConversation,
    MetaPhoneMapping
} from '@/lib/types-meta-whatsapp';
import { incrementContactMessageCountAction, triggerPersonaGenerationAction } from './persona-actions';

export async function connectMetaWhatsApp(
    partnerId: string,
    config: {
        phoneNumberId: string;
        wabaId: string;
        accessToken: string;
        displayPhoneNumber: string;
        businessName?: string;
        appId?: string;
    }
): Promise<{ success: boolean; message: string; verifyToken?: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        console.log(`🔗 Connecting Meta WhatsApp for partner: ${partnerId}`);

        let displayPhoneNumber = config.displayPhoneNumber;

        // Only validate phone number if phoneNumberId is provided and not 'pending'
        if (config.phoneNumberId && config.phoneNumberId !== 'pending') {
            const testResponse = await fetch(
                `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                    },
                }
            );

            if (!testResponse.ok) {
                const errorData = await testResponse.json();
                console.error('❌ Meta API validation failed:', errorData);
                return {
                    success: false,
                    message: `Invalid credentials: ${errorData.error?.message || 'Unknown error'}`
                };
            }

            const phoneData = await testResponse.json();
            console.log('✅ Meta API credentials validated:', phoneData.display_phone_number);
            displayPhoneNumber = config.displayPhoneNumber || phoneData.display_phone_number;
        } else {
            console.log('⚠️ Skipping phone number validation (phoneNumberId not yet available)');
        }

        const encryptedAccessToken = encrypt(config.accessToken);
        const verifyToken = generateVerifyToken();

        const metaConfig: MetaWhatsAppConfig = {
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId,
            encryptedAccessToken,
            verifyToken,
            displayPhoneNumber,
            businessName: config.businessName,
            appId: config.appId,
            webhookConfigured: false,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.collection('partners').doc(partnerId).update({
            metaWhatsAppConfig: metaConfig,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Only create phone mapping if phoneNumberId is valid
        if (config.phoneNumberId && config.phoneNumberId !== 'pending') {
            const phoneMappingData: MetaPhoneMapping = {
                phoneNumberId: config.phoneNumberId,
                partnerId,
                displayPhoneNumber: metaConfig.displayPhoneNumber,
                wabaId: config.wabaId,
                createdAt: FieldValue.serverTimestamp(),
            };

            await db.collection('metaPhoneMappings').doc(config.phoneNumberId).set(phoneMappingData);
        }

        console.log('✅ Meta WhatsApp configuration saved');

        return {
            success: true,
            message: 'WhatsApp Business connected successfully. Please configure the webhook in Meta Business Suite.',
            verifyToken
        };

    } catch (error: any) {
        console.error('❌ Error connecting Meta WhatsApp:', error);
        return { success: false, message: error.message };
    }
}

export async function activateMetaWhatsApp(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        await db.collection('partners').doc(partnerId).update({
            'metaWhatsAppConfig.status': 'active',
            'metaWhatsAppConfig.webhookConfigured': true,
            'metaWhatsAppConfig.lastVerifiedAt': new Date().toISOString(),
            'metaWhatsAppConfig.updatedAt': new Date().toISOString(),
        });

        console.log(`✅ Meta WhatsApp activated for partner: ${partnerId}`);
        return { success: true, message: 'WhatsApp Business activated successfully' };
    } catch (error: any) {
        console.error('❌ Error activating Meta WhatsApp:', error);
        return { success: false, message: error.message };
    }
}

export async function disconnectMetaWhatsApp(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        // Only update status to disconnected - keep all config for easy reconnection
        await db.collection('partners').doc(partnerId).update({
            'metaWhatsAppConfig.status': 'disconnected',
            'metaWhatsAppConfig.webhookConfigured': false,
            'metaWhatsAppConfig.updatedAt': new Date().toISOString(),
        });

        console.log(`✅ Meta WhatsApp disconnected (paused) for partner: ${partnerId}`);
        return { success: true, message: 'WhatsApp Business disconnected. You can reconnect anytime.' };
    } catch (error: any) {
        console.error('❌ Error disconnecting Meta WhatsApp:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteMetaWhatsAppAccount(
    partnerId: string,
    deleteConversations: boolean = false
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig as MetaWhatsAppConfig;

        // Unsubscribe app from WABA before deleting (allows reconnection later)
        if (config?.wabaId && config?.encryptedAccessToken) {
            try {
                const { unsubscribeAppFromWABA } = await import('@/actions/meta-embedded-signup-actions');
                const accessToken = decrypt(config.encryptedAccessToken);
                const unsubResult = await unsubscribeAppFromWABA(config.wabaId, accessToken);
                if (!unsubResult.success) {
                    console.warn('⚠️ Failed to unsubscribe from WABA:', unsubResult.error);
                    // Continue with delete even if unsubscribe fails
                } else {
                    console.log('✅ Unsubscribed app from WABA');
                }
            } catch (err) {
                console.warn('⚠️ Could not unsubscribe from WABA:', err);
                // Continue with delete even if unsubscribe fails
            }
        }

        // Delete phone mapping if exists
        if (config?.phoneNumberId && config.phoneNumberId !== 'pending') {
            try {
                await db.collection('metaPhoneMappings').doc(config.phoneNumberId).delete();
                console.log(`✅ Deleted phone mapping: ${config.phoneNumberId}`);
            } catch (err) {
                console.warn(`⚠️ Could not delete phone mapping: ${config.phoneNumberId}`);
            }
        }

        // Optionally delete all conversations and messages
        if (deleteConversations) {
            // Get all conversations for this partner
            const conversationsSnapshot = await db
                .collection('metaWhatsAppConversations')
                .where('partnerId', '==', partnerId)
                .get();

            const batch = db.batch();
            let deleteCount = 0;

            for (const convDoc of conversationsSnapshot.docs) {
                // Delete all messages in this conversation
                const messagesSnapshot = await db
                    .collection('metaWhatsAppMessages')
                    .where('conversationId', '==', convDoc.id)
                    .get();

                messagesSnapshot.docs.forEach(msgDoc => {
                    batch.delete(msgDoc.ref);
                    deleteCount++;
                });

                // Delete the conversation
                batch.delete(convDoc.ref);
                deleteCount++;
            }

            if (deleteCount > 0) {
                await batch.commit();
                console.log(`✅ Deleted ${deleteCount} conversations/messages for partner: ${partnerId}`);
            }
        }

        // Remove the entire metaWhatsAppConfig from the partner document
        await db.collection('partners').doc(partnerId).update({
            metaWhatsAppConfig: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Meta WhatsApp account deleted for partner: ${partnerId}`);
        return {
            success: true,
            message: deleteConversations
                ? 'WhatsApp Business account and all conversations deleted. You can now set up a new account.'
                : 'WhatsApp Business account deleted. You can now set up a new account.'
        };
    } catch (error: any) {
        console.error('❌ Error deleting Meta WhatsApp account:', error);
        return { success: false, message: error.message };
    }
}

export async function getMetaWhatsAppStatus(
    partnerId: string
): Promise<{ connected: boolean; config: Omit<MetaWhatsAppConfig, 'encryptedAccessToken'> | null }> {
    try {
        const config = await getPartnerMetaConfig(partnerId);

        if (!config) {
            return { connected: false, config: null };
        }

        const { encryptedAccessToken, ...safeConfig } = config;

        return {
            connected: config.status === 'active',
            config: safeConfig as Omit<MetaWhatsAppConfig, 'encryptedAccessToken'>,
        };
    } catch {
        return { connected: false, config: null };
    }
}

export async function sendMetaWhatsAppMessageAction(
    input: SendMetaWhatsAppInput
): Promise<SendMetaWhatsAppResult> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        console.log('📤 [OUTBOUND] Step 1 - Input received:', JSON.stringify({
            partnerId: input.partnerId,
            to: input.to,
            hasMessage: !!input.message,
            hasMedia: !!input.mediaUrl,
            hasTemplate: !!input.templateName,
            conversationId: input.conversationId,
        }));

        const config = await getPartnerMetaConfig(input.partnerId);
        console.log('📤 [OUTBOUND] Step 2 - Config:', JSON.stringify({
            hasConfig: !!config,
            status: config?.status,
            phoneNumberId: config?.phoneNumberId,
            hasEncryptedToken: !!config?.encryptedAccessToken,
        }));

        if (!config || config.status !== 'active') {
            console.error('📤 [OUTBOUND] BLOCKED - Meta WhatsApp not configured or inactive');
            return {
                success: false,
                message: 'Meta WhatsApp not configured or inactive'
            };
        }

        if (!input.to) {
            console.error('📤 [OUTBOUND] BLOCKED - No recipient phone number provided');
            return { success: false, message: 'No recipient phone number provided' };
        }

        const normalizedPhone = input.to.replace(/\D/g, '');
        console.log('📤 [OUTBOUND] Step 3 - Normalized phone:', normalizedPhone);

        if (!input.message && !input.mediaUrl) {
            return { success: false, message: 'No message content or media provided' };
        }

        console.log('📤 [OUTBOUND] Step 4 - Calling Meta API:', input.templateName ? 'template' : input.interactiveButtons?.length ? 'interactive' : input.mediaUrl ? 'media' : 'text');
        let metaResponse;
        if (input.templateName) {
            const { sendMetaTemplateMessage } = await import('@/lib/meta-whatsapp-service');
            metaResponse = await sendMetaTemplateMessage(
                input.partnerId,
                normalizedPhone,
                input.templateName,
                input.templateLanguage || 'en_US',
                input.templateComponents || []
            );
        } else if (input.interactiveButtons && input.interactiveButtons.length > 0) {
            // Send as WhatsApp interactive CTA_URL message
            const { sendMetaInteractiveMessage } = await import('@/lib/meta-whatsapp-service');
            metaResponse = await sendMetaInteractiveMessage(
                input.partnerId,
                normalizedPhone,
                input.message || '',
                input.interactiveButtons.map(b => ({ text: b.text, url: b.url })),
                input.mediaUrl, // header image
            );
        } else if (input.mediaUrl && input.mediaType) {
            metaResponse = await sendMetaMediaMessage(
                input.partnerId,
                normalizedPhone,
                input.mediaType,
                input.mediaUrl,
                input.message, // caption
                input.filename
            );
        } else {
            metaResponse = await sendMetaTextMessage(
                input.partnerId,
                normalizedPhone,
                input.message || ''
            );
        }

        console.log('📤 [OUTBOUND] Step 5 - Meta API response:', JSON.stringify(metaResponse));
        const metaMessageId = metaResponse.messages[0]?.id;
        const waId = metaResponse.contacts[0]?.wa_id;

        let conversationId = input.conversationId;

        if (!conversationId) {
            const existingConvSnapshot = await db
                .collection('metaWhatsAppConversations')
                .where('partnerId', '==', input.partnerId)
                .where('customerWaId', '==', waId)
                .limit(1)
                .get();

            if (!existingConvSnapshot.empty) {
                conversationId = existingConvSnapshot.docs[0].id;
            } else {
                const newConvRef = db.collection('metaWhatsAppConversations').doc();
                const newConversation: Omit<MetaWhatsAppConversation, 'id'> = {
                    partnerId: input.partnerId,
                    platform: 'meta_whatsapp',
                    customerPhone: `+${waId}`,
                    customerWaId: waId,
                    phoneNumberId: config.phoneNumberId,
                    type: 'direct',
                    title: `WhatsApp: +${waId}`,
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

        const messageRef = db.collection('metaWhatsAppMessages').doc();
        const messageData: Omit<MetaWhatsAppMessage, 'id'> = {
            conversationId,
            senderId: input.partnerId,
            partnerId: input.partnerId,
            type: input.mediaType || 'text',
            content: input.message || (input.mediaType ? `[${input.mediaType}]` : ''),
            direction: 'outbound',
            platform: 'meta_whatsapp',
            metaMetadata: {
                messageId: metaMessageId,
                phoneNumberId: config.phoneNumberId,
                waId,
                status: 'sent',
                timestamp: new Date().toISOString(),
                mediaUrl: input.mediaUrl,
                mimeType: input.mediaType,
                filename: input.filename
            },
            createdAt: FieldValue.serverTimestamp(),
        };

        await messageRef.set({ id: messageRef.id, ...messageData });

        const messagePreview = input.mediaType
            ? `📷 ${input.mediaType}`
            : (input.message?.substring(0, 50) || 'Media message');

        // Check if conversation exists (handle temp conversations)
        const conversationRef = db.collection('metaWhatsAppConversations').doc(conversationId);
        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists || conversationId.startsWith('temp_')) {
            // Create new conversation if it doesn't exist or is temporary
            const newConversation: Omit<MetaWhatsAppConversation, 'id'> = {
                partnerId: input.partnerId,
                platform: 'meta_whatsapp',
                customerPhone: `+${waId}`,
                customerWaId: waId,
                phoneNumberId: config.phoneNumberId,
                type: 'direct',
                title: `WhatsApp: +${waId}`,
                isActive: true,
                messageCount: 1,
                unreadCount: 0,
                lastMessageAt: FieldValue.serverTimestamp(),
                lastMessagePreview: messagePreview,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };

            // Use a new ID if the current one is temporary
            if (conversationId.startsWith('temp_')) {
                const newConvRef = db.collection('metaWhatsAppConversations').doc();
                await newConvRef.set({ id: newConvRef.id, ...newConversation });
                conversationId = newConvRef.id;

                // Update the message with the real conversation ID
                await messageRef.update({ conversationId: newConvRef.id });
            } else {
                await conversationRef.set({ id: conversationId, ...newConversation });
            }
        } else {
            // Update existing conversation
            await conversationRef.update({
                lastMessageAt: FieldValue.serverTimestamp(),
                lastMessagePreview: messagePreview,
                messageCount: FieldValue.increment(1),
                isActive: true,
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Trigger persona generation logic
            const convData = conversationDoc.exists ? conversationDoc.data() : null;
            const contactId = convData?.contactId;

            if (contactId) {
                // Increment message count and check if we should generate
                const { shouldGeneratePersona, currentCount } = await incrementContactMessageCountAction(
                    input.partnerId,
                    contactId
                );

                if (shouldGeneratePersona) {
                    console.log(`🧠 Triggering background persona generation for contact: ${contactId} (${currentCount} messages)`);

                    // Call without awaiting to not block response
                    triggerPersonaGenerationAction(input.partnerId, contactId, false)
                        .then(result => {
                            if (result.success) {
                                console.log(`✅ Background persona generation completed for: ${contactId}`);
                            } else {
                                console.warn(`⚠️ Background persona generation failed: ${result.message}`);
                            }
                        })
                        .catch(err => {
                            console.error(`❌ Background persona generation error:`, err);
                        });
                }
            }

        }

        return {
            success: true,
            message: 'Message sent successfully',
            messageId: messageRef.id,
            metaMessageId,
            conversationId,
        };

    } catch (error: any) {
        console.error('❌ [OUTBOUND] Error sending Meta WhatsApp message:', error);
        const errMsg = (error as Error).message || '';

        if (
            errMsg.toLowerCase().includes('payment') ||
            errMsg.toLowerCase().includes('billing') ||
            errMsg.toLowerCase().includes('missing valid payment') ||
            errMsg.toLowerCase().includes('free tier') ||
            errMsg.toLowerCase().includes('business eligibility')
        ) {
            return {
                success: false,
                message: 'Payment method required: Your WhatsApp Business Account needs a valid payment method and GST/Tax ID configured in Meta Business Manager. Go to Apps → WhatsApp API for setup instructions.',
            };
        }

        if (errMsg.includes('24-hour messaging window') || errMsg.includes('131047')) {
            return {
                success: false,
                message: 'The 24-hour messaging window has expired for this customer. Send a template message to re-engage them. Go to Inbox → Templates to create and send one.',
            };
        }

        if (errMsg.includes('Rate limited') || errMsg.includes('130429')) {
            return {
                success: false,
                message: 'Rate limited by WhatsApp. Please wait a moment and try again.',
            };
        }

        if (errMsg.includes('access token') || errMsg.includes('OAuthException') || errMsg.includes('Session has expired')) {
            return {
                success: false,
                message: 'Your Meta access token has expired. Go to Apps → WhatsApp API and click "Fix Connection" to refresh it.',
            };
        }

        return { success: false, message: error.message };
    }
}

export async function markConversationAsRead(
    partnerId: string,
    conversationId: string
): Promise<{ success: boolean }> {
    if (!db) {
        return { success: false };
    }

    try {
        await db.collection('metaWhatsAppConversations').doc(conversationId).update({
            unreadCount: 0,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function subscribeToWebhookFields(
    partnerId: string,
    appId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const config = await getPartnerMetaConfig(partnerId);

        if (!config) {
            return {
                success: false,
                message: 'Meta WhatsApp configuration not found'
            };
        }

        const { encryptedAccessToken, verifyToken } = config;
        const accessToken = require('@/lib/encryption').decrypt(encryptedAccessToken);
        const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/meta/whatsapp`
            : 'https://www.centy.dev/api/webhooks/meta/whatsapp';

        // Subscribe to webhook fields
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${appId}/subscriptions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    object: 'whatsapp_business_account',
                    callback_url: callbackUrl,
                    fields: 'messages,message_template_status_update',
                    verify_token: verifyToken,
                    access_token: accessToken
                }).toString()
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Webhook subscription failed:', data);
            return {
                success: false,
                message: data.error?.message || 'Failed to subscribe to webhook fields'
            };
        }

        console.log('✅ Webhook subscribed successfully:', data);

        return {
            success: true,
            message: 'Successfully subscribed to webhook fields (messages, message_template_status_update)'
        };

    } catch (error: any) {
        console.error('❌ Error subscribing to webhook:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteMetaConversation(
    partnerId: string,
    conversationId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        // Verify ownership
        const convDoc = await db.collection('metaWhatsAppConversations').doc(conversationId).get();
        if (!convDoc.exists) {
            return { success: false, message: 'Conversation not found' };
        }

        const convData = convDoc.data();
        if (convData?.partnerId !== partnerId) {
            return { success: false, message: 'Unauthorized' };
        }

        // Delete conversation
        await db.collection('metaWhatsAppConversations').doc(conversationId).delete();

        return { success: true, message: 'Conversation deleted successfully' };
    } catch (error: any) {
        console.error('❌ Error deleting conversation:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteMetaMessage(
    partnerId: string,
    messageId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        // Verify ownership
        const msgDoc = await db.collection('metaWhatsAppMessages').doc(messageId).get();
        if (!msgDoc.exists) {
            return { success: false, message: 'Message not found' };
        }

        const msgData = msgDoc.data();
        if (msgData?.partnerId !== partnerId) {
            return { success: false, message: 'Unauthorized' };
        }

        // Delete message
        await db.collection('metaWhatsAppMessages').doc(messageId).delete();

        return { success: true, message: 'Message deleted successfully' };
    } catch (error: any) {
        console.error('❌ Error deleting message:', error);
        return { success: false, message: error.message };
    }
}

export async function getMetaWhatsAppTemplatesAction(partnerId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const { getMetaTemplates } = await import('@/lib/meta-whatsapp-service');
        const data = await getMetaTemplates(partnerId);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Error fetching templates:', error);
        return { success: false, message: error.message };
    }
}

export async function createMetaWhatsAppTemplateAction(partnerId: string, templateData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const { createMetaTemplate } = await import('@/lib/meta-whatsapp-service');
        const data = await createMetaTemplate(partnerId, templateData);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Error creating template:', error);
        return { success: false, message: error.message };
    }
}

export async function deleteMetaWhatsAppTemplateAction(partnerId: string, templateName: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const { deleteMetaTemplate } = await import('@/lib/meta-whatsapp-service');
        const data = await deleteMetaTemplate(partnerId, templateName);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Error deleting template:', error);
        return { success: false, message: error.message };
    }
}

export async function updateConversationAssistantsAction(
    partnerId: string,
    conversationId: string,
    assistantIds: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!db) {
            return { success: false, error: 'Database unavailable' };
        }

        await db
            .collection('metaWhatsAppConversations')
            .doc(conversationId)
            .update({
                assignedAssistantIds: assistantIds,
                updatedAt: Timestamp.now(),
            });

        console.log(`✅ Updated conversation ${conversationId} with assistants:`, assistantIds);

        return { success: true };
    } catch (error: any) {
        console.error('Update conversation assistants error:', error);
        return { success: false, error: error.message };
    }
}
