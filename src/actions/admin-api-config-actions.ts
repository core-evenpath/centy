'use server';

/**
 * Admin API Integration Config
 *
 * Platform-level toggles for which third-party API integrations are
 * exposed to partners as "Fetch from an API" data-source options inside
 * Content Studio. Stored as a single doc at
 *
 *   platformConfig/apiIntegrations
 *
 * with a `configs` map field keyed by integration id.
 */

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import type { ApiIntegrationConfig } from '@/lib/types-content-studio';

type SeedConfig = Omit<ApiIntegrationConfig, 'updatedAt' | 'updatedBy'>;

const SEED_INTEGRATIONS: SeedConfig[] = [
    {
        id: 'shopify',
        name: 'Shopify',
        description: 'Sync products, orders, and inventory from Shopify stores',
        enabled: false,
        category: 'ecommerce',
        applicableVerticals: ['ecommerce', 'retail_commerce'],
        requiredFields: ['shopDomain', 'accessToken'],
        iconName: 'ShoppingBag',
    },
    {
        id: 'woocommerce',
        name: 'WooCommerce',
        description: 'Connect WordPress/WooCommerce product catalog and orders',
        enabled: false,
        category: 'ecommerce',
        applicableVerticals: ['ecommerce', 'retail_commerce'],
        requiredFields: ['siteUrl', 'consumerKey', 'consumerSecret'],
        iconName: 'ShoppingCart',
    },
    {
        id: 'stripe',
        name: 'Stripe',
        description: 'Accept payments and manage subscriptions',
        enabled: false,
        category: 'payment',
        applicableVerticals: 'all',
        requiredFields: ['publishableKey', 'secretKey'],
        iconName: 'CreditCard',
    },
    {
        id: 'razorpay',
        name: 'Razorpay',
        description: 'Accept payments via UPI, cards, and net banking',
        enabled: false,
        category: 'payment',
        applicableVerticals: 'all',
        requiredFields: ['keyId', 'keySecret'],
        iconName: 'CreditCard',
    },
    {
        id: 'google_calendar',
        name: 'Google Calendar',
        description: 'Sync appointment slots and bookings',
        enabled: false,
        category: 'calendar',
        applicableVerticals: 'all',
        requiredFields: ['calendarId'],
        iconName: 'Calendar',
    },
    {
        id: 'cal_com',
        name: 'Cal.com',
        description: 'Open-source scheduling and appointment booking',
        enabled: false,
        category: 'calendar',
        applicableVerticals: 'all',
        requiredFields: ['apiKey'],
        iconName: 'Calendar',
    },
    {
        id: 'custom_rest',
        name: 'Custom REST API',
        description: 'Connect any REST endpoint with authentication',
        enabled: false,
        category: 'custom',
        applicableVerticals: 'all',
        requiredFields: ['endpointUrl'],
        iconName: 'Plug',
    },
];

const CONFIG_PATH = { collection: 'platformConfig', doc: 'apiIntegrations' };

function buildSeeded(userId: string): Record<string, ApiIntegrationConfig> {
    const now = new Date().toISOString();
    const map: Record<string, ApiIntegrationConfig> = {};
    for (const seed of SEED_INTEGRATIONS) {
        map[seed.id] = { ...seed, updatedAt: now, updatedBy: userId };
    }
    return map;
}

export async function getApiIntegrationsAction(): Promise<{
    success: boolean;
    configs?: ApiIntegrationConfig[];
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const doc = await adminDb
            .collection(CONFIG_PATH.collection)
            .doc(CONFIG_PATH.doc)
            .get();

        if (!doc.exists) {
            // Return unpersisted seed so the admin UI has something to render
            // before the operator hits "Seed defaults".
            const seeded = buildSeeded('system');
            return { success: true, configs: Object.values(seeded) };
        }

        const data = doc.data() || {};
        const configs = (data.configs || {}) as Record<string, ApiIntegrationConfig>;
        return { success: true, configs: Object.values(configs) };
    } catch (error: any) {
        console.error('[api-config] get failed:', error);
        return { success: false, error: error?.message || 'Failed to load integrations' };
    }
}

export async function toggleApiIntegrationAction(
    integrationId: string,
    enabled: boolean,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const ref = adminDb
            .collection(CONFIG_PATH.collection)
            .doc(CONFIG_PATH.doc);

        const snap = await ref.get();
        const now = new Date().toISOString();

        if (!snap.exists) {
            // Persist the seed first so subsequent toggles have a base doc.
            const seeded = buildSeeded(userId);
            const target = seeded[integrationId];
            if (!target) {
                return { success: false, error: `Unknown integration: ${integrationId}` };
            }
            seeded[integrationId] = { ...target, enabled, updatedAt: now, updatedBy: userId };
            await ref.set({ configs: seeded });
        } else {
            const existing = (snap.data()?.configs || {}) as Record<string, ApiIntegrationConfig>;
            const current = existing[integrationId];
            if (!current) {
                // Add from seed if the doc exists but lacks this integration.
                const seed = SEED_INTEGRATIONS.find(s => s.id === integrationId);
                if (!seed) return { success: false, error: `Unknown integration: ${integrationId}` };
                existing[integrationId] = { ...seed, enabled, updatedAt: now, updatedBy: userId };
            } else {
                existing[integrationId] = { ...current, enabled, updatedAt: now, updatedBy: userId };
            }
            await ref.set({ configs: existing }, { merge: true });
        }

        revalidatePath('/admin/relay/api-config');
        revalidatePath('/partner/relay/datamap');
        return { success: true };
    } catch (error: any) {
        console.error('[api-config] toggle failed:', error);
        return { success: false, error: error?.message || 'Failed to toggle integration' };
    }
}

export async function seedApiIntegrationsAction(
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const ref = adminDb
            .collection(CONFIG_PATH.collection)
            .doc(CONFIG_PATH.doc);

        const snap = await ref.get();
        const existing = snap.exists
            ? ((snap.data()?.configs || {}) as Record<string, ApiIntegrationConfig>)
            : {};

        const now = new Date().toISOString();
        const merged: Record<string, ApiIntegrationConfig> = { ...existing };
        for (const seed of SEED_INTEGRATIONS) {
            if (!merged[seed.id]) {
                merged[seed.id] = { ...seed, updatedAt: now, updatedBy: userId };
            }
        }

        await ref.set({ configs: merged });
        revalidatePath('/admin/relay/api-config');
        return { success: true };
    } catch (error: any) {
        console.error('[api-config] seed failed:', error);
        return { success: false, error: error?.message || 'Failed to seed integrations' };
    }
}
