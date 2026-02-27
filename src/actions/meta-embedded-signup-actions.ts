'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { encrypt, decrypt, generateVerifyToken } from '@/lib/encryption';
import type {
    EmbeddedSignupCompleteInput,
    EmbeddedSignupCompleteResult,
    TokenExchangeResponse,
    WABADetails,
    PhoneNumberDetails,
} from '@/lib/types-meta-embedded';
import type { MetaPhoneMapping } from '@/lib/types-meta-whatsapp';

const META_API_VERSION = 'v24.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

import { getPlatformMetaConfig } from '@/actions/admin-platform-actions';

// Helper function to subscribe to webhook fields at the app level
async function subscribeWebhookFieldsForEmbeddedSignup(
    wabaId: string,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/meta/whatsapp`
        : 'https://www.centy.dev/api/webhooks/meta/whatsapp';

    // Fetch platform config to match the logic in the webhook route
    const platformConfig = await getPlatformMetaConfig();
    const verifyToken = platformConfig?.verifyToken || process.env.META_WHATSAPP_VERIFY_TOKEN || 'centy_webhook_verify';

    if (!appId) {
        console.error('Missing NEXT_PUBLIC_META_APP_ID for webhook subscription');
        return { success: false, error: 'Meta App ID not configured' };
    }

    try {
        console.log('🔄 Subscribing to webhook fields for app:', appId);
        console.log('📍 Callback URL:', callbackUrl);

        const response = await fetch(
            `${META_API_BASE}/${appId}/subscriptions`,
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
            // Handle "already subscribed" or permission errors gracefully
            if (data.error?.code === 100 || data.error?.message?.includes('already')) {
                console.log('✅ Webhook fields already subscribed or skipped');
                return { success: true };
            }
            console.error('❌ Webhook subscription failed:', data);
            return { success: false, error: data.error?.message || 'Failed to subscribe to webhook fields' };
        }

        console.log('✅ Webhook fields subscribed successfully');
        return { success: true };
    } catch (error: any) {
        console.error('❌ Webhook subscription error:', error);
        return { success: false, error: error.message };
    }
}

export async function exchangeCodeForToken(code: string): Promise<{
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
}> {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
        console.error('Missing META_APP_SECRET or NEXT_PUBLIC_META_APP_ID');
        return { success: false, error: 'Meta app credentials not configured on server' };
    }

    try {
        const tokenUrl = `${META_API_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;

        console.log('🔄 Exchanging code for token...');

        const response = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Token exchange failed:', data);
            return {
                success: false,
                error: data.error?.message || 'Failed to exchange code for token',
            };
        }

        const tokenData = data as TokenExchangeResponse;
        console.log('✅ Token exchange successful');

        return {
            success: true,
            accessToken: tokenData.access_token,
            expiresIn: tokenData.expires_in,
        };
    } catch (error: any) {
        console.error('❌ Token exchange error:', error);
        return { success: false, error: error.message };
    }
}

export async function getWABADetails(
    wabaId: string,
    accessToken: string
): Promise<{ success: boolean; data?: WABADetails; error?: string }> {
    try {
        const response = await fetch(
            `${META_API_BASE}/${wabaId}?fields=id,name,timezone_id,message_template_namespace,account_review_status,business_verification_status`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Failed to get WABA details:', data);
            return { success: false, error: data.error?.message || 'Failed to get WABA details' };
        }

        return { success: true, data: data as WABADetails };
    } catch (error: any) {
        console.error('❌ WABA details error:', error);
        return { success: false, error: error.message };
    }
}

export async function getPhoneNumberDetails(
    phoneNumberId: string,
    accessToken: string
): Promise<{ success: boolean; data?: PhoneNumberDetails; error?: string }> {
    try {
        console.log('🔄 Fetching phone number details for:', phoneNumberId);

        const response = await fetch(
            `${META_API_BASE}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,name_status`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Failed to get phone number details:', data);
            return { success: false, error: data.error?.message || 'Failed to get phone number details' };
        }

        console.log('✅ Phone number details:', data);
        return { success: true, data: data as PhoneNumberDetails };
    } catch (error: any) {
        console.error('❌ Phone number details error:', error);
        return { success: false, error: error.message };
    }
}

export async function subscribeAppToWABA(
    wabaId: string,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('🔄 Subscribing app to WABA:', wabaId);

        const response = await fetch(`${META_API_BASE}/${wabaId}/subscribed_apps`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle "already subscribed" error gracefully (error code 131060)
            if (data.error?.code === 131060 || data.error?.message?.includes('already subscribed')) {
                console.log('✅ App already subscribed to WABA');
                return { success: true };
            }
            console.error('❌ Failed to subscribe app to WABA:', data);
            return { success: false, error: data.error?.message || 'Failed to subscribe app to WABA' };
        }

        console.log('✅ App subscribed to WABA');
        return { success: data.success === true };
    } catch (error: any) {
        console.error('❌ WABA subscription error:', error);
        return { success: false, error: error.message };
    }
}

export async function unsubscribeAppFromWABA(
    wabaId: string,
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('🔄 Unsubscribing app from WABA:', wabaId);

        const response = await fetch(`${META_API_BASE}/${wabaId}/subscribed_apps`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // If not subscribed, that's fine - consider it a success
            if (data.error?.message?.includes('not subscribed') || data.error?.code === 100) {
                console.log('✅ App was not subscribed to WABA (already unsubscribed)');
                return { success: true };
            }
            console.error('❌ Failed to unsubscribe app from WABA:', data);
            return { success: false, error: data.error?.message || 'Failed to unsubscribe app from WABA' };
        }

        console.log('✅ App unsubscribed from WABA');
        return { success: data.success === true };
    } catch (error: any) {
        console.error('❌ WABA unsubscription error:', error);
        return { success: false, error: error.message };
    }
}

export async function registerPhoneNumber(
    phoneNumberId: string,
    accessToken: string,
    pin?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('🔄 Registering phone number:', phoneNumberId);

        const body: any = {
            messaging_product: 'whatsapp',
        };

        if (pin) {
            body.pin = pin;
        }

        const response = await fetch(`${META_API_BASE}/${phoneNumberId}/register`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.error?.code === 100 && data.error?.error_subcode === 2388093) {
                console.log('✅ Phone already registered');
                return { success: true };
            }
            console.error('❌ Failed to register phone number:', data);
            return { success: false, error: data.error?.message || 'Failed to register phone number' };
        }

        console.log('✅ Phone number registered');
        return { success: data.success === true };
    } catch (error: any) {
        console.error('❌ Phone registration error:', error);
        return { success: false, error: error.message };
    }
}

export async function completeEmbeddedSignup(
    input: EmbeddedSignupCompleteInput
): Promise<EmbeddedSignupCompleteResult> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    const { partnerId, code, wabaId, phoneNumberId } = input;

    try {
        console.log('🚀 Starting Embedded Signup completion for partner:', partnerId);
        console.log('📋 Input:', { wabaId, phoneNumberId, codeLength: code?.length });

        const tokenResult = await exchangeCodeForToken(code);
        if (!tokenResult.success || !tokenResult.accessToken) {
            return { success: false, message: tokenResult.error || 'Failed to exchange code for token' };
        }

        const accessToken = tokenResult.accessToken;

        const phoneDetails = await getPhoneNumberDetails(phoneNumberId, accessToken);
        if (!phoneDetails.success || !phoneDetails.data) {
            return { success: false, message: phoneDetails.error || 'Failed to get phone number details' };
        }

        console.log('✅ Phone number details retrieved:', phoneDetails.data.display_phone_number);

        const subscribeResult = await subscribeAppToWABA(wabaId, accessToken);
        if (!subscribeResult.success) {
            console.warn('⚠️ App subscription warning:', subscribeResult.error);
        }

        // Subscribe to webhook fields at the app level to ensure webhooks are delivered
        const webhookResult = await subscribeWebhookFieldsForEmbeddedSignup(wabaId, accessToken);
        if (!webhookResult.success) {
            console.warn('⚠️ Webhook fields subscription warning:', webhookResult.error);
            // Continue anyway - webhook may already be configured at platform level
        }

        const registerResult = await registerPhoneNumber(phoneNumberId, accessToken);
        if (!registerResult.success) {
            console.warn('⚠️ Phone registration warning:', registerResult.error);
        }

        const verifyToken = generateVerifyToken();
        const encryptedAccessToken = encrypt(accessToken);

        // Check billing status before deciding final status
        let hasBilling = false;
        try {
            const billingResponse = await fetch(
                `${META_API_BASE}/${wabaId}?fields=primary_funding_id,currency`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (billingResponse.ok) {
                const billingData = await billingResponse.json();
                hasBilling = !!billingData.primary_funding_id;
                console.log('💳 Billing check:', hasBilling ? 'Payment method found' : 'No payment method');
            }
        } catch (billingErr) {
            console.warn('⚠️ Could not check billing status:', billingErr);
        }

        // With embedded signup, the app subscription handles webhooks at the app level.
        // The webhook is configured platform-wide in Admin settings.
        // If billing is missing, set status to pending_billing so the UI can guide the partner.
        const configData = {
            phoneNumberId,
            wabaId,
            encryptedAccessToken,
            verifyToken,
            displayPhoneNumber: phoneDetails.data.display_phone_number,
            verifiedName: phoneDetails.data.verified_name,
            qualityRating: phoneDetails.data.quality_rating,
            webhookConfigured: true,  // App-level webhook handles all partners
            status: hasBilling ? 'active' as const : 'pending_billing' as const,
            integrationType: 'embedded_signup' as const,
            lastVerifiedAt: new Date().toISOString(),
            tokenExpiresAt: tokenResult.expiresIn
                ? new Date(Date.now() + tokenResult.expiresIn * 1000).toISOString()
                : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.collection('partners').doc(partnerId).update({
            metaWhatsAppConfig: configData,
        });

        const phoneMapping: MetaPhoneMapping = {
            phoneNumberId,
            partnerId,
            wabaId,
            displayPhoneNumber: phoneDetails.data.display_phone_number,
            createdAt: new Date().toISOString(),
        };

        await db.collection('metaPhoneMappings').doc(phoneNumberId).set(phoneMapping);

        if (hasBilling) {
            console.log('✅ Embedded Signup completed and activated for partner:', partnerId);
            return {
                success: true,
                message: 'WhatsApp Business API connected and activated! You can now send and receive messages.',
                verifyToken,
            };
        } else {
            console.log('✅ Embedded Signup completed (pending billing) for partner:', partnerId);
            return {
                success: true,
                message: 'WhatsApp Business API connected! Please add a payment method to your WhatsApp Business Account to start sending messages.',
                verifyToken,
            };
        }
    } catch (error: any) {
        console.error('❌ Embedded Signup error:', error);
        return { success: false, message: error.message };
    }
}

export async function getEmbeddedSignupStatus(
    partnerId: string
): Promise<{
    connected: boolean;
    config: any | null;
    integrationType?: string;
}> {
    if (!db) {
        return { connected: false, config: null };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return { connected: false, config: null };
        }

        const data = partnerDoc.data();
        const config = data?.metaWhatsAppConfig;

        if (!config) {
            return { connected: false, config: null };
        }

        const { encryptedAccessToken, ...safeConfig } = config;

        return {
            connected: config.status === 'active' || config.status === 'pending_billing',
            config: safeConfig,
            integrationType: config.integrationType,
        };
    } catch (error) {
        console.error('❌ Error getting embedded signup status:', error);
        return { connected: false, config: null };
    }
}

export async function activateEmbeddedSignup(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        // Re-check billing before activating
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig;

        if (config?.encryptedAccessToken && config?.wabaId) {
            try {
                const accessToken = decrypt(config.encryptedAccessToken);
                const billingResponse = await fetch(
                    `${META_API_BASE}/${config.wabaId}?fields=primary_funding_id,currency`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                if (billingResponse.ok) {
                    const billingData = await billingResponse.json();
                    if (!billingData.primary_funding_id) {
                        return {
                            success: false,
                            message: 'Please add a payment method to your WhatsApp Business Account before activating. Go to Meta Business Manager → Billing Hub to add a card.',
                        };
                    }
                }
            } catch (billingErr) {
                console.warn('⚠️ Could not verify billing during activation:', billingErr);
                // Continue with activation if billing check itself fails
            }
        }

        await db.collection('partners').doc(partnerId).update({
            'metaWhatsAppConfig.status': 'active',
            'metaWhatsAppConfig.webhookConfigured': true,
            'metaWhatsAppConfig.lastVerifiedAt': new Date().toISOString(),
            'metaWhatsAppConfig.updatedAt': new Date().toISOString(),
        });

        console.log(`✅ Embedded Signup activated for partner: ${partnerId}`);
        return { success: true, message: 'WhatsApp Business API activated successfully' };
    } catch (error: any) {
        console.error('❌ Error activating Embedded Signup:', error);
        return { success: false, message: error.message };
    }
}

export async function resubscribeWebhooks(
    partnerId: string,
    pin?: string
): Promise<{ success: boolean; message: string; requiresPin?: boolean }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig;

        if (!config) {
            return { success: false, message: 'WhatsApp not configured for this partner' };
        }

        if (!config.encryptedAccessToken || !config.wabaId) {
            return { success: false, message: 'Missing access token or WABA ID' };
        }

        const accessToken = decrypt(config.encryptedAccessToken);

        // Re-subscribe app to WABA
        const subscribeResult = await subscribeAppToWABA(config.wabaId, accessToken);
        if (!subscribeResult.success) {
            console.warn('⚠️ App subscription warning:', subscribeResult.error);
        }

        // Re-subscribe to webhook fields
        const webhookResult = await subscribeWebhookFieldsForEmbeddedSignup(config.wabaId, accessToken);
        if (!webhookResult.success) {
            console.warn('⚠️ Webhook fields subscription warning:', webhookResult.error);
        }

        // Ensure phone number is registered (fixes Error #133010)
        // Pass the optional PIN if provided
        if (config.phoneNumberId) {
            const registerResult = await registerPhoneNumber(config.phoneNumberId, accessToken, pin);
            if (!registerResult.success) {
                console.warn('⚠️ Phone registration warning:', registerResult.error);

                // Detect missing PIN error
                if (registerResult.error?.includes('pin is required') || registerResult.error?.includes('(#100)')) {
                    return {
                        success: false,
                        message: 'Two-step verification PIN is required to register this phone number.',
                        requiresPin: true
                    };
                }
            } else {
                console.log('✅ Phone number registration confirmed');
            }
        }

        // Update the config to mark webhook as configured
        await db.collection('partners').doc(partnerId).update({
            'metaWhatsAppConfig.webhookConfigured': true,
            'metaWhatsAppConfig.updatedAt': new Date().toISOString(),
        });

        console.log(`✅ Webhooks and registration repaired for partner: ${partnerId}`);
        return {
            success: true,
            message: 'Connection repaired: Webhooks resubscribed and phone registration verified.',
        };
    } catch (error: any) {
        console.error('❌ Error resubscribing webhooks:', error);
        return { success: false, message: error.message };
    }
}

export async function disconnectEmbeddedSignup(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig;

        // Unsubscribe app from WABA before disconnecting (allows reconnection later)
        if (config?.wabaId && config?.encryptedAccessToken) {
            try {
                const accessToken = decrypt(config.encryptedAccessToken);
                const unsubResult = await unsubscribeAppFromWABA(config.wabaId, accessToken);
                if (!unsubResult.success) {
                    console.warn('⚠️ Failed to unsubscribe from WABA:', unsubResult.error);
                    // Continue with disconnect even if unsubscribe fails
                }
            } catch (err) {
                console.warn('⚠️ Could not unsubscribe from WABA:', err);
                // Continue with disconnect even if unsubscribe fails
            }
        }

        if (config?.phoneNumberId) {
            await db.collection('metaPhoneMappings').doc(config.phoneNumberId).delete();
        }

        // Remove the entire config to allow fresh reconnection
        await db.collection('partners').doc(partnerId).update({
            metaWhatsAppConfig: FieldValue.delete(),
        });

        console.log(`✅ Embedded Signup disconnected for partner: ${partnerId}`);
        return { success: true, message: 'WhatsApp Business API disconnected. You can now reconnect your business.' };
    } catch (error: any) {
        console.error('❌ Error disconnecting Embedded Signup:', error);
        return { success: false, message: error.message };
    }
}

export async function checkWABABillingStatus(partnerId: string): Promise<{
    success: boolean;
    hasBilling: boolean;
    currency?: string;
    billingError?: string;
}> {
    if (!db) {
        return { success: false, hasBilling: false, billingError: 'Database not available' };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig;

        if (!config || !config.wabaId) {
            return { success: false, hasBilling: false, billingError: 'No WABA connected' };
        }

        if (!config.encryptedAccessToken) {
            return { success: false, hasBilling: false, billingError: 'No access token available' };
        }

        const accessToken = decrypt(config.encryptedAccessToken);

        const response = await fetch(
            `${META_API_BASE}/${config.wabaId}?fields=primary_funding_id,currency`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                hasBilling: false,
                billingError: errorData.error?.message || `Meta API error: ${response.status}`,
            };
        }

        const data = await response.json();

        if (data.primary_funding_id) {
            return { success: true, hasBilling: true, currency: data.currency };
        }

        return { success: true, hasBilling: false };
    } catch (error: any) {
        console.error('❌ Error checking WABA billing status:', error);
        return { success: false, hasBilling: false, billingError: error.message };
    }
}
