'use server';

import { db } from '@/lib/firebase-admin';
import { decrypt } from '@/lib/encryption';
import { getShopInfo } from '@/lib/shopify-service';
import type { ShopifyIntegrationConfig, ShopifyWebhookLogEntry } from '@/lib/types-shopify';

export interface AdminShopifyIntegration extends ShopifyIntegrationConfig {
    partnerId: string;
    partnerName?: string;
}

export async function getAllShopifyIntegrations(): Promise<{
    success: boolean;
    data: AdminShopifyIntegration[];
}> {
    if (!db) {
        return { success: false, data: [] };
    }

    try {
        const mappingsSnapshot = await db.collection('shopifyStoreMappings').get();
        const integrations: AdminShopifyIntegration[] = [];

        for (const mapping of mappingsSnapshot.docs) {
            const { partnerId, shopName } = mapping.data();

            try {
                const configDoc = await db
                    .collection(`partners/${partnerId}/integrations`)
                    .doc('shopify')
                    .get();

                if (configDoc.exists) {
                    const config = configDoc.data() as ShopifyIntegrationConfig;
                    const partnerDoc = await db.collection('partners').doc(partnerId).get();
                    const partnerName = partnerDoc.exists
                        ? (partnerDoc.data()?.businessName || partnerDoc.data()?.name || shopName)
                        : shopName;

                    integrations.push({
                        ...config,
                        encryptedAccessToken: '[REDACTED]',
                        partnerId,
                        partnerName,
                    });
                }
            } catch (err) {
                console.error(`❌ Error loading integration for partner ${partnerId}:`, err);
            }
        }

        return { success: true, data: integrations };
    } catch (error: any) {
        console.error('❌ Error getting all Shopify integrations:', error);
        return { success: false, data: [] };
    }
}

export async function getShopifyWebhookLogs(
    partnerId?: string,
    limit: number = 50
): Promise<{ success: boolean; data: (ShopifyWebhookLogEntry & { partnerId: string })[] }> {
    if (!db) {
        return { success: false, data: [] };
    }

    try {
        const logs: (ShopifyWebhookLogEntry & { partnerId: string })[] = [];

        if (partnerId) {
            const logsSnapshot = await db
                .collection(`partners/${partnerId}/integrations/shopify/webhookLogs`)
                .orderBy('receivedAt', 'desc')
                .limit(limit)
                .get();

            for (const doc of logsSnapshot.docs) {
                logs.push({ ...doc.data() as ShopifyWebhookLogEntry, partnerId });
            }
        } else {
            const mappingsSnapshot = await db.collection('shopifyStoreMappings').get();

            for (const mapping of mappingsSnapshot.docs) {
                const pid = mapping.data().partnerId;
                try {
                    const logsSnapshot = await db
                        .collection(`partners/${pid}/integrations/shopify/webhookLogs`)
                        .orderBy('receivedAt', 'desc')
                        .limit(10)
                        .get();

                    for (const doc of logsSnapshot.docs) {
                        logs.push({ ...doc.data() as ShopifyWebhookLogEntry, partnerId: pid });
                    }
                } catch {}
            }

            logs.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
            logs.splice(limit);
        }

        return { success: true, data: logs };
    } catch (error: any) {
        console.error('❌ Error getting webhook logs:', error);
        return { success: false, data: [] };
    }
}

export async function testShopifyConnection(
    partnerId: string
): Promise<{ success: boolean; message: string; shopInfo?: any; tokenValid: boolean }> {
    if (!db) {
        return { success: false, message: 'Database not available', tokenValid: false };
    }

    try {
        const configDoc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        if (!configDoc.exists) {
            return { success: false, message: 'Integration not found', tokenValid: false };
        }

        const config = configDoc.data() as ShopifyIntegrationConfig;
        const accessToken = decrypt(config.encryptedAccessToken);
        const { shop } = await getShopInfo(config.shopDomain, accessToken);

        return {
            success: true,
            message: 'Connection is healthy',
            shopInfo: shop,
            tokenValid: true,
        };
    } catch (error: any) {
        console.error('❌ Error testing Shopify connection:', error);
        return { success: false, message: error.message, tokenValid: false };
    }
}

export async function forceDisconnectShopify(
    partnerId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const configDoc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        let shopDomain: string | null = null;

        if (configDoc.exists) {
            const config = configDoc.data() as ShopifyIntegrationConfig;
            shopDomain = config.shopDomain;

            if (config.encryptedAccessToken && config.encryptedAccessToken !== '[REDACTED]') {
                try {
                    const accessToken = decrypt(config.encryptedAccessToken);
                    const { deleteWebhook } = await import('@/lib/shopify-service');
                    for (const [topic, webhookId] of Object.entries(config.webhookIds || {})) {
                        try {
                            await deleteWebhook(config.shopDomain, accessToken, webhookId);
                        } catch {}
                    }
                } catch {}
            }
        }

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .delete();

        if (shopDomain) {
            try {
                await db.collection('shopifyStoreMappings').doc(shopDomain).delete();
            } catch {}
        }

        const logsSnapshot = await db
            .collection(`partners/${partnerId}/integrations/shopify/webhookLogs`)
            .limit(500)
            .get();

        if (!logsSnapshot.empty) {
            const batch = db.batch();
            logsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        console.log(`🛍️ Force disconnected Shopify for partner: ${partnerId}`);
        return { success: true, message: 'Shopify force disconnected' };
    } catch (error: any) {
        console.error('❌ Error force disconnecting:', error);
        return { success: false, message: error.message };
    }
}

export async function getShopifyAdminStats(): Promise<{
    success: boolean;
    connectedPartners: number;
    totalProducts: number;
    totalCustomers: number;
    totalOrders: number;
    activeWebhooks: number;
    errorsLast24h: number;
}> {
    if (!db) {
        return {
            success: false,
            connectedPartners: 0,
            totalProducts: 0,
            totalCustomers: 0,
            totalOrders: 0,
            activeWebhooks: 0,
            errorsLast24h: 0,
        };
    }

    try {
        const mappingsSnapshot = await db.collection('shopifyStoreMappings').get();
        let connectedPartners = 0;
        let totalProducts = 0;
        let totalCustomers = 0;
        let totalOrders = 0;
        let activeWebhooks = 0;
        let errorsLast24h = 0;

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        for (const mapping of mappingsSnapshot.docs) {
            const pid = mapping.data().partnerId;
            try {
                const configDoc = await db
                    .collection(`partners/${pid}/integrations`)
                    .doc('shopify')
                    .get();

                if (configDoc.exists) {
                    const config = configDoc.data() as ShopifyIntegrationConfig;
                    if (config.status === 'connected' || config.status === 'syncing') {
                        connectedPartners++;
                    }

                    totalProducts += config.syncConfig?.products?.itemsSynced || 0;
                    totalCustomers += config.syncConfig?.customers?.itemsSynced || 0;
                    totalOrders += config.syncConfig?.orders?.itemsSynced || 0;
                    activeWebhooks += Object.keys(config.webhookIds || {}).length;

                    const errorLogs = await db
                        .collection(`partners/${pid}/integrations/shopify/webhookLogs`)
                        .where('status', '==', 'error')
                        .where('receivedAt', '>=', oneDayAgo)
                        .get();
                    errorsLast24h += errorLogs.size;
                }
            } catch {}
        }

        return {
            success: true,
            connectedPartners,
            totalProducts,
            totalCustomers,
            totalOrders,
            activeWebhooks,
            errorsLast24h,
        };
    } catch (error: any) {
        console.error('❌ Error getting admin stats:', error);
        return {
            success: false,
            connectedPartners: 0,
            totalProducts: 0,
            totalCustomers: 0,
            totalOrders: 0,
            activeWebhooks: 0,
            errorsLast24h: 0,
        };
    }
}
