/**
 * Content Studio — readiness detection (pure logic, no I/O).
 *
 * Given a partner's existing data (profile doc + enabled modules), decide
 * for each Content Studio block whether the partner has enough underlying
 * data for the block to render. Isolated from Firestore so it can be unit
 * tested and reused from any caller.
 */

import type {
    ContentStudioBlockEntry,
    PartnerContentStudioState,
} from '@/lib/types-content-studio';

export type BlockStateEntry = PartnerContentStudioState['blockStates'][string];

export interface PartnerDataSnapshot {
    /** Does the partner have a usable business profile? */
    hasProfile: boolean;
    /** Map of moduleSlug → active item count. */
    moduleItemCounts: Record<string, number>;
}

/**
 * Detect readiness for a single block. Returns the BlockStateEntry that
 * should be persisted to `partners/{pid}/contentStudio/state`.
 */
export function detectBlockReadiness(
    block: ContentStudioBlockEntry,
    snapshot: PartnerDataSnapshot,
    nowIso: string
): BlockStateEntry {
    // Auto-configured blocks (greeting, contact, etc.) are always ready.
    if (block.autoConfigured) {
        return {
            dataProvided: true,
            sourceType: null,
            sourceRef: null,
            itemCount: 0,
            lastUpdatedAt: nowIso,
        };
    }

    // Profile-sourced blocks (company info, contact) light up when the
    // partner has any business identity populated.
    if (block.sourceType === 'profile') {
        return {
            dataProvided: snapshot.hasProfile,
            sourceType: snapshot.hasProfile ? 'profile' : null,
            sourceRef: null,
            itemCount: 0,
            lastUpdatedAt: snapshot.hasProfile ? nowIso : null,
        };
    }

    // Module-dependent blocks (product_card, course_card, etc.) need
    // at least one enabled module with items.
    if (block.moduleDependent) {
        const counts = Object.values(snapshot.moduleItemCounts);
        const total = counts.reduce((sum, n) => sum + (n || 0), 0);
        if (total > 0) {
            return {
                dataProvided: true,
                sourceType: 'module',
                sourceRef: null,
                itemCount: Math.max(...counts, 0),
                lastUpdatedAt: nowIso,
            };
        }
    }

    // Default: not provided yet.
    return {
        dataProvided: false,
        sourceType: null,
        sourceRef: null,
        itemCount: 0,
        lastUpdatedAt: null,
    };
}

/** Convenience wrapper: map over the full block list. */
export function detectAllBlockReadiness(
    blocks: ContentStudioBlockEntry[],
    snapshot: PartnerDataSnapshot,
    nowIso: string
): { blockStates: Record<string, BlockStateEntry>; readyCount: number } {
    const blockStates: Record<string, BlockStateEntry> = {};
    let readyCount = 0;
    for (const block of blocks) {
        const entry = detectBlockReadiness(block, snapshot, nowIso);
        blockStates[block.blockId] = entry;
        if (entry.dataProvided) readyCount++;
    }
    return { blockStates, readyCount };
}

/**
 * Extract a PartnerDataSnapshot from raw partner doc data. Kept here so
 * the heuristic ("what counts as a profile?") lives next to the detection
 * logic it feeds into.
 */
export function buildSnapshot(
    partnerData: Record<string, any> | undefined,
    moduleItemCounts: Record<string, number>
): PartnerDataSnapshot {
    const hasProfile = Boolean(
        partnerData?.businessPersona?.identity?.name ||
            partnerData?.brandName ||
            partnerData?.businessName ||
            partnerData?.name
    );
    return { hasProfile, moduleItemCounts };
}
