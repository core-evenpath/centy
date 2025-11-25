// src/actions/meta-whatsapp-config-actions.ts
"use server";

import { db } from '@/lib/firebase-admin';
import { encrypt, decrypt } from '@/lib/encryption';
import { getPlatformMetaConfig } from '@/actions/admin-platform-actions';
import type { MetaWhatsAppConfig } from '@/lib/types-meta-whatsapp';

/**
 * Update the encrypted access token for a partner's Meta WhatsApp configuration.
 */
export async function updatePartnerAccessToken(partnerId: string, newAccessToken: string) {
    if (!db) {
        throw new Error('Database not available');
    }

    const encrypted = encrypt(newAccessToken);

    // Merge the new encrypted token into the partner document.
    await db
        .collection('partners')
        .doc(partnerId)
        .set(
            {
                metaWhatsAppConfig: {
                    encryptedAccessToken: encrypted,
                },
            },
            { merge: true }
        );
}

/**
 * Refresh a short‑lived Meta access token using the platform app credentials.
 * Returns the new long‑lived token.
 */
export async function refreshMetaAccessToken(partnerId: string): Promise<string> {
    // 1️⃣ Get platform (global) Meta credentials.
    const platformConfig = await getPlatformMetaConfig();
    // Fallback to environment variables if admin config not yet saved
    const appId = platformConfig?.appId ?? process.env.META_APP_ID;
    const appSecret = platformConfig?.appSecret ?? process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
        throw new Error('Platform Meta configuration not found');
    }

    // 2️⃣ Decrypt the current short‑lived token for this partner.
    const shortLived = await (async () => {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        const config = partnerDoc.data()?.metaWhatsAppConfig as MetaWhatsAppConfig | undefined;
        if (!config?.encryptedAccessToken) {
            throw new Error('No access token stored for this partner');
        }
        return decrypt(config.encryptedAccessToken);
    })();

    // 3️⃣ Call Meta's token‑exchange endpoint.
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLived}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || 'Failed to refresh Meta access token');
    }
    const data = await resp.json();
    const newToken = data.access_token as string;

    // 4️⃣ Persist the refreshed token.
    await updatePartnerAccessToken(partnerId, newToken);

    return newToken;
}
