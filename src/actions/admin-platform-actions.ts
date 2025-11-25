'use server';

import { db } from '@/lib/firebase-admin';
import { encrypt, decrypt } from '@/lib/encryption';
import { PlatformMetaConfig } from '@/lib/types-platform';
import { revalidatePath } from 'next/cache';

const PLATFORM_CONFIG_DOC = 'platform_config';

export async function getPlatformMetaConfig(): Promise<PlatformMetaConfig | null> {
    if (!db) return null;

    try {
        const doc = await db.collection('system').doc(PLATFORM_CONFIG_DOC).get();
        if (!doc.exists) return null;

        const data = doc.data();
        return data?.meta as PlatformMetaConfig || null;
    } catch (error) {
        console.error('Error fetching platform config:', error);
        return null;
    }
}

export async function savePlatformMetaConfig(data: {
    appId: string;
    appSecret: string;
    verifyToken: string;
    webhookUrl: string;
    userId: string;
}) {
    if (!db) return { success: false, message: 'Database not available' };

    try {
        const encryptedAppSecret = encrypt(data.appSecret);

        const config: PlatformMetaConfig = {
            appId: data.appId,
            encryptedAppSecret,
            verifyToken: data.verifyToken,
            webhookUrl: data.webhookUrl,
            updatedAt: new Date().toISOString(),
            updatedBy: data.userId
        };

        await db.collection('system').doc(PLATFORM_CONFIG_DOC).set({
            meta: config
        }, { merge: true });

        revalidatePath('/admin/settings/platform');
        return { success: true, message: 'Platform configuration saved successfully' };
    } catch (error: any) {
        console.error('Error saving platform config:', error);
        return { success: false, message: error.message };
    }
}

export async function getDecryptedAppSecret(): Promise<string | null> {
    const config = await getPlatformMetaConfig();
    if (!config || !config.encryptedAppSecret) return null;
    return decrypt(config.encryptedAppSecret);
}
