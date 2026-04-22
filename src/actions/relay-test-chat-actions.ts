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
            sortBy: 'updatedAt',
            sortOrder: 'desc',
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
