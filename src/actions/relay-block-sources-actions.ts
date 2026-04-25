'use server';

// ── Relay block data-source helpers ──────────────────────────────────
//
// Powers the /partner/relay/blocks explorer + /partner/relay/test-chat:
//  - `listPartnerDataSourcesAction` returns the modules + vault files a
//    partner can wire into a block.
//  - `getBlockPreviewDataAction` returns the data envelope for a block,
//    in either 'sample' (default — registry sampleData, no Firestore
//    items hit) or 'live' (partner's businessModules items) mode.
//
// PR fix-16a: schema lookups no longer go through systemModules — that
// path is owned by `getBlockContextAction` reading from relaySchemas.
// Live partner item retrieval still goes through businessModules
// (separate concern: schema vs. partner data storage).

import { db as adminDb } from '@/lib/firebase-admin';
import { buildBlockData } from '@/lib/relay/admin-block-data';
import { buildBlockDataFromSample } from '@/lib/relay/build-block-data-from-sample';
import {
    getPartnerModulesAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import { getPartnerCustomizationAction, type BlockDataSource } from '@/actions/relay-customization-actions';
import {
    getContractFor,
    isModuleDriven,
    isProfileDriven,
    type BlockDataContract,
} from '@/lib/relay/block-data-contracts';
import type { SampleOrLive } from '@/lib/relay/block-context-types';

export interface PartnerModuleSource {
    id: string;        // PartnerModule doc id
    slug: string;      // systemModule slug (e.g. "menu", "services")
    name: string;      // partner-chosen display name
    itemCount: number;
}

export interface PartnerDocumentSource {
    id: string;
    name: string;
    mimeType: string;
}

export async function listPartnerDataSourcesAction(
    partnerId: string
): Promise<{
    success: boolean;
    modules?: PartnerModuleSource[];
    documents?: PartnerDocumentSource[];
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const modulesResult = await getPartnerModulesAction(partnerId);
        const partnerModules = modulesResult.success ? modulesResult.data || [] : [];
        const modules: PartnerModuleSource[] = partnerModules.map((m: any) => ({
            id: m.id,
            slug: m.moduleSlug,
            name: m.name || m.moduleSlug,
            itemCount: typeof m.activeItemCount === 'number'
                ? m.activeItemCount
                : typeof m.itemCount === 'number' ? m.itemCount : 0,
        }));

        let documents: PartnerDocumentSource[] = [];
        try {
            const snap = await adminDb
                .collection(`partners/${partnerId}/vaultFiles`)
                .where('state', '==', 'ACTIVE')
                .orderBy('createdAt', 'desc')
                .get();
            documents = snap.docs.map((d: any) => {
                const data = d.data();
                return {
                    id: d.id,
                    name: (data.originalName || data.displayName || data.name || d.id) as string,
                    mimeType: (data.mimeType || '') as string,
                };
            });
        } catch (docErr) {
            console.error('[blocks] vault files load failed (non-fatal):', docErr);
        }

        return { success: true, modules, documents };
    } catch (error: any) {
        console.error('[blocks] listPartnerDataSourcesAction failed:', error);
        return { success: false, error: error.message };
    }
}

export async function getBlockPreviewDataAction(
    partnerId: string,
    blockId: string,
    /**
     * 'sample' (default) → registry sampleData, no Firestore item
     *                       reads. The new test-chat default — every
     *                       partner sees a fully populated bot
     *                       regardless of module setup.
     * 'live'             → partner's businessModules items. Use when
     *                       admin/partner explicitly toggles
     *                       "Use my live data".
     *
     * PR fix-16a — replaces the prior auto-only path.
     */
    mode: SampleOrLive = 'sample',
): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    source?: BlockDataSource;
    mode?: SampleOrLive;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        // Partner doc (used for greeting/contact personas + the currency
        // thread shared by both modes).
        let partnerData: Record<string, any> | null = null;
        try {
            const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
            partnerData = partnerDoc.exists ? (partnerDoc.data() as Record<string, any>) : null;
        } catch { /* continue */ }

        // ── Sample mode ─────────────────────────────────────────────
        // No Firestore items hit; envelope comes from the runtime
        // block registry's sampleData. Currency is threaded through
        // from persona for the formatMoney path.
        if (mode === 'sample') {
            const data = buildBlockDataFromSample({ blockId, partnerData });
            return { success: true, data, mode: 'sample' };
        }

        // ── Live mode ───────────────────────────────────────────────
        // Partner-saved source override (if any) for this block.
        const customizationRes = await getPartnerCustomizationAction(partnerId);
        const source: BlockDataSource =
            customizationRes.customization?.blockOverrides?.[blockId]?.dataSource
            || { type: 'auto' };

        if (source.type === 'none') {
            return { success: true, data: undefined, source, mode: 'live' };
        }

        // Load partner items. Module display name comes from the
        // partnerModule doc directly — no longer hits the deprecated
        // systemModules collection, since schema metadata now lives in
        // relaySchemas (queried via getBlockContextAction).
        const modules: Array<{ slug: string; name: string; items: any[] }> = [];

        if (source.type === 'module' && source.id) {
            const partnerModulesResult = await getPartnerModulesAction(partnerId);
            const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];
            const pm = partnerModules.find((m: any) => m.id === source.id);
            if (pm) {
                const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                    isActive: true,
                    pageSize: 20,
                    sortBy: 'sortOrder',
                    sortOrder: 'asc',
                });
                const items = itemsResult.success ? itemsResult.data?.items || [] : [];
                modules.push({
                    slug: pm.moduleSlug,
                    name: pm.name || pm.moduleSlug,
                    items,
                });
            }
        } else if (source.type === 'auto') {
            const partnerModulesResult = await getPartnerModulesAction(partnerId);
            const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];
            for (const pm of partnerModules.slice(0, 10)) {
                const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                    isActive: true,
                    pageSize: 20,
                    sortBy: 'sortOrder',
                    sortOrder: 'asc',
                });
                const items = itemsResult.success ? itemsResult.data?.items || [] : [];
                modules.push({
                    slug: pm.moduleSlug,
                    name: pm.name || pm.moduleSlug,
                    items,
                });
            }
        }
        // 'document' source currently has no structured renderer; preview
        // falls back to design sample until a document-driven builder
        // exists for the given block family.

        const data = buildBlockData({ blockId, partnerData, modules });
        return { success: true, data, source, mode: 'live' };
    } catch (error: any) {
        console.error('[blocks] getBlockPreviewDataAction failed:', error);
        return { success: false, error: error.message };
    }
}

// ── Diagnostics: one-shot readiness + contract summary per block ─────

export interface BlockFieldDiagnosticEntry {
    id: string;
    label: string;
    required: boolean;
    sourceKind: 'partner_profile' | 'module_item' | 'document' | 'static';
    sourceLabel: string;          // e.g. "Business Profile › Phone"
    settingsHref?: string;        // deep link when source is profile
    value?: string;               // current value if known
    resolved: boolean;            // true when a value exists / source is reachable
}

export interface BlockDiagnostic {
    blockId: string;
    summary: string;
    designOnly: boolean;
    driver: 'profile' | 'module' | 'document' | 'static';
    fields: BlockFieldDiagnosticEntry[];
    // Modules this block could use that the partner actually has (by slug).
    compatibleModules: PartnerModuleSource[];
    // Suggested modules the partner hasn't connected yet. Each entry
    // links to /partner/relay/data where the partner can enable/create it.
    missingModules: Array<{ slug: string; name: string; reason: string; href: string }>;
    // Summary of the block's readiness.
    ready: boolean;
    readySummary: string;
}

export async function getBlockDiagnosticsAction(
    partnerId: string,
    blockIds: string[]
): Promise<{ success: boolean; diagnostics?: BlockDiagnostic[]; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const [partnerDocSnap, sourcesRes] = await Promise.all([
            adminDb.collection('partners').doc(partnerId).get(),
            listPartnerDataSourcesAction(partnerId),
        ]);

        const partnerData = partnerDocSnap.exists ? (partnerDocSnap.data() as Record<string, any>) : null;
        const partnerModules: PartnerModuleSource[] = sourcesRes.success ? sourcesRes.modules || [] : [];

        const diagnostics: BlockDiagnostic[] = blockIds.map(blockId => {
            const contract = getContractFor(blockId);
            const driver: BlockDiagnostic['driver'] = contract.designOnly
                ? 'static'
                : isModuleDriven(contract)
                ? 'module'
                : isProfileDriven(contract)
                ? 'profile'
                : 'static';

            const fields: BlockFieldDiagnosticEntry[] = contract.fields.map(f => {
                if (f.source.kind === 'partner_profile') {
                    const value = readPath(partnerData, f.source.path);
                    return {
                        id: f.id,
                        label: f.label,
                        required: f.required,
                        sourceKind: 'partner_profile',
                        sourceLabel: f.source.label,
                        settingsHref: f.source.settingsHref,
                        value: typeof value === 'string' ? value : undefined,
                        resolved: typeof value === 'string' && !!value.trim(),
                    };
                }
                if (f.source.kind === 'module_item') {
                    const match = partnerModules.find(m =>
                        f.source.kind === 'module_item' && f.source.moduleSlugs.includes(m.slug)
                    );
                    return {
                        id: f.id,
                        label: f.label,
                        required: f.required,
                        sourceKind: 'module_item',
                        sourceLabel: match
                            ? `${match.name} › ${f.source.itemFields[0]}`
                            : `Module (${f.source.moduleSlugs.join(' / ')}) › ${f.source.itemFields[0]}`,
                        resolved: !!match && match.itemCount > 0,
                    };
                }
                if (f.source.kind === 'document') {
                    return {
                        id: f.id,
                        label: f.label,
                        required: f.required,
                        sourceKind: 'document',
                        sourceLabel: `Uploaded document · ${f.source.hint}`,
                        resolved: false,
                    };
                }
                return {
                    id: f.id,
                    label: f.label,
                    required: f.required,
                    sourceKind: 'static',
                    sourceLabel: f.source.note,
                    resolved: true,
                };
            });

            const compatibleModules = (contract.suggestedModules || []).flatMap(sm =>
                partnerModules.filter(m => m.slug === sm.slug)
            );

            const missingModules = (contract.suggestedModules || [])
                .filter(sm => !partnerModules.some(m => m.slug === sm.slug))
                .map(sm => ({
                    slug: sm.slug,
                    name: sm.name,
                    reason: sm.reason,
                    href: `/partner/relay/data?add=${encodeURIComponent(sm.slug)}`,
                }));

            const requiredFields = fields.filter(f => f.required);
            const requiredResolved = requiredFields.every(f => f.resolved);
            const ready = contract.designOnly ? true : requiredResolved && (driver !== 'module' || compatibleModules.length > 0);

            let readySummary = '';
            if (contract.designOnly) {
                readySummary = 'Design-only block — no data required.';
            } else if (!ready) {
                if (driver === 'module' && compatibleModules.length === 0) {
                    readySummary = `Needs a ${contract.suggestedModules?.[0]?.name || 'module'} to show real data.`;
                } else {
                    const missing = requiredFields.filter(f => !f.resolved).map(f => f.label);
                    readySummary = missing.length
                        ? `Missing ${missing.join(', ')}.`
                        : 'Data source not connected.';
                }
            } else {
                readySummary = driver === 'profile'
                    ? 'All fields resolved from your Business Profile.'
                    : `Connected to ${compatibleModules[0]?.name || 'module'}.`;
            }

            return {
                blockId,
                summary: contract.summary,
                designOnly: !!contract.designOnly,
                driver,
                fields,
                compatibleModules,
                missingModules,
                ready,
                readySummary,
            };
        });

        return { success: true, diagnostics };
    } catch (error: any) {
        console.error('[blocks] getBlockDiagnosticsAction failed:', error);
        return { success: false, error: error.message };
    }
}

function readPath(obj: Record<string, any> | null, path: string): unknown {
    if (!obj) return undefined;
    let cur: any = obj;
    for (const k of path.split('.')) {
        if (cur == null) return undefined;
        cur = cur[k];
    }
    return cur;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _ensureContractHelpers(c: BlockDataContract) { return c; }
