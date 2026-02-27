'use server';

import { db } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
import { refreshMetaAccessToken } from '@/actions/meta-whatsapp-config-actions';
import type { MetaWhatsAppConfig } from '@/lib/types-meta-whatsapp';

const META_API_VERSION = 'v18.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export async function getPartnerMetaConfig(partnerId: string): Promise<MetaWhatsAppConfig | null> {
    if (!db) {
        throw new Error('Database not available');
    }

    const partnerDoc = await db.collection('partners').doc(partnerId).get();

    if (!partnerDoc.exists) {
        return null;
    }

    const data = partnerDoc.data();
    return data?.metaWhatsAppConfig as MetaWhatsAppConfig | null;
}

export async function getDecryptedAccessToken(partnerId: string): Promise<string> {
    const config = await getPartnerMetaConfig(partnerId);

    if (!config || !config.encryptedAccessToken) {
        throw new Error('Meta WhatsApp not configured for this partner');
    }

    return decrypt(config.encryptedAccessToken);
}

export async function sendMetaTextMessage(
    partnerId: string,
    to: string,
    body: string
): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);

    if (!config || config.status !== 'active') {
        throw new Error('Meta WhatsApp not configured or inactive');
    }

    const accessToken = await getDecryptedAccessToken(partnerId);
    const normalizedTo = to.replace(/\D/g, '');

    console.log(`📤 [META-API] Sending text message to ${normalizedTo} via phoneNumberId=${config.phoneNumberId}`);

    const response = await fetch(
        `${META_API_BASE}/${config.phoneNumberId}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: normalizedTo,
                type: 'text',
                text: { body, preview_url: true },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error('📤 [META-API] Send text error:', JSON.stringify(errorData));
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;
        const errorCode = errorData.error?.code;
        if (
            errorCode === 131042 ||
            errorMsg.toLowerCase().includes('payment') ||
            errorMsg.toLowerCase().includes('free tier') ||
            errorMsg.toLowerCase().includes('business eligibility') ||
            errorMsg.toLowerCase().includes('missing valid payment')
        ) {
            throw new Error(
                'Missing payment method: Add a valid payment method and GST/Tax ID to your WhatsApp Business Account in Meta Business Manager (business.facebook.com → Billing Hub).'
            );
        }
        if (errorCode === 131047) {
            throw new Error(
                'The 24-hour messaging window has expired for this customer. Send a template message to re-engage them. Go to Inbox → Templates to create and send one.'
            );
        }
        if (errorCode === 130429) {
            throw new Error(
                'Rate limited by WhatsApp. Please wait a moment and try again.'
            );
        }
        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                // Retry with new token
                const retryResp = await fetch(
                    `${META_API_BASE}/${config.phoneNumberId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            recipient_type: 'individual',
                            to: normalizedTo,
                            type: 'text',
                            text: { body, preview_url: true },
                        }),
                    }
                );
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function findPartnerByPhoneNumberId(
    phoneNumberId: string
): Promise<string | null> {
    if (!db) {
        return null;
    }

    const mappingDoc = await db
        .collection('metaPhoneMappings')
        .doc(phoneNumberId)
        .get();

    if (!mappingDoc.exists) {
        const partnersSnapshot = await db
            .collection('partners')
            .where('metaWhatsAppConfig.phoneNumberId', '==', phoneNumberId)
            .where('metaWhatsAppConfig.status', '==', 'active')
            .limit(1)
            .get();

        if (partnersSnapshot.empty) {
            return null;
        }

        return partnersSnapshot.docs[0].id;
    }

    return mappingDoc.data()?.partnerId || null;
}

export async function sendMetaMediaMessage(
    partnerId: string,
    to: string,
    type: 'image' | 'video' | 'document' | 'audio',
    mediaUrl: string,
    caption?: string,
    filename?: string
): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);

    if (!config || config.status !== 'active') {
        throw new Error('Meta WhatsApp not configured or inactive');
    }

    const accessToken = await getDecryptedAccessToken(partnerId);
    const normalizedTo = to.replace(/\D/g, '');

    const body: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: type,
    };

    if (type === 'image') {
        body.image = { link: mediaUrl, caption };
    } else if (type === 'video') {
        body.video = { link: mediaUrl, caption };
    } else if (type === 'document') {
        body.document = { link: mediaUrl, caption, filename };
    } else if (type === 'audio') {
        body.audio = { link: mediaUrl };
    }

    const response = await fetch(
        `${META_API_BASE}/${config.phoneNumberId}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error('📤 [META-API] Send media error:', JSON.stringify(errorData));
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;
        const errorCode = errorData.error?.code;

        if (
            errorCode === 131042 ||
            errorMsg.toLowerCase().includes('payment') ||
            errorMsg.toLowerCase().includes('free tier') ||
            errorMsg.toLowerCase().includes('business eligibility') ||
            errorMsg.toLowerCase().includes('missing valid payment')
        ) {
            throw new Error(
                'Missing payment method: Add a valid payment method and GST/Tax ID to your WhatsApp Business Account in Meta Business Manager (business.facebook.com → Billing Hub).'
            );
        }

        if (errorCode === 131047) {
            throw new Error(
                'The 24-hour messaging window has expired for this customer. Send a template message to re-engage them. Go to Inbox → Templates to create and send one.'
            );
        }

        if (errorCode === 130429) {
            throw new Error(
                'Rate limited by WhatsApp. Please wait a moment and try again.'
            );
        }

        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                const retryResp = await fetch(
                    `${META_API_BASE}/${config.phoneNumberId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body),
                    }
                );
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function processAndUploadMedia(
    partnerId: string,
    mediaId: string
): Promise<string | null> {
    try {
        const config = await getPartnerMetaConfig(partnerId);
        if (!config) return null;

        const accessToken = await getDecryptedAccessToken(partnerId);

        // 1. Get Media Info from Meta
        const mediaResponse = await fetch(`${META_API_BASE}/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!mediaResponse.ok) {
            console.error('Failed to fetch media info:', await mediaResponse.text());
            return null;
        }

        const mediaData = await mediaResponse.json();
        const mediaUrl = mediaData.url;
        const mimeType = mediaData.mime_type;

        if (!mediaUrl) return null;

        // 2. Download Media Binary from Meta
        const binaryResponse = await fetch(mediaUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!binaryResponse.ok) {
            console.error('Failed to download media binary');
            return null;
        }

        const arrayBuffer = await binaryResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Upload to Firebase Storage using firebase-admin
        const { adminStorage } = await import('@/lib/firebase-admin');
        const bucket = adminStorage.bucket();
        const extension = mimeType.split('/')[1] || 'bin';
        const timestamp = Date.now();
        const filename = `chat/${partnerId}/whatsapp/incoming/${timestamp}_${mediaId}.${extension}`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                customMetadata: {
                    partnerId,
                    mediaId,
                    source: 'whatsapp_incoming',
                    uploadedAt: new Date().toISOString()
                }
            },
        });

        // Make file public and get URL
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        console.log(`✅ Media uploaded successfully: ${publicUrl}`);
        return publicUrl;

    } catch (error) {
        console.error('❌ Error processing media:', error);
        return null;
    }
}

export async function getWhatsAppProfilePicture(
    partnerId: string,
    waId: string
): Promise<string | null> {
    try {
        const config = await getPartnerMetaConfig(partnerId);
        if (!config) return null;

        const accessToken = await getDecryptedAccessToken(partnerId);

        // Fetch profile picture URL from Meta
        const response = await fetch(
            `${META_API_BASE}/${waId}/profile_picture`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            }
        );

        if (!response.ok) {
            console.log(`No profile picture found for ${waId}`);
            return null;
        }

        const data = await response.json();
        const profilePicUrl = data.data?.url;

        if (!profilePicUrl) return null;

        // Download profile picture
        const imageResponse = await fetch(profilePicUrl);
        if (!imageResponse.ok) return null;

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Firebase Storage
        const { adminStorage } = await import('@/lib/firebase-admin');
        const bucket = adminStorage.bucket();
        const filename = `chat/${partnerId}/whatsapp/profile-pictures/${waId}.jpg`;
        const file = bucket.file(filename);

        await file.save(buffer, {
            metadata: {
                contentType: 'image/jpeg',
                customMetadata: {
                    partnerId,
                    waId,
                    source: 'whatsapp_profile_picture',
                    uploadedAt: new Date().toISOString()
                }
            },
        });

        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

        console.log(`✅ Profile picture stored: ${waId}`);
        return publicUrl;

    } catch (error) {
        console.error('❌ Error fetching profile picture:', error);
        return null;
    }
}

export async function getMetaTemplates(partnerId: string): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);
    if (!config || config.status !== 'active') throw new Error('Meta WhatsApp not configured');

    const accessToken = await getDecryptedAccessToken(partnerId);

    const response = await fetch(`${META_API_BASE}/${config.wabaId}/message_templates`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;

        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                const retryResp = await fetch(`${META_API_BASE}/${config.wabaId}/message_templates`, {
                    headers: { 'Authorization': `Bearer ${newToken}` }
                });
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function createMetaTemplate(partnerId: string, templateData: any): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);
    if (!config || config.status !== 'active') throw new Error('Meta WhatsApp not configured');

    const accessToken = await getDecryptedAccessToken(partnerId);

    const response = await fetch(`${META_API_BASE}/${config.wabaId}/message_templates`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;

        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                const retryResp = await fetch(`${META_API_BASE}/${config.wabaId}/message_templates`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(templateData)
                });
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function deleteMetaTemplate(partnerId: string, templateName: string): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);
    if (!config || config.status !== 'active') throw new Error('Meta WhatsApp not configured');

    const accessToken = await getDecryptedAccessToken(partnerId);

    const response = await fetch(`${META_API_BASE}/${config.wabaId}/message_templates?name=${templateName}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;

        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                const retryResp = await fetch(`${META_API_BASE}/${config.wabaId}/message_templates?name=${templateName}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${newToken}`
                    }
                });
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function sendMetaTemplateMessage(
    partnerId: string,
    to: string,
    templateName: string,
    languageCode: string,
    components: any[] = []
): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);

    if (!config || config.status !== 'active') {
        throw new Error('Meta WhatsApp not configured or inactive');
    }

    const accessToken = await getDecryptedAccessToken(partnerId);
    const normalizedTo = to.replace(/\D/g, '');

    const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode
            },
            components: components
        }
    };

    const response = await fetch(
        `${META_API_BASE}/${config.phoneNumberId}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;

        // Check for payment/billing errors before session-expired
        if (
            errorData.error?.code === 131042 ||
            errorMsg.toLowerCase().includes('payment') ||
            errorMsg.toLowerCase().includes('free tier') ||
            errorMsg.toLowerCase().includes('business eligibility') ||
            errorMsg.toLowerCase().includes('missing valid payment')
        ) {
            throw new Error(
                'Missing payment method: Add a valid payment method and GST/Tax ID to your WhatsApp Business Account in Meta Business Manager (business.facebook.com → Billing Hub).'
            );
        }

        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                const retryResp = await fetch(
                    `${META_API_BASE}/${config.phoneNumberId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body),
                    }
                );
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

/**
 * Send a WhatsApp interactive message with CTA URL buttons.
 * Uses the WhatsApp Business API "interactive" message type with "cta_url" action.
 */
export async function sendMetaInteractiveMessage(
    partnerId: string,
    to: string,
    bodyText: string,
    ctaButtons: Array<{ text: string; url: string }>,
    headerImageUrl?: string,
    footerText?: string
): Promise<any> {
    const config = await getPartnerMetaConfig(partnerId);

    if (!config || config.status !== 'active') {
        throw new Error('Meta WhatsApp not configured or inactive');
    }

    const accessToken = await getDecryptedAccessToken(partnerId);
    const normalizedTo = to.replace(/\D/g, '');

    // WhatsApp interactive "cta_url" supports a single CTA button per message.
    // For multiple CTA buttons, we send separate interactive messages.
    // However, for the best UX, we use "button" type for reply-style quick actions
    // and append extra CTA URLs to the body text if there are more than 1.

    // Build the interactive payload for the first CTA button
    const firstCta = ctaButtons[0];
    const interactive: any = {
        type: 'cta_url',
        body: { text: bodyText },
        action: {
            name: 'cta_url',
            parameters: {
                display_text: firstCta.text,
                url: firstCta.url,
            }
        }
    };

    if (headerImageUrl) {
        interactive.header = { type: 'image', image: { link: headerImageUrl } };
    }

    if (footerText) {
        interactive.footer = { text: footerText };
    }

    // If there are additional CTA buttons, append them as links in the body
    if (ctaButtons.length > 1) {
        const extraLinks = ctaButtons.slice(1).map(btn => `🔗 *${btn.text}*: ${btn.url}`).join('\n');
        interactive.body.text = bodyText + '\n\n' + extraLinks;
    }

    const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizedTo,
        type: 'interactive',
        interactive,
    };

    const response = await fetch(
        `${META_API_BASE}/${config.phoneNumberId}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error?.message || `Meta API error: ${response.status}`;

        // Check for payment/billing errors before session-expired
        if (
            errorData.error?.code === 131042 ||
            errorMsg.toLowerCase().includes('payment') ||
            errorMsg.toLowerCase().includes('free tier') ||
            errorMsg.toLowerCase().includes('business eligibility') ||
            errorMsg.toLowerCase().includes('missing valid payment')
        ) {
            throw new Error(
                'Missing payment method: Add a valid payment method and GST/Tax ID to your WhatsApp Business Account in Meta Business Manager (business.facebook.com → Billing Hub).'
            );
        }

        if (errorMsg.toLowerCase().includes('session has expired')) {
            try {
                const newToken = await refreshMetaAccessToken(partnerId);
                const retryResp = await fetch(
                    `${META_API_BASE}/${config.phoneNumberId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body),
                    }
                );
                if (!retryResp.ok) {
                    const retryError = await retryResp.json();
                    throw new Error(retryError.error?.message || `Meta API error after refresh: ${retryResp.status}`);
                }
                return retryResp.json();
            } catch (refreshErr: any) {
                throw new Error(`Failed to refresh Meta token: ${refreshErr.message}`);
            }
        }
        throw new Error(errorMsg);
    }

    return response.json();
}
