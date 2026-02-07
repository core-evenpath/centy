'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { encrypt, decrypt, generateSecureToken } from '@/lib/encryption';
import {
    getShopInfo,
    fetchAllProducts,
    fetchAllCustomers,
    fetchAllOrders,
    fetchProductCount,
    fetchCustomerCount,
    fetchOrderCount,
    registerWebhook,
    deleteWebhook as deleteShopifyWebhook,
    buildAuthUrl,
    exchangeCodeForToken,
    stripHtml,
} from '@/lib/shopify-service';
import type {
    ShopifyIntegrationConfig,
    ShopifyProduct,
    ShopifyCustomer,
    ShopifyOrder,
    ShopifyContactRecord,
    ShopifyOrderActivity,
    ShopifyWebhookPayload,
} from '@/lib/types-shopify';
import type { ModuleItem } from '@/lib/modules/types';

const SHOPIFY_SCOPES = [
    'read_products',
    'read_product_listings',
    'read_inventory',
    'read_customers',
    'read_orders',
    'read_locales',
    'read_shipping',
];

const WEBHOOK_TOPICS = [
    'products/create',
    'products/update',
    'products/delete',
    'customers/create',
    'customers/update',
    'customers/delete',
    'orders/create',
    'orders/updated',
    'orders/cancelled',
    'app/uninstalled',
];

function getShopifyApiKey(): string {
    const key = process.env.SHOPIFY_API_KEY;
    if (!key) throw new Error('Shopify integration is not configured. Please contact your administrator.');
    return key;
}

function getShopifyApiSecret(): string {
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) throw new Error('Shopify integration is not configured. Please contact your administrator.');
    return secret;
}

function getCallbackUrl(): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pingbox.io';
    return `${appUrl}/api/auth/shopify/callback`;
}

function getWebhookCallbackUrl(): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pingbox.io';
    return `${appUrl}/api/webhooks/shopify`;
}

function validateShopDomain(domain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(domain);
}

function mapShopifyProductToModuleItem(
    product: ShopifyProduct,
    partnerId: string,
    moduleId: string,
    defaultCurrency: string
): Partial<ModuleItem> & { _source: string; _externalId: string; _externalVariantId?: string; _lastSyncedAt: string; _syncLocked: boolean } {
    const primaryVariant = product.variants[0];
    return {
        name: product.title,
        description: stripHtml(product.body_html || ''),
        category: product.product_type || 'general',
        price: parseFloat(primaryVariant?.price || '0'),
        compareAtPrice: primaryVariant?.compare_at_price ? parseFloat(primaryVariant.compare_at_price) : undefined,
        currency: defaultCurrency,
        images: product.images.map(img => img.src),
        thumbnail: product.images[0]?.src,
        fields: {
            vendor: product.vendor,
            productType: product.product_type,
            tags: product.tags,
            sku: primaryVariant?.sku || '',
            weight: primaryVariant?.weight,
            weightUnit: primaryVariant?.weight_unit,
            shopifyHandle: product.handle,
            shopifyStatus: product.status,
        },
        variants: product.variants.map(v => ({
            id: `shopify_${v.id}`,
            name: v.title,
            sku: v.sku || undefined,
            price: parseFloat(v.price),
            stock: v.inventory_quantity,
            attributes: {},
        })),
        stock: primaryVariant?.inventory_quantity,
        trackInventory: true,
        isActive: product.status === 'active',
        isFeatured: false,
        _source: 'shopify',
        _externalId: String(product.id),
        _externalVariantId: primaryVariant ? String(primaryVariant.id) : undefined,
        _lastSyncedAt: new Date().toISOString(),
        _syncLocked: false,
    };
}

function mapShopifyCustomerToContact(customer: ShopifyCustomer): ShopifyContactRecord {
    return {
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        addresses: customer.addresses,
        tags: customer.tags ? customer.tags.split(',').map(t => t.trim()) : [],
        notes: customer.note || '',
        totalSpent: customer.total_spent,
        ordersCount: customer.orders_count,
        source: 'shopify',
        externalId: String(customer.id),
        lastSyncedAt: new Date().toISOString(),
        isActive: customer.state !== 'disabled',
        createdAt: customer.created_at,
        updatedAt: new Date().toISOString(),
    };
}

function mapShopifyOrderToActivity(order: ShopifyOrder): ShopifyOrderActivity {
    return {
        type: 'shopify_order',
        externalId: String(order.id),
        orderNumber: order.order_number,
        totalPrice: order.total_price,
        currency: order.currency,
        financialStatus: order.financial_status,
        fulfillmentStatus: order.fulfillment_status,
        lineItems: order.line_items.map(li => ({
            name: li.name,
            quantity: li.quantity,
            price: li.price,
        })),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        cancelledAt: order.cancelled_at || undefined,
    };
}

export async function initiateShopifyOAuth(
    partnerId: string,
    shopDomain: string
): Promise<{ success: boolean; message: string; authUrl?: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const normalizedDomain = shopDomain.trim().toLowerCase();
        if (!validateShopDomain(normalizedDomain)) {
            return {
                success: false,
                message: 'Invalid shop domain. Please enter a valid myshopify.com URL (e.g., mystore.myshopify.com)',
            };
        }

        const apiKey = getShopifyApiKey();
        const state = generateSecureToken(32);

        await db.collection('shopifyOAuthStates').doc(state).set({
            partnerId,
            shopDomain: normalizedDomain,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

        const authUrl = buildAuthUrl(
            normalizedDomain,
            apiKey,
            SHOPIFY_SCOPES,
            getCallbackUrl(),
            state
        );

        console.log(`🛍️ Shopify OAuth initiated for partner: ${partnerId}, shop: ${normalizedDomain}`);

        return { success: true, message: 'Redirecting to Shopify...', authUrl };
    } catch (error: any) {
        console.error('❌ Error initiating Shopify OAuth:', error);
        return { success: false, message: error.message };
    }
}

export async function completeShopifyOAuth(
    code: string,
    shopDomain: string,
    state: string
): Promise<{ success: boolean; message: string; partnerId?: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const stateRef = db.collection('shopifyOAuthStates').doc(state);
        const stateDoc = await stateRef.get();

        if (!stateDoc.exists) {
            return { success: false, message: 'Invalid or expired OAuth state' };
        }

        const stateData = stateDoc.data()!;
        if (new Date(stateData.expiresAt) < new Date()) {
            await stateRef.delete();
            return { success: false, message: 'OAuth state expired. Please try again.' };
        }

        if (stateData.shopDomain !== shopDomain) {
            return { success: false, message: 'Shop domain mismatch' };
        }

        const partnerId = stateData.partnerId;
        const apiKey = getShopifyApiKey();
        const apiSecret = getShopifyApiSecret();

        const { accessToken, scope } = await exchangeCodeForToken(
            shopDomain,
            code,
            apiKey,
            apiSecret
        );

        const encryptedAccessToken = encrypt(accessToken);
        const { shop } = await getShopInfo(shopDomain, accessToken);

        const webhookIds: Record<string, string> = {};
        const webhookCallbackUrl = getWebhookCallbackUrl();

        for (const topic of WEBHOOK_TOPICS) {
            try {
                const webhookId = await registerWebhook(shopDomain, accessToken, topic, webhookCallbackUrl);
                webhookIds[topic] = webhookId;
                console.log(`✅ Registered webhook: ${topic} -> ${webhookId}`);
            } catch (err: any) {
                console.error(`❌ Failed to register webhook ${topic}:`, err.message);
            }
        }

        const now = new Date().toISOString();
        const config: ShopifyIntegrationConfig = {
            status: 'connected',
            shopName: shop.name,
            shopDomain,
            encryptedAccessToken,
            scopes: scope.split(','),
            linkedModuleId: null,
            linkedModuleSlug: null,
            syncConfig: {
                products: { enabled: true, lastSyncAt: null, itemsSynced: 0, status: 'idle' },
                customers: { enabled: true, lastSyncAt: null, itemsSynced: 0, status: 'idle' },
                orders: { enabled: true, lastSyncAt: null, itemsSynced: 0, status: 'idle' },
            },
            syncDirection: 'pull',
            lastSyncAt: null,
            lastSyncStatus: null,
            webhookIds,
            installedAt: now,
            updatedAt: now,
        };

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .set(config);

        await db.collection('shopifyStoreMappings').doc(shopDomain).set({
            partnerId,
            shopDomain,
            shopName: shop.name,
            createdAt: now,
        });

        await stateRef.delete();

        console.log(`🛍️ Shopify connected for partner: ${partnerId}, shop: ${shop.name}`);

        revalidatePath('/partner/apps/shopify');
        return { success: true, message: 'Shopify connected successfully!', partnerId };
    } catch (error: any) {
        console.error('❌ Error completing Shopify OAuth:', error);
        return { success: false, message: error.message };
    }
}

export async function getShopifyConfig(
    partnerId: string
): Promise<{ success: boolean; config: ShopifyIntegrationConfig | null; message?: string }> {
    if (!db) {
        console.error('❌ getShopifyConfig: db is not available');
        return { success: false, config: null, message: 'Database not available' };
    }

    if (!partnerId) {
        return { success: false, config: null, message: 'Partner ID is required' };
    }

    try {
        const docRef = db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify');

        console.log(`🛍️ getShopifyConfig: Reading from partners/${partnerId}/integrations/shopify`);

        const doc = await docRef.get();

        if (!doc.exists) {
            console.log(`🛍️ getShopifyConfig: No Shopify config found for partner ${partnerId}`);
            return { success: true, config: null };
        }

        const config = doc.data() as ShopifyIntegrationConfig;
        console.log(`🛍️ getShopifyConfig: Found config with status=${config.status}, shop=${config.shopDomain}`);
        const safeConfig = { ...config, encryptedAccessToken: '[REDACTED]' };
        return { success: true, config: safeConfig };
    } catch (error: any) {
        console.error('❌ Error getting Shopify config:', error);
        return { success: false, config: null, message: error.message };
    }
}

export async function getShopifyCounts(
    partnerId: string
): Promise<{ success: boolean; products: number; customers: number; orders: number }> {
    if (!db) {
        return { success: false, products: 0, customers: 0, orders: 0 };
    }

    try {
        const doc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        if (!doc.exists) {
            return { success: false, products: 0, customers: 0, orders: 0 };
        }

        const config = doc.data() as ShopifyIntegrationConfig;
        const accessToken = decrypt(config.encryptedAccessToken);

        const [products, customers, orders] = await Promise.all([
            fetchProductCount(config.shopDomain, accessToken),
            fetchCustomerCount(config.shopDomain, accessToken),
            fetchOrderCount(config.shopDomain, accessToken),
        ]);

        return { success: true, products, customers, orders };
    } catch (error: any) {
        console.error('❌ Error getting Shopify counts:', error);
        return { success: false, products: 0, customers: 0, orders: 0 };
    }
}

export async function linkShopifyModule(
    partnerId: string,
    moduleId: string,
    moduleSlug: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                linkedModuleId: moduleId,
                linkedModuleSlug: moduleSlug,
                updatedAt: new Date().toISOString(),
            });

        revalidatePath('/partner/apps/shopify');
        return { success: true, message: 'Module linked successfully' };
    } catch (error: any) {
        console.error('❌ Error linking module:', error);
        return { success: false, message: error.message };
    }
}

export async function syncShopifyProducts(
    partnerId: string
): Promise<{ success: boolean; message: string; synced?: number; created?: number; updated?: number; deleted?: number }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const configDoc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        if (!configDoc.exists) {
            return { success: false, message: 'Shopify not connected' };
        }

        const config = configDoc.data() as ShopifyIntegrationConfig;
        if (!config.linkedModuleId) {
            return { success: false, message: 'No module linked. Please select a module first.' };
        }

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                'syncConfig.products.status': 'syncing',
                status: 'syncing',
                updatedAt: new Date().toISOString(),
            });

        const accessToken = decrypt(config.encryptedAccessToken);
        const products = await fetchAllProducts(config.shopDomain, accessToken);

        const moduleDoc = await db
            .collection(`partners/${partnerId}/businessModules`)
            .doc(config.linkedModuleId)
            .get();

        const defaultCurrency = moduleDoc.exists
            ? (moduleDoc.data()?.settings?.defaultCurrency || 'INR')
            : 'INR';

        const existingItemsSnapshot = await db
            .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
            .where('_source', '==', 'shopify')
            .get();

        const existingByExternalId = new Map<string, { id: string; data: any }>();
        existingItemsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data._externalId) {
                existingByExternalId.set(data._externalId, { id: doc.id, data });
            }
        });

        let created = 0;
        let updated = 0;
        let deleted = 0;
        const now = new Date().toISOString();
        const processedExternalIds = new Set<string>();

        for (const product of products) {
            const externalId = String(product.id);
            processedExternalIds.add(externalId);

            const itemData = mapShopifyProductToModuleItem(
                product,
                partnerId,
                config.linkedModuleId,
                defaultCurrency
            );

            const existing = existingByExternalId.get(externalId);

            if (existing) {
                await db
                    .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
                    .doc(existing.id)
                    .update({
                        ...itemData,
                        updatedAt: now,
                        updatedBy: 'shopify-sync',
                    });
                updated++;
            } else {
                const itemRef = db
                    .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
                    .doc();

                await itemRef.set({
                    ...itemData,
                    id: itemRef.id,
                    moduleId: config.linkedModuleId,
                    partnerId,
                    sortOrder: 0,
                    _schemaVersion: 1,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: 'shopify-sync',
                });
                created++;
            }
        }

        for (const [externalId, existing] of existingByExternalId) {
            if (!processedExternalIds.has(externalId)) {
                await db
                    .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
                    .doc(existing.id)
                    .update({
                        isActive: false,
                        updatedAt: now,
                        updatedBy: 'shopify-sync',
                    });
                deleted++;
            }
        }

        const totalSynced = created + updated;
        await db
            .collection(`partners/${partnerId}/businessModules`)
            .doc(config.linkedModuleId)
            .update({
                itemCount: FieldValue.increment(created),
                activeItemCount: FieldValue.increment(created - deleted),
                lastItemUpdatedAt: now,
            });

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                'syncConfig.products.status': 'success',
                'syncConfig.products.lastSyncAt': now,
                'syncConfig.products.itemsSynced': totalSynced,
                status: 'connected',
                updatedAt: now,
            });

        console.log(`🛍️ Product sync complete for ${partnerId}: ${created} created, ${updated} updated, ${deleted} deactivated`);

        revalidatePath('/partner/apps/shopify');
        revalidatePath(`/partner/modules/${config.linkedModuleSlug}`);
        return {
            success: true,
            message: `Synced ${totalSynced} products (${created} new, ${updated} updated, ${deleted} removed)`,
            synced: totalSynced,
            created,
            updated,
            deleted,
        };
    } catch (error: any) {
        console.error('❌ Error syncing products:', error);

        try {
            await db
                .collection(`partners/${partnerId}/integrations`)
                .doc('shopify')
                .update({
                    'syncConfig.products.status': 'error',
                    'syncConfig.products.error': error.message,
                    status: 'connected',
                    updatedAt: new Date().toISOString(),
                });
        } catch {}

        return { success: false, message: error.message };
    }
}

export async function syncShopifyCustomers(
    partnerId: string
): Promise<{ success: boolean; message: string; synced?: number; created?: number; updated?: number }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const configDoc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        if (!configDoc.exists) {
            return { success: false, message: 'Shopify not connected' };
        }

        const config = configDoc.data() as ShopifyIntegrationConfig;

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                'syncConfig.customers.status': 'syncing',
                updatedAt: new Date().toISOString(),
            });

        const accessToken = decrypt(config.encryptedAccessToken);
        const customers = await fetchAllCustomers(config.shopDomain, accessToken);

        let created = 0;
        let updated = 0;
        const now = new Date().toISOString();

        for (const customer of customers) {
            const contactData = mapShopifyCustomerToContact(customer);
            const externalId = String(customer.id);

            let existingContactId: string | null = null;

            const externalIdQuery = await db
                .collection(`partners/${partnerId}/contacts`)
                .where('externalId', '==', externalId)
                .where('source', '==', 'shopify')
                .limit(1)
                .get();

            if (!externalIdQuery.empty) {
                existingContactId = externalIdQuery.docs[0].id;
            }

            if (!existingContactId && customer.phone) {
                const phoneQuery = await db
                    .collection(`partners/${partnerId}/contacts`)
                    .where('phone', '==', customer.phone)
                    .limit(1)
                    .get();

                if (!phoneQuery.empty) {
                    existingContactId = phoneQuery.docs[0].id;
                }
            }

            if (!existingContactId && customer.email) {
                const emailQuery = await db
                    .collection(`partners/${partnerId}/contacts`)
                    .where('email', '==', customer.email)
                    .limit(1)
                    .get();

                if (!emailQuery.empty) {
                    existingContactId = emailQuery.docs[0].id;
                }
            }

            if (existingContactId) {
                const existingDoc = await db
                    .collection(`partners/${partnerId}/contacts`)
                    .doc(existingContactId)
                    .get();
                const existingData = existingDoc.data() || {};

                const mergedData: Record<string, any> = {
                    ...contactData,
                    name: existingData.name || contactData.name,
                    updatedAt: now,
                };

                if (existingData.source !== 'shopify') {
                    mergedData.source = existingData.source;
                    mergedData.externalId = externalId;
                    mergedData.shopifyExternalId = externalId;
                }

                await db
                    .collection(`partners/${partnerId}/contacts`)
                    .doc(existingContactId)
                    .update(mergedData);
                updated++;
            } else {
                const contactRef = db.collection(`partners/${partnerId}/contacts`).doc();
                await contactRef.set({
                    ...contactData,
                    id: contactRef.id,
                    partnerId,
                    createdAt: now,
                    updatedAt: now,
                });
                created++;
            }
        }

        const totalSynced = created + updated;

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                'syncConfig.customers.status': 'success',
                'syncConfig.customers.lastSyncAt': now,
                'syncConfig.customers.itemsSynced': totalSynced,
                updatedAt: now,
            });

        console.log(`👥 Customer sync complete for ${partnerId}: ${created} created, ${updated} updated`);

        revalidatePath('/partner/apps/shopify');
        return {
            success: true,
            message: `Synced ${totalSynced} customers (${created} new, ${updated} updated)`,
            synced: totalSynced,
            created,
            updated,
        };
    } catch (error: any) {
        console.error('❌ Error syncing customers:', error);

        try {
            await db
                .collection(`partners/${partnerId}/integrations`)
                .doc('shopify')
                .update({
                    'syncConfig.customers.status': 'error',
                    'syncConfig.customers.error': error.message,
                    updatedAt: new Date().toISOString(),
                });
        } catch {}

        return { success: false, message: error.message };
    }
}

export async function syncShopifyOrders(
    partnerId: string
): Promise<{ success: boolean; message: string; synced?: number }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const configDoc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        if (!configDoc.exists) {
            return { success: false, message: 'Shopify not connected' };
        }

        const config = configDoc.data() as ShopifyIntegrationConfig;

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                'syncConfig.orders.status': 'syncing',
                updatedAt: new Date().toISOString(),
            });

        const accessToken = decrypt(config.encryptedAccessToken);
        const orders = await fetchAllOrders(config.shopDomain, accessToken);

        let synced = 0;
        const now = new Date().toISOString();

        for (const order of orders) {
            const activity = mapShopifyOrderToActivity(order);

            let contactId: string | null = null;

            if (order.customer) {
                const customerExternalId = String(order.customer.id);
                const contactQuery = await db
                    .collection(`partners/${partnerId}/contacts`)
                    .where('externalId', '==', customerExternalId)
                    .where('source', '==', 'shopify')
                    .limit(1)
                    .get();

                if (!contactQuery.empty) {
                    contactId = contactQuery.docs[0].id;
                }
            }

            if (!contactId && order.email) {
                const emailQuery = await db
                    .collection(`partners/${partnerId}/contacts`)
                    .where('email', '==', order.email)
                    .limit(1)
                    .get();

                if (!emailQuery.empty) {
                    contactId = emailQuery.docs[0].id;
                }
            }

            if (!contactId && order.customer) {
                const contactRef = db.collection(`partners/${partnerId}/contacts`).doc();
                const customerData = mapShopifyCustomerToContact(order.customer);
                await contactRef.set({
                    ...customerData,
                    id: contactRef.id,
                    partnerId,
                    createdAt: now,
                    updatedAt: now,
                });
                contactId = contactRef.id;
            }

            if (!contactId) continue;

            const existingActivity = await db
                .collection(`partners/${partnerId}/contacts/${contactId}/activity`)
                .where('externalId', '==', activity.externalId)
                .where('type', '==', 'shopify_order')
                .limit(1)
                .get();

            if (!existingActivity.empty) {
                await existingActivity.docs[0].ref.update({
                    ...activity,
                    updatedAt: now,
                });
            } else {
                const activityRef = db
                    .collection(`partners/${partnerId}/contacts/${contactId}/activity`)
                    .doc();
                await activityRef.set({
                    ...activity,
                    id: activityRef.id,
                    contactId,
                    partnerId,
                });
            }

            synced++;
        }

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update({
                'syncConfig.orders.status': 'success',
                'syncConfig.orders.lastSyncAt': now,
                'syncConfig.orders.itemsSynced': synced,
                lastSyncAt: now,
                lastSyncStatus: 'success',
                updatedAt: now,
            });

        console.log(`📋 Order sync complete for ${partnerId}: ${synced} orders`);

        revalidatePath('/partner/apps/shopify');
        return { success: true, message: `Synced ${synced} orders`, synced };
    } catch (error: any) {
        console.error('❌ Error syncing orders:', error);

        try {
            await db
                .collection(`partners/${partnerId}/integrations`)
                .doc('shopify')
                .update({
                    'syncConfig.orders.status': 'error',
                    'syncConfig.orders.error': error.message,
                    updatedAt: new Date().toISOString(),
                });
        } catch {}

        return { success: false, message: error.message };
    }
}

export async function disconnectShopify(
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

        if (!configDoc.exists) {
            return { success: false, message: 'Shopify not connected' };
        }

        const config = configDoc.data() as ShopifyIntegrationConfig;

        if (config.encryptedAccessToken && config.encryptedAccessToken !== '[REDACTED]') {
            try {
                const accessToken = decrypt(config.encryptedAccessToken);
                for (const [topic, webhookId] of Object.entries(config.webhookIds)) {
                    try {
                        await deleteShopifyWebhook(config.shopDomain, accessToken, webhookId);
                        console.log(`✅ Deleted webhook: ${topic}`);
                    } catch (err: any) {
                        console.warn(`⚠️ Could not delete webhook ${topic}:`, err.message);
                    }
                }
            } catch (err) {
                console.warn('⚠️ Could not decrypt token for webhook cleanup:', err);
            }
        }

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .delete();

        if (config.shopDomain) {
            try {
                await db.collection('shopifyStoreMappings').doc(config.shopDomain).delete();
            } catch {}
        }

        console.log(`🛍️ Shopify disconnected for partner: ${partnerId}`);

        revalidatePath('/partner/apps/shopify');
        return { success: true, message: 'Shopify disconnected successfully. Your synced data has been kept.' };
    } catch (error: any) {
        console.error('❌ Error disconnecting Shopify:', error);
        return { success: false, message: error.message };
    }
}

export async function updateShopifySyncSettings(
    partnerId: string,
    settings: { products?: boolean; customers?: boolean; orders?: boolean }
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    try {
        const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

        if (settings.products !== undefined) {
            updates['syncConfig.products.enabled'] = settings.products;
        }
        if (settings.customers !== undefined) {
            updates['syncConfig.customers.enabled'] = settings.customers;
        }
        if (settings.orders !== undefined) {
            updates['syncConfig.orders.enabled'] = settings.orders;
        }

        await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .update(updates);

        revalidatePath('/partner/apps/shopify');
        return { success: true, message: 'Sync settings updated' };
    } catch (error: any) {
        console.error('❌ Error updating sync settings:', error);
        return { success: false, message: error.message };
    }
}

export async function handleShopifyWebhook(
    topic: string,
    shopDomain: string,
    payload: ShopifyWebhookPayload
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database not available' };
    }

    const startTime = Date.now();

    try {
        const mappingDoc = await db.collection('shopifyStoreMappings').doc(shopDomain).get();
        if (!mappingDoc.exists) {
            return { success: false, message: `No partner found for shop: ${shopDomain}` };
        }

        const partnerId = mappingDoc.data()!.partnerId;

        const configDoc = await db
            .collection(`partners/${partnerId}/integrations`)
            .doc('shopify')
            .get();

        if (!configDoc.exists) {
            return { success: false, message: 'Shopify integration not found for partner' };
        }

        const config = configDoc.data() as ShopifyIntegrationConfig;
        let result: { success: boolean; message: string } = { success: true, message: 'OK' };

        if (topic === 'app/uninstalled') {
            await db
                .collection(`partners/${partnerId}/integrations`)
                .doc('shopify')
                .update({
                    status: 'disconnected',
                    error: 'App was uninstalled from Shopify',
                    updatedAt: new Date().toISOString(),
                });

            try {
                await db.collection('shopifyStoreMappings').doc(shopDomain).delete();
            } catch {}

            result = { success: true, message: 'App uninstalled, integration disconnected' };
        } else if (topic.startsWith('products/')) {
            result = await handleProductWebhook(topic, partnerId, config, payload);
        } else if (topic.startsWith('customers/')) {
            result = await handleCustomerWebhook(topic, partnerId, payload);
        } else if (topic.startsWith('orders/')) {
            result = await handleOrderWebhook(topic, partnerId, payload);
        }

        const processingTimeMs = Date.now() - startTime;
        try {
            const logRef = db
                .collection(`partners/${partnerId}/integrations/shopify/webhookLogs`)
                .doc();
            await logRef.set({
                topic,
                receivedAt: new Date().toISOString(),
                status: result.success ? 'success' : 'error',
                payload: { id: payload.id, topic },
                error: result.success ? undefined : result.message,
                processingTimeMs,
            });
        } catch {}

        return result;
    } catch (error: any) {
        console.error(`❌ Error handling webhook ${topic}:`, error);
        return { success: false, message: error.message };
    }
}

async function handleProductWebhook(
    topic: string,
    partnerId: string,
    config: ShopifyIntegrationConfig,
    payload: ShopifyWebhookPayload
): Promise<{ success: boolean; message: string }> {
    if (!config.linkedModuleId || !config.syncConfig.products.enabled) {
        return { success: true, message: 'Product sync disabled or no module linked' };
    }

    const moduleDoc = await db!
        .collection(`partners/${partnerId}/businessModules`)
        .doc(config.linkedModuleId)
        .get();

    const defaultCurrency = moduleDoc.exists
        ? (moduleDoc.data()?.settings?.defaultCurrency || 'INR')
        : 'INR';

    const externalId = String(payload.id);
    const now = new Date().toISOString();

    if (topic === 'products/delete') {
        const existingQuery = await db!
            .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
            .where('_externalId', '==', externalId)
            .where('_source', '==', 'shopify')
            .limit(1)
            .get();

        if (!existingQuery.empty) {
            await existingQuery.docs[0].ref.update({
                isActive: false,
                updatedAt: now,
                updatedBy: 'shopify-webhook',
            });
        }

        return { success: true, message: 'Product deactivated' };
    }

    const product = payload as unknown as ShopifyProduct;
    const itemData = mapShopifyProductToModuleItem(product, partnerId, config.linkedModuleId, defaultCurrency);

    const existingQuery = await db!
        .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
        .where('_externalId', '==', externalId)
        .where('_source', '==', 'shopify')
        .limit(1)
        .get();

    if (!existingQuery.empty) {
        await existingQuery.docs[0].ref.update({
            ...itemData,
            updatedAt: now,
            updatedBy: 'shopify-webhook',
        });
        return { success: true, message: 'Product updated' };
    }

    if (topic === 'products/create') {
        const itemRef = db!
            .collection(`partners/${partnerId}/businessModules/${config.linkedModuleId}/items`)
            .doc();

        await itemRef.set({
            ...itemData,
            id: itemRef.id,
            moduleId: config.linkedModuleId,
            partnerId,
            sortOrder: 0,
            _schemaVersion: 1,
            createdAt: now,
            updatedAt: now,
            createdBy: 'shopify-webhook',
        });

        await db!
            .collection(`partners/${partnerId}/businessModules`)
            .doc(config.linkedModuleId)
            .update({
                itemCount: FieldValue.increment(1),
                activeItemCount: product.status === 'active' ? FieldValue.increment(1) : FieldValue.increment(0),
                lastItemAddedAt: now,
            });

        return { success: true, message: 'Product created' };
    }

    return { success: true, message: 'No action taken' };
}

async function handleCustomerWebhook(
    topic: string,
    partnerId: string,
    payload: ShopifyWebhookPayload
): Promise<{ success: boolean; message: string }> {
    const externalId = String(payload.id);
    const now = new Date().toISOString();

    if (topic === 'customers/delete') {
        const existingQuery = await db!
            .collection(`partners/${partnerId}/contacts`)
            .where('externalId', '==', externalId)
            .where('source', '==', 'shopify')
            .limit(1)
            .get();

        if (!existingQuery.empty) {
            await existingQuery.docs[0].ref.update({
                isActive: false,
                updatedAt: now,
            });
        }

        return { success: true, message: 'Customer deactivated' };
    }

    const customer = payload as unknown as ShopifyCustomer;
    const contactData = mapShopifyCustomerToContact(customer);

    const existingQuery = await db!
        .collection(`partners/${partnerId}/contacts`)
        .where('externalId', '==', externalId)
        .where('source', '==', 'shopify')
        .limit(1)
        .get();

    if (!existingQuery.empty) {
        await existingQuery.docs[0].ref.update({
            ...contactData,
            updatedAt: now,
        });
        return { success: true, message: 'Customer updated' };
    }

    if (topic === 'customers/create') {
        const contactRef = db!.collection(`partners/${partnerId}/contacts`).doc();
        await contactRef.set({
            ...contactData,
            id: contactRef.id,
            partnerId,
            createdAt: now,
            updatedAt: now,
        });
        return { success: true, message: 'Customer created' };
    }

    return { success: true, message: 'No action taken' };
}

async function handleOrderWebhook(
    topic: string,
    partnerId: string,
    payload: ShopifyWebhookPayload
): Promise<{ success: boolean; message: string }> {
    const order = payload as unknown as ShopifyOrder;
    const activity = mapShopifyOrderToActivity(order);
    const now = new Date().toISOString();

    let contactId: string | null = null;

    if (order.customer) {
        const customerExternalId = String(order.customer.id);
        const contactQuery = await db!
            .collection(`partners/${partnerId}/contacts`)
            .where('externalId', '==', customerExternalId)
            .where('source', '==', 'shopify')
            .limit(1)
            .get();

        if (!contactQuery.empty) {
            contactId = contactQuery.docs[0].id;
        }
    }

    if (!contactId && order.email) {
        const emailQuery = await db!
            .collection(`partners/${partnerId}/contacts`)
            .where('email', '==', order.email)
            .limit(1)
            .get();

        if (!emailQuery.empty) {
            contactId = emailQuery.docs[0].id;
        }
    }

    if (!contactId && order.customer) {
        const contactRef = db!.collection(`partners/${partnerId}/contacts`).doc();
        const customerData = mapShopifyCustomerToContact(order.customer);
        await contactRef.set({
            ...customerData,
            id: contactRef.id,
            partnerId,
            createdAt: now,
            updatedAt: now,
        });
        contactId = contactRef.id;
    }

    if (!contactId) {
        return { success: true, message: 'No contact found for order' };
    }

    const existingActivity = await db!
        .collection(`partners/${partnerId}/contacts/${contactId}/activity`)
        .where('externalId', '==', activity.externalId)
        .where('type', '==', 'shopify_order')
        .limit(1)
        .get();

    if (!existingActivity.empty) {
        await existingActivity.docs[0].ref.update({
            ...activity,
            updatedAt: now,
        });
    } else {
        const activityRef = db!
            .collection(`partners/${partnerId}/contacts/${contactId}/activity`)
            .doc();
        await activityRef.set({
            ...activity,
            id: activityRef.id,
            contactId,
            partnerId,
        });
    }

    return { success: true, message: `Order ${topic} processed` };
}
