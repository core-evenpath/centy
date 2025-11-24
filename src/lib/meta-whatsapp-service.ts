'use server';

import { db } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
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
        throw new Error(errorData.error?.message || `Meta API error: ${response.status}`);
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
