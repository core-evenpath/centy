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
    deleteAllModuleItemsAction,
} from '@/actions/modules-actions';
import { db as adminDb } from '@/lib/firebase-admin';
import type { ModuleItem } from '@/lib/modules/types';
import { getDataGuideForFunction } from '@/lib/relay/block-data-guide';

type SampleItem = Partial<ModuleItem>;

// ── Schema-derived sample items (PR fix-19b) ─────────────────────────
//
// When a slug doesn't have a hand-curated entry in SAMPLE_ITEMS_BY_SLUG,
// generate 3 generic sample items from the relaySchemas field list.
// Every schema gets working "Start with sample data" without per-slug
// code edits.

async function deriveSampleItemsFromSchema(
    slug: string,
): Promise<SampleItem[] | null> {
    try {
        const doc = await adminDb.collection('relaySchemas').doc(slug).get();
        if (!doc.exists) return null;
        const data = doc.data() as any;
        const fields: any[] =
            data?.schema?.fields ?? data?.fields ?? [];
        if (!Array.isArray(fields) || fields.length === 0) return null;

        // Build 3 items, each populating fields with type-appropriate
        // demo values. Required fields always populated; optional fields
        // populated when they're well-known (price, currency, image_url).
        const itemNamePrefix =
            typeof data?.itemLabel === 'string' && data.itemLabel
                ? data.itemLabel
                : 'Sample';

        const out: SampleItem[] = [];
        for (let i = 1; i <= 3; i++) {
            const item: Record<string, any> = {
                name: `${itemNamePrefix} ${i}`,
                description: `Auto-generated sample for previewing ${slug}.`,
                isActive: true,
            };
            const customFieldValues: Record<string, any> = {};

            for (const f of fields) {
                const fname: string = f.name ?? f.fieldName ?? f.field ?? '';
                if (!fname) continue;
                if (fname === 'name' || fname === 'description') continue;
                const ftype: string = (f.type ?? 'text').toLowerCase();
                let value: any;
                switch (fname) {
                    case 'price':
                    case 'amount':
                    case 'cost':
                        value = [19.99, 29.99, 39.99][i - 1] ?? 19.99;
                        break;
                    case 'currency':
                        // Default per schema's defaultCurrency, fall back USD.
                        value = data?.defaultCurrency ?? 'USD';
                        break;
                    case 'image_url':
                    case 'imageUrl':
                    case 'thumbnail':
                        value = `https://placehold.co/600x400?text=Sample+${i}`;
                        break;
                    case 'category':
                        value = 'General';
                        break;
                    case 'rating':
                        value = [4.7, 4.5, 4.8][i - 1] ?? 4.5;
                        break;
                    case 'review_count':
                    case 'reviewCount':
                        value = [128, 64, 256][i - 1] ?? 64;
                        break;
                    case 'subtitle':
                        value = `Demo subtitle ${i}`;
                        break;
                    case 'badges':
                        value = i === 1 ? ['Popular'] : i === 2 ? ['New'] : [];
                        break;
                    case 'in_stock':
                    case 'inStock':
                        value = true;
                        break;
                    case 'duration':
                        value = ['30 min', '60 min', '90 min'][i - 1];
                        break;
                    case 'date':
                        value = new Date(Date.now() + i * 86_400_000)
                            .toISOString()
                            .slice(0, 10);
                        break;
                    case 'time':
                        value = ['10:00', '14:00', '17:30'][i - 1];
                        break;
                    case 'status':
                        value = ['active', 'pending', 'in_progress'][i - 1];
                        break;
                    default:
                        // Type-based fallback for unknown field names.
                        if (ftype === 'number' || ftype === 'currency') {
                            value = i;
                        } else if (ftype === 'toggle') {
                            value = true;
                        } else if (ftype === 'tags' || ftype === 'images') {
                            value = [];
                        } else if (ftype === 'date') {
                            value = new Date().toISOString().slice(0, 10);
                        } else {
                            value = `Demo ${fname} ${i}`;
                        }
                }
                // ModuleItem has top-level slots for a few canonical fields;
                // everything else lands in `fields` (custom fields bag).
                if (fname === 'price') item.price = value;
                else if (fname === 'currency') item.currency = value;
                else if (fname === 'category') item.category = value;
                else if (fname === 'image_url' || fname === 'imageUrl' || fname === 'thumbnail')
                    item.images = [value];
                else customFieldValues[fname] = value;
            }
            if (Object.keys(customFieldValues).length > 0) {
                item.fields = customFieldValues;
            }
            out.push(item as SampleItem);
        }
        return out;
    } catch (err) {
        console.error('[sample-data] deriveSampleItemsFromSchema failed:', err);
        return null;
    }
}

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
        // PR fix-19b: prefer the hand-curated set when one exists for
        // this slug (covers the legacy product_catalog / service_catalog
        // / fb_menu_catalog flows). Otherwise derive 3 generic items
        // from the schema's field list — every relaySchemas slug now
        // gets working sample data without needing a code update for
        // each new schema.
        let items = SAMPLE_ITEMS_BY_SLUG[moduleSlug];
        if (!items || items.length === 0) {
            const derived = await deriveSampleItemsFromSchema(moduleSlug);
            if (!derived || derived.length === 0) {
                return {
                    success: false,
                    error: `No sample items available for "${moduleSlug}" (schema not found in relaySchemas).`,
                };
            }
            items = derived;
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

export interface ClearSampleResult {
    success: boolean;
    sectionsCleared: Array<{ moduleSlug: string; deleted: number }>;
    error?: string;
}

// Inverse of `seedSampleItemsAction` / `quickStartTaxonomyDataAction`:
// wipes every item from the listed modules so the partner can start
// over. Modules stay enabled (matches the partner's expectation —
// /partner/relay/data shows the module cards, just empty) so the
// flow can re-seed without re-enabling.
//
// Acts on *all* items in each module, not just ones we seeded — the
// partner opted in via the "Clear sample data" confirmation.
export async function clearSampleItemsForModulesAction(
    partnerId: string,
    moduleSlugs: string[],
): Promise<ClearSampleResult> {
    try {
        const seen = new Set<string>();
        const sectionsCleared: ClearSampleResult['sectionsCleared'] = [];
        for (const slug of moduleSlugs) {
            if (!slug || seen.has(slug)) continue;
            seen.add(slug);
            const pm = await getPartnerModuleAction(partnerId, slug);
            if (!pm.success || !pm.data) {
                // Module never enabled → nothing to clear, skip silently.
                continue;
            }
            const moduleId = pm.data.partnerModule.id;
            const del = await deleteAllModuleItemsAction(partnerId, moduleId);
            if (del.success) {
                sectionsCleared.push({
                    moduleSlug: slug,
                    deleted: del.data?.deleted ?? 0,
                });
            }
        }
        return { success: true, sectionsCleared };
    } catch (err: any) {
        console.error('[sample-data] clearSampleItemsForModulesAction failed:', err);
        return {
            success: false,
            sectionsCleared: [],
            error: err?.message ?? 'unknown',
        };
    }
}

// Taxonomy-scoped wrapper used by the Test Chat "Clear sample data"
// button: walks the same sections that `quickStartTaxonomyDataAction`
// seeds, so clearing is the exact inverse of starting.
export async function clearTaxonomyDataAction(
    partnerId: string,
    functionId: string,
): Promise<ClearSampleResult> {
    const guide = getDataGuideForFunction(functionId);
    if (!guide) {
        return {
            success: false,
            sectionsCleared: [],
            error: `No data guide for function "${functionId}"`,
        };
    }
    const slugs: string[] = [];
    for (const section of guide.sections) {
        if (!section.moduleSlug) continue;
        if (section.status === 'design_only') continue;
        slugs.push(section.moduleSlug);
    }
    return clearSampleItemsForModulesAction(partnerId, slugs);
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
