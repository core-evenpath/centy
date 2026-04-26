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
    deleteModuleItemAction,
} from '@/actions/modules-actions';
import { db as adminDb } from '@/lib/firebase-admin';
import type { ModuleItem } from '@/lib/modules/types';
import { getDataGuideForFunction } from '@/lib/relay/block-data-guide';
import {
    getFixtureItemsForSlug,
    type FixtureItem,
} from '@/lib/relay/sample-fixtures';

type SampleItem = Partial<ModuleItem>;

// ── Schema-derived sample items (PR fix-19b) ─────────────────────────
//
// When a slug doesn't have a hand-curated entry in SAMPLE_ITEMS_BY_SLUG,
// generate 3 generic sample items from the relaySchemas field list.
// Every schema gets working "Start with sample data" without per-slug
// code edits.

// Minimal sample items used when the schema doc doesn't exist in
// relaySchemas yet (admin hasn't generated it) or has zero fields.
// Keeps "Generate sample data" working even for slugs the admin
// hasn't enriched — partner sees something they can edit.
function buildMinimalSampleItems(slug: string): SampleItem[] {
    const label = slug
        .split('_')
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    return [1, 2, 3].map((i) => ({
        name: `${label} Sample ${i}`,
        description: `Auto-generated placeholder for ${slug}. Edit to make it real.`,
        category: 'General',
        price: [19.99, 29.99, 39.99][i - 1] ?? 19.99,
        currency: 'USD',
        isActive: true,
    }));
}

async function deriveSampleItemsFromSchema(
    slug: string,
): Promise<SampleItem[] | null> {
    try {
        // Phase 4: curated fixtures first. When `sample-fixtures.json` has
        // entries for this slug we bypass the deterministic generator
        // entirely — partners see realistic data ("Margherita Pizza")
        // instead of generic placeholders ("Sample category 1"). Slugs
        // without fixtures fall through to the existing generator below.
        const fixtures = getFixtureItemsForSlug(slug);
        if (fixtures && fixtures.length > 0) {
            return fixtures.map((f) => fixtureToSampleItem(f));
        }

        const doc = await adminDb.collection('relaySchemas').doc(slug).get();
        if (!doc.exists) {
            // PR fix-22: seedAllVerticalSchemasAction now iterates the
            // block registry, which can reference module slugs the
            // admin hasn't generated relaySchemas docs for yet. Fall
            // back to minimal items so the partner-side checklist
            // never shows "NEEDS DATA" forever.
            return buildMinimalSampleItems(slug);
        }
        const data = doc.data() as any;
        const fields: any[] =
            data?.schema?.fields ?? data?.fields ?? [];
        if (!Array.isArray(fields) || fields.length === 0) {
            // Schema doc exists but has zero fields (unenriched). Same
            // fallback applies — partner needs something to start with.
            return buildMinimalSampleItems(slug);
        }

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
                        // PR fix-25: harden coverage — every type
                        // produces a non-null value so admin-defined
                        // schema fields always land in Firestore.
                        if (ftype === 'number' || ftype === 'currency' || ftype === 'duration') {
                            value = [19.99, 29.99, 39.99][i - 1] ?? i;
                        } else if (ftype === 'toggle') {
                            value = true;
                        } else if (ftype === 'tags' || ftype === 'multi_select') {
                            value = i === 1 ? ['sample'] : [];
                        } else if (ftype === 'images') {
                            value = [`https://placehold.co/600x400?text=Sample+${i}`];
                        } else if (ftype === 'image' || ftype === 'url') {
                            value = `https://example.com/sample-${i}`;
                        } else if (ftype === 'email') {
                            value = `sample${i}@example.com`;
                        } else if (ftype === 'phone') {
                            value = `+1-555-010${i}`;
                        } else if (ftype === 'date') {
                            value = new Date(Date.now() + i * 86_400_000)
                                .toISOString()
                                .slice(0, 10);
                        } else if (ftype === 'select') {
                            // No way to know option labels here; pick a
                            // plausible default keyed by field name.
                            value = `Option ${i}`;
                        } else if (ftype === 'rating') {
                            value = [4.5, 4.7, 4.9][i - 1] ?? 4.5;
                        } else {
                            // text / textarea / unknown — use the field
                            // label when present for a more human result.
                            const label = (f.label as string | undefined) || fname;
                            value = `Sample ${label} ${i}`;
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

// PR fix-21: removed SAMPLE_ITEMS_BY_SLUG curated demos. Every slug
// now goes through deriveSampleItemsFromSchema for consistent coverage
// across all 153 vertical-prefixed schemas (one path, no per-slug code).

// Phase 4: shape a curated FixtureItem into the SampleItem partial that
// bulkCreateModuleItemsAction expects. The two shapes differ only in
// optional/typed wrapping; we keep the canonical top-level slots
// (name/description/category/price/currency/isActive/images) and pass
// `fields` through verbatim — Firestore tolerates the wider shape and
// block renderers read by bare field name (post-Phase-0 alignment).
function fixtureToSampleItem(f: FixtureItem): SampleItem {
    const item: SampleItem = {
        name: f.name,
        description: f.description,
        isActive: f.isActive ?? true,
    };
    if (typeof f.category === 'string') item.category = f.category;
    if (typeof f.price === 'number') item.price = f.price;
    if (typeof f.currency === 'string') item.currency = f.currency;
    if (Array.isArray(f.images) && f.images.length > 0) {
        item.images = f.images.filter((s): s is string => typeof s === 'string');
    }
    if (f.fields && typeof f.fields === 'object') {
        item.fields = { ...f.fields } as Record<string, any>;
    }
    return item;
}


// Description prefixes the deterministic generator emits — used by
// `replaceAutoSamples` to identify items safe to delete on Refresh.
// Partner-entered items don't start with these strings; their
// descriptions are user-authored prose.
const AUTO_SAMPLE_DESCRIPTION_RE =
    /^Auto-generated (sample for previewing|placeholder for) /;

export async function seedSampleItemsAction(
    partnerId: string,
    moduleSlug: string,
    userId: string,
    options?: {
        skipIfItemsExist?: boolean;
        /**
         * When true, before checking `skipIfItemsExist` the action
         * deletes any item whose description matches the auto-generator
         * boilerplate. Curated fixture items + partner-edited items are
         * NOT deleted — they have realistic descriptions that don't
         * match the heuristic. Used by the partner-side "Refresh
         * samples" flow to swap stale generic items for fresh fixtures.
         */
        replaceAutoSamples?: boolean;
    },
): Promise<{
    success: boolean;
    created?: number;
    enabled?: boolean;
    /** Auto-generated items deleted by the replaceAutoSamples pass. */
    deletedAutoSamples?: number;
    error?: string;
}> {
    try {
        // PR fix-25: deterministic-only. The schema fields at
        // /admin/relay/data are already AI-curated (admin enrichment
        // step). Partner-side just populates those fields with
        // type-appropriate values. No second AI pass — the previous
        // Gemini-first path silently dropped fields when the model
        // omitted them. Now every schema field always gets a value.
        const items = await deriveSampleItemsFromSchema(moduleSlug);
        if (!items || items.length === 0) {
            return {
                success: false,
                error: `No sample items available for "${moduleSlug}".`,
            };
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

        // ── replaceAutoSamples (Refresh) ────────────────────────────
        // Wipe legacy generic items so the fresh fixture pass below
        // can land. We page through up to 200 items per module — well
        // above any realistic seed count. Partner items survive because
        // their descriptions don't match the auto-gen pattern.
        let deletedAutoSamples = 0;
        if (options?.replaceAutoSamples) {
            const existing = await getModuleItemsAction(partnerId, moduleId, {
                pageSize: 200,
            });
            const itemsToDelete =
                existing.success && existing.data
                    ? existing.data.items.filter(
                          (it) =>
                              typeof it.description === 'string' &&
                              AUTO_SAMPLE_DESCRIPTION_RE.test(it.description),
                      )
                    : [];
            for (const it of itemsToDelete) {
                try {
                    const del = await deleteModuleItemAction(
                        partnerId,
                        moduleId,
                        it.id,
                    );
                    if (del.success) deletedAutoSamples++;
                } catch {
                    // non-fatal — partial delete still valuable
                }
            }
        }

        if (options?.skipIfItemsExist) {
            const existing = await getModuleItemsAction(partnerId, moduleId, { pageSize: 1 });
            const total = existing.success ? existing.data?.total ?? 0 : 0;
            if (total > 0) {
                return {
                    success: true,
                    created: 0,
                    enabled: didEnable,
                    deletedAutoSamples,
                };
            }
        }

        const res = await bulkCreateModuleItemsAction(partnerId, moduleId, items, userId);
        if (!res.success) {
            return { success: false, error: res.error || 'Failed to create sample items' };
        }
        return {
            success: true,
            created: res.data?.created ?? 0,
            enabled: didEnable,
            deletedAutoSamples,
        };
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
