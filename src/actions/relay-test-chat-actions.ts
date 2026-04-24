'use server';

// ── Test Chat bento / checklist support ─────────────────────────────
//
// Thin server-action wrappers so the partner-facing Test Chat page
// (client component) can fetch:
//   - the list of Relay blocks available for a given functionId
//   - the most-recent item summary for a partner module (sample names +
//     last-updated timestamp), used to drive the "Data you need to
//     upload" checklist feedback.

import { getAllowedBlocksForFunction } from '@/lib/relay/admin-block-registry';
import type { ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import {
    getPartnerModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import { db as adminDb } from '@/lib/firebase-admin';
import type {
    HomeScreenConfig,
    HomeScreenSection,
} from '@/actions/flow-composer-actions';

export interface TestChatBlockInfo {
    id: string;
    label: string;
    family: string;
    stage: string;
    desc: string;
    /** Module slug when the block is module-driven; null otherwise. */
    module: string | null;
}

export async function getTestChatBlocksAction(
    functionId: string | null | undefined,
): Promise<{ success: boolean; blocks: TestChatBlockInfo[]; error?: string }> {
    try {
        const blocks = getAllowedBlocksForFunction(functionId);
        return {
            success: true,
            blocks: blocks.map((b: ServerBlockData) => ({
                id: b.id,
                label: b.label,
                family: b.family,
                stage: b.stage,
                desc: b.desc,
                module: b.module,
            })),
        };
    } catch (err: any) {
        console.error('[test-chat] getTestChatBlocksAction failed:', err);
        return { success: false, blocks: [], error: err?.message ?? 'unknown' };
    }
}

export interface ModuleSampleSummary {
    moduleSlug: string;
    enabled: boolean;
    total: number;
    /** Item names for the first 3 rows, for inline preview chips. */
    sampleNames: string[];
    /** ISO8601; max(updatedAt, createdAt) across the first page. */
    lastUpdatedAt?: string;
}

// ── Homescreen config per flow ──────────────────────────────────────
//
// The admin configures a `homeScreen` layout on each system flow template
// in /admin/relay/flows (see flow-composer-actions.ts). Test Chat reads
// that config so the partner sees the same default view the admin set
// for their taxonomy. If no template is stored yet, we fall back to the
// 'bento' layout — matching the legacy behaviour of the page.

export interface FlowHomeScreen {
    /** Layout picked in admin. Test Chat uses this to decide which home
     *  surface to render (bento vs storefront vs "no home, chat-first"). */
    layout: HomeScreenConfig['layout'];
    sections: HomeScreenSection[];
    /** Template id/name so the UI can show "configured in admin flow X". */
    templateId?: string;
    templateName?: string;
    /** True when no admin template exists and we're returning the
     *  hard-coded default. */
    isDefault: boolean;
}

export async function getFlowHomeScreenForFunctionAction(
    functionId: string | null | undefined,
): Promise<{ success: boolean; homeScreen: FlowHomeScreen; error?: string }> {
    const defaultHomeScreen: FlowHomeScreen = {
        layout: 'bento',
        sections: [],
        isDefault: true,
    };
    try {
        if (!functionId || !adminDb) {
            return { success: true, homeScreen: defaultHomeScreen };
        }
        // Prefer active templates; fall back to any template that matches
        // so drafts surface too (partners don't see a blank screen just
        // because the flow hasn't been published yet).
        const snap = await adminDb
            .collection('systemFlowTemplates')
            .where('functionId', '==', functionId)
            .get();
        if (snap.empty) {
            return { success: true, homeScreen: defaultHomeScreen };
        }
        interface FlowDoc {
            id: string;
            data: Record<string, any>;
        }
        const docs: FlowDoc[] = snap.docs.map((d: any) => ({
            id: d.id,
            data: d.data() || {},
        }));
        const pick: FlowDoc =
            docs.find((d: FlowDoc) => d.data.status === 'active') ??
            docs[0];
        const hs = (pick.data.homeScreen as HomeScreenConfig | undefined) ?? undefined;
        if (!hs) {
            return {
                success: true,
                homeScreen: {
                    ...defaultHomeScreen,
                    templateId: pick.id,
                    templateName: typeof pick.data.name === 'string' ? pick.data.name : undefined,
                },
            };
        }
        return {
            success: true,
            homeScreen: {
                layout: hs.layout ?? 'bento',
                sections: Array.isArray(hs.sections) ? hs.sections : [],
                templateId: pick.id,
                templateName: typeof pick.data.name === 'string' ? pick.data.name : undefined,
                isDefault: false,
            },
        };
    } catch (err: any) {
        console.error('[test-chat] getFlowHomeScreenForFunctionAction failed:', err);
        return {
            success: false,
            homeScreen: defaultHomeScreen,
            error: err?.message ?? 'unknown',
        };
    }
}

export async function getModuleSampleSummaryAction(
    partnerId: string,
    moduleSlug: string,
): Promise<{ success: boolean; summary?: ModuleSampleSummary; error?: string }> {
    try {
        const pmRes = await getPartnerModuleAction(partnerId, moduleSlug);
        if (!pmRes.success || !pmRes.data) {
            return {
                success: true,
                summary: {
                    moduleSlug,
                    enabled: false,
                    total: 0,
                    sampleNames: [],
                },
            };
        }
        const moduleId = pmRes.data.partnerModule.id;
        const itemsRes = await getModuleItemsAction(partnerId, moduleId, {
            isActive: true,
            pageSize: 3,
            // Firestore's orderBy silently excludes docs missing the field,
            // so using 'updatedAt' drops older seeded items (the .count()
            // call below would return 0 even when items exist). 'sortOrder'
            // is set at item creation and is reliably present.
            sortBy: 'sortOrder',
            sortOrder: 'asc',
        });
        if (!itemsRes.success || !itemsRes.data) {
            return {
                success: true,
                summary: {
                    moduleSlug,
                    enabled: true,
                    total: 0,
                    sampleNames: [],
                },
            };
        }
        const items = itemsRes.data.items ?? [];
        const sampleNames = items.map((i) => i.name).filter(Boolean).slice(0, 3);
        const lastUpdatedAt = items
            .map((i) => i.updatedAt || i.createdAt)
            .filter((t): t is string => typeof t === 'string')
            .sort()
            .at(-1);
        return {
            success: true,
            summary: {
                moduleSlug,
                enabled: true,
                total: itemsRes.data.total ?? 0,
                sampleNames,
                lastUpdatedAt,
            },
        };
    } catch (err: any) {
        console.error('[test-chat] getModuleSampleSummaryAction failed:', err);
        return { success: false, error: err?.message ?? 'unknown' };
    }
}
