'use server';

/**
 * Content Studio — refresh partner state from existing data.
 *
 * Partners set up before Content Studio shipped already have modules with
 * items and populated profiles, but `partners/{pid}/contentStudio/state`
 * doesn't exist yet — so readiness reads as 0%. This action scans the
 * partner's profile + modules and backfills the state doc so the UI
 * reflects reality on first view (and on explicit refresh).
 *
 * Kept in its own file so the detection path (zero AI calls, only Firestore
 * reads) can be reasoned about independently from the main
 * content-studio-actions surface.
 */

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import {
    buildSnapshot,
    detectAllBlockReadiness,
} from '@/lib/content-studio/detect-readiness';
import {
    getContentStudioConfigAction,
    getPartnerVerticalIdAction,
} from '@/actions/content-studio-actions';
import { getPartnerModulesAction } from '@/actions/modules-actions';

export async function refreshPartnerContentStudioStateAction(partnerId: string): Promise<{
    success: boolean;
    readyCount?: number;
    totalBlocks?: number;
    verticalId?: string;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        // 1. Resolve vertical.
        const vRes = await getPartnerVerticalIdAction(partnerId);
        if (!vRes.success || !vRes.verticalId) {
            return { success: false, error: vRes.error || 'Could not resolve vertical' };
        }
        const verticalId = vRes.verticalId;

        // 2. Load the Content Studio config (generates lazily on first call).
        const cfgRes = await getContentStudioConfigAction(verticalId);
        if (!cfgRes.success || !cfgRes.config) {
            return { success: false, error: cfgRes.error || 'No Content Studio config' };
        }
        const config = cfgRes.config;

        // Nothing to refresh for stub verticals.
        if (config.blocks.length === 0) {
            return {
                success: true,
                readyCount: 0,
                totalBlocks: 0,
                verticalId,
            };
        }

        // 3. Gather partner data in parallel.
        const [modulesRes, partnerDoc] = await Promise.all([
            getPartnerModulesAction(partnerId),
            adminDb.collection('partners').doc(partnerId).get(),
        ]);

        const partnerModules = modulesRes.success ? modulesRes.data || [] : [];
        const moduleItemCounts: Record<string, number> = {};
        for (const pm of partnerModules) {
            const count =
                typeof pm.activeItemCount === 'number'
                    ? pm.activeItemCount
                    : typeof pm.itemCount === 'number'
                      ? pm.itemCount
                      : 0;
            moduleItemCounts[pm.moduleSlug] = count;
        }

        const partnerData = partnerDoc.exists
            ? (partnerDoc.data() as Record<string, any>)
            : undefined;

        // 4. Detect readiness.
        const snapshot = buildSnapshot(partnerData, moduleItemCounts);
        const nowIso = new Date().toISOString();
        const { blockStates, readyCount } = detectAllBlockReadiness(
            config.blocks,
            snapshot,
            nowIso
        );

        // 5. Persist (merge so we don't clobber manually-set flags the
        // partner may have toggled via the UI).
        await adminDb
            .collection(`partners/${partnerId}/contentStudio`)
            .doc('state')
            .set(
                {
                    partnerId,
                    verticalId,
                    blockStates,
                    lastViewedAt: nowIso,
                    refreshedAt: nowIso,
                },
                { merge: true }
            );

        revalidatePath('/partner/relay/datamap');
        return {
            success: true,
            readyCount,
            totalBlocks: config.blocks.length,
            verticalId,
        };
    } catch (error: any) {
        console.error('[content-studio] refresh failed:', error);
        return { success: false, error: error?.message || 'Failed to refresh state' };
    }
}
