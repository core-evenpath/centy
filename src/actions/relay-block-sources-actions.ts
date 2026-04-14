'use server';

// ── Relay block data-source helpers ──────────────────────────────────
//
// Powers the /partner/relay/blocks explorer:
//  - `listPartnerDataSourcesAction` returns the modules + vault files a
//    partner can wire into a block.
//  - `getBlockPreviewDataAction` runs the same `buildBlockData` dispatch
//    the chat route uses, honouring the partner's saved `dataSource`
//    override so the card preview matches what visitors will see.

import { db as adminDb } from '@/lib/firebase-admin';
import { buildBlockData } from '@/lib/relay/admin-block-data';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import { getPartnerCustomizationAction, type BlockDataSource } from '@/actions/relay-customization-actions';

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
    blockId: string
): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    source?: BlockDataSource;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        // Partner doc (for greeting/contact personas).
        let partnerData: Record<string, any> | null = null;
        try {
            const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
            partnerData = partnerDoc.exists ? (partnerDoc.data() as Record<string, any>) : null;
        } catch { /* continue */ }

        // User-saved source (if any) for this block.
        const customizationRes = await getPartnerCustomizationAction(partnerId);
        const source: BlockDataSource =
            customizationRes.customization?.blockOverrides?.[blockId]?.dataSource
            || { type: 'auto' };

        if (source.type === 'none') {
            return { success: true, data: undefined, source };
        }

        // Load modules — either the single selected one or everything
        // (so `buildBlockData` can fall back to first-with-items for
        // product_card when source.type === 'auto').
        const modules: Array<{ slug: string; name: string; items: any[] }> = [];

        if (source.type === 'module' && source.id) {
            const partnerModulesResult = await getPartnerModulesAction(partnerId);
            const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];
            const pm = partnerModules.find((m: any) => m.id === source.id);
            if (pm) {
                const systemResult = await getSystemModuleAction(pm.moduleSlug);
                const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                    isActive: true,
                    pageSize: 20,
                    sortBy: 'sortOrder',
                    sortOrder: 'asc',
                });
                const items = itemsResult.success ? itemsResult.data?.items || [] : [];
                modules.push({
                    slug: pm.moduleSlug,
                    name: (systemResult.success && systemResult.data?.name) || pm.name || pm.moduleSlug,
                    items,
                });
            }
        } else if (source.type === 'auto') {
            const partnerModulesResult = await getPartnerModulesAction(partnerId);
            const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];
            for (const pm of partnerModules.slice(0, 10)) {
                const systemResult = await getSystemModuleAction(pm.moduleSlug);
                if (!systemResult.success || !systemResult.data) continue;
                const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                    isActive: true,
                    pageSize: 20,
                    sortBy: 'sortOrder',
                    sortOrder: 'asc',
                });
                const items = itemsResult.success ? itemsResult.data?.items || [] : [];
                modules.push({ slug: pm.moduleSlug, name: systemResult.data.name, items });
            }
        }
        // 'document' source currently has no structured renderer; preview
        // falls back to design sample until a document-driven builder
        // exists for the given block family.

        const data = buildBlockData({ blockId, partnerData, modules });
        return { success: true, data, source };
    } catch (error: any) {
        console.error('[blocks] getBlockPreviewDataAction failed:', error);
        return { success: false, error: error.message };
    }
}
