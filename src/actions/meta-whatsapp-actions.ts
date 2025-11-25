'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { encrypt, generateVerifyToken } from '@/lib/encryption';
import {
    sendMetaTextMessage,
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
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig as MetaWhatsAppConfig;

        if (config?.phoneNumberId) {
            await db.collection('metaPhoneMappings').doc(config.phoneNumberId).delete();
        }

        await db.collection('partners').doc(partnerId).update({
            'metaWhatsAppConfig.status': 'disconnected',
            'metaWhatsAppConfig.encryptedAccessToken': FieldValue.delete(),
            'metaWhatsAppConfig.updatedAt': new Date().toISOString(),
        });

        console.log(`✅ Meta WhatsApp disconnected for partner: ${partnerId}`);
        return { success: true, message: 'WhatsApp Business disconnected' };
    } catch (error: any) {
        console.error('❌ Error disconnecting Meta WhatsApp:', error);
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
        const config = await getPartnerMetaConfig(input.partnerId);

        if (!config || config.status !== 'active') {
            return {
                success: false,
                message: 'Meta WhatsApp not configured or inactive'
            };
        }

        const normalizedPhone = input.to.replace(/\D/g, '');

        if (!input.message) {
            return { success: false, message: 'No message content provided' };
        }

        const metaResponse = await sendMetaTextMessage(
            input.partnerId,
            normalizedPhone,
            input.message
        );

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
            type: 'text',
            content: input.message,
            direction: 'outbound',
            platform: 'meta_whatsapp',
            metaMetadata: {
                messageId: metaMessageId,
                phoneNumberId: config.phoneNumberId,
                waId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            },
            createdAt: FieldValue.serverTimestamp(),
        };

        await messageRef.set({ id: messageRef.id, ...messageData });

        const messagePreview = input.message.substring(0, 50);

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
        }

        return {
            success: true,
            message: 'Message sent successfully',
            messageId: messageRef.id,
            metaMessageId,
            conversationId,
        };

    } catch (error: any) {
        console.error('❌ Error sending Meta WhatsApp message:', error);
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
