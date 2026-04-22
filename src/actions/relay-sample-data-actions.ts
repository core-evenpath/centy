'use server';

// ── Relay sample-data helpers ────────────────────────────────────────
//
// Makes it dead-simple for a partner to get from "empty state" to "real
// preview data" without hand-typing items or running a CSV import:
//
//   seedSampleItemsAction(partnerId, moduleSlug, userId)
//     - ensures the partner has the module enabled (enables if not)
//     - bulk-inserts a hand-picked demo set tailored to the module slug
//
//   quickStartTaxonomyDataAction(partnerId, functionId, userId)
//     - looks up the data-guide for the partner's taxonomy
//     - for every required section with a moduleSlug, calls
//       seedSampleItemsAction so the whole bento lights up at once
//
// Keeps the sample sets inline (no Firestore seed docs) so adding more
// taxonomies is a pure-code change reviewed in the PR.

import {
    enablePartnerModuleAction,
    getPartnerModuleAction,
    bulkCreateModuleItemsAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import type { ModuleItem } from '@/lib/modules/types';
import { getDataGuideForFunction } from '@/lib/relay/block-data-guide';

type SampleItem = Partial<ModuleItem>;

// Sample item sets per module slug. Pick demo data that exercises the
// matching block previews — prices, categories, a few optional fields —
// so the Test Chat renders something believable out of the box.
const SAMPLE_ITEMS_BY_SLUG: Record<string, SampleItem[]> = {
    food_menu: [
        {
            name: 'Cappuccino',
            description: 'Double-shot espresso with silky steamed milk and a thin layer of foam.',
            category: 'Coffee',
            price: 4.5,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, serving_size: 'Medium (8oz)', calories: 120, is_popular: true },
        },
        {
            name: 'Iced Latte',
            description: 'Cold espresso poured over milk and ice. Refreshing.',
            category: 'Coffee',
            price: 5.0,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, serving_size: 'Large (12oz)', calories: 180 },
        },
        {
            name: 'Masala Chai',
            description: 'House-spiced black tea with cardamom, ginger, and cinnamon.',
            category: 'Tea',
            price: 4.0,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, serving_size: 'Medium (8oz)', spice_level: 'mild' },
        },
        {
            name: 'Matcha Latte',
            description: 'Ceremonial-grade matcha whisked with steamed oat milk.',
            category: 'Tea',
            price: 5.5,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, is_vegan: true, serving_size: 'Medium (8oz)', calories: 150 },
        },
        {
            name: 'Fresh Orange Juice',
            description: 'Hand-pressed this morning. No added sugar.',
            category: 'Juice',
            price: 6.0,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, is_vegan: true, serving_size: 'Large (12oz)', calories: 165 },
        },
        {
            name: 'Green Detox Juice',
            description: 'Cucumber, celery, apple, spinach, and lemon.',
            category: 'Juice',
            price: 7.0,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, is_vegan: true, serving_size: 'Medium (10oz)', calories: 95, is_popular: true },
        },
        {
            name: 'Butter Croissant',
            description: 'Flaky, all-butter croissant baked each morning.',
            category: 'Pastries',
            price: 3.75,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, serving_size: '1 piece', calories: 272, allergens: 'gluten, dairy' },
        },
        {
            name: 'Avocado Toast',
            description: 'Smashed avocado on sourdough with chili flakes and lemon.',
            category: 'Food',
            price: 9.5,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, is_vegan: true, serving_size: '1 plate', calories: 320, allergens: 'gluten' },
        },
        {
            name: 'Blueberry Muffin',
            description: 'House-baked muffin studded with wild blueberries.',
            category: 'Pastries',
            price: 3.5,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, serving_size: '1 piece', calories: 310, allergens: 'gluten, dairy, egg' },
        },
        {
            name: 'Cold Brew',
            description: '18-hour slow-steeped cold brew. Smooth and low acidity.',
            category: 'Coffee',
            price: 5.25,
            currency: 'USD',
            isActive: true,
            fields: { is_veg: true, is_vegan: true, serving_size: 'Large (16oz)', calories: 5, is_popular: true },
        },
    ],
    product_catalog: [
        { name: 'Sample Product A', description: 'Demo product for previewing product cards.', category: 'General', price: 19.99, currency: 'USD', isActive: true },
        { name: 'Sample Product B', description: 'Demo product for previewing product cards.', category: 'General', price: 29.99, currency: 'USD', isActive: true },
        { name: 'Sample Product C', description: 'Demo product for previewing product cards.', category: 'General', price: 39.99, currency: 'USD', isActive: true },
    ],
    service_catalog: [
        { name: 'Consultation (30 min)', description: 'Intro call to scope your needs.', category: 'Consulting', price: 50, currency: 'USD', isActive: true },
        { name: 'Standard Session (60 min)', description: 'One-hour working session.', category: 'Consulting', price: 120, currency: 'USD', isActive: true },
        { name: 'Deep Dive (90 min)', description: 'Extended session with follow-up notes.', category: 'Consulting', price: 180, currency: 'USD', isActive: true },
    ],
};

export async function seedSampleItemsAction(
    partnerId: string,
    moduleSlug: string,
    userId: string,
    options?: { skipIfItemsExist?: boolean },
): Promise<{
    success: boolean;
    created?: number;
    enabled?: boolean;
    error?: string;
}> {
    try {
        const items = SAMPLE_ITEMS_BY_SLUG[moduleSlug];
        if (!items || items.length === 0) {
            return { success: false, error: `No sample items defined for "${moduleSlug}"` };
        }

        // Enable the module if not already enabled.
        let pm = await getPartnerModuleAction(partnerId, moduleSlug);
        let didEnable = false;
        if (!pm.success || !pm.data) {
            const enable = await enablePartnerModuleAction(partnerId, moduleSlug);
            if (!enable.success) {
                return { success: false, error: enable.error || 'Failed to enable module' };
            }
            didEnable = true;
            pm = await getPartnerModuleAction(partnerId, moduleSlug);
            if (!pm.success || !pm.data) {
                return { success: false, error: 'Module enabled but could not be loaded' };
            }
        }

        const moduleId = pm.data.partnerModule.id;

        if (options?.skipIfItemsExist) {
            const existing = await getModuleItemsAction(partnerId, moduleId, { pageSize: 1 });
            const total = existing.success ? existing.data?.total ?? 0 : 0;
            if (total > 0) {
                return { success: true, created: 0, enabled: didEnable };
            }
        }

        const res = await bulkCreateModuleItemsAction(partnerId, moduleId, items, userId);
        if (!res.success) {
            return { success: false, error: res.error || 'Failed to create sample items' };
        }
        return { success: true, created: res.data?.created ?? 0, enabled: didEnable };
    } catch (err: any) {
        console.error('[sample-data] seedSampleItemsAction failed:', err);
        return { success: false, error: err?.message ?? 'unknown' };
    }
}

export interface QuickStartResult {
    success: boolean;
    sectionsSeeded: Array<{ sectionId: string; moduleSlug: string; created: number; enabled: boolean }>;
    error?: string;
}

export async function quickStartTaxonomyDataAction(
    partnerId: string,
    functionId: string,
    userId: string,
): Promise<QuickStartResult> {
    const guide = getDataGuideForFunction(functionId);
    if (!guide) {
        return {
            success: false,
            sectionsSeeded: [],
            error: `No data guide for function "${functionId}"`,
        };
    }
    const sectionsSeeded: QuickStartResult['sectionsSeeded'] = [];
    // Dedupe by moduleSlug — several sections can share the same module
    // (food_menu drives Menu, Categories, Dietary, Nutrition for beverage_cafe).
    const seen = new Set<string>();
    for (const section of guide.sections) {
        if (!section.moduleSlug) continue;
        if (section.status !== 'required' && section.status !== 'optional') continue;
        if (seen.has(section.moduleSlug)) continue;
        seen.add(section.moduleSlug);
        const res = await seedSampleItemsAction(partnerId, section.moduleSlug, userId, {
            skipIfItemsExist: true,
        });
        if (res.success) {
            sectionsSeeded.push({
                sectionId: section.id,
                moduleSlug: section.moduleSlug,
                created: res.created ?? 0,
                enabled: res.enabled ?? false,
            });
        }
    }
    return { success: true, sectionsSeeded };
}

// Ensures every required module for the partner's taxonomy is enabled.
// Idempotent — safe to call on every page load. Does NOT seed items.
export async function ensureRequiredModulesEnabledAction(
    partnerId: string,
    functionId: string,
): Promise<{ success: boolean; enabledSlugs: string[]; error?: string }> {
    const guide = getDataGuideForFunction(functionId);
    if (!guide) return { success: true, enabledSlugs: [] };
    const enabledSlugs: string[] = [];
    const seen = new Set<string>();
    for (const section of guide.sections) {
        if (!section.moduleSlug) continue;
        if (section.status !== 'required') continue;
        if (seen.has(section.moduleSlug)) continue;
        seen.add(section.moduleSlug);
        try {
            const pm = await getPartnerModuleAction(partnerId, section.moduleSlug);
            if (!pm.success || !pm.data) {
                const res = await enablePartnerModuleAction(partnerId, section.moduleSlug);
                if (res.success) enabledSlugs.push(section.moduleSlug);
            }
        } catch {
            // non-fatal — keep trying the rest
        }
    }
    return { success: true, enabledSlugs };
}
