'use server';

// ── Single-axis lookups for the admin modules view ──────────────────────
//
// Smaller helpers used by the UI when navigating from a dark block to
// its module (or the reverse). Kept separate from the heavier
// `getRelayModuleAnalyticsAction` so they don't pull unused Firestore
// queries.

import { db } from '@/lib/firebase-admin';
import {
  ALL_BLOCKS_DATA,
  ALL_SUB_VERTICALS_DATA,
  SHARED_BLOCK_IDS_DATA,
} from '@/app/admin/relay/blocks/previews/_registry-data';
import {
  buildBlockVerticalMap,
  type SubVerticalWithIndustry,
} from '@/lib/relay/module-analytics-derive';
import type { SimpleBlockRef } from '@/lib/relay/module-analytics-types';

export interface BlocksForModuleResult {
  success: boolean;
  blocks?: SimpleBlockRef[];
  error?: string;
}

export interface ModuleForBlockResult {
  success: boolean;
  moduleSlug?: string | null;
  module?: { id: string; name: string; slug: string } | null;
  error?: string;
}

export async function getBlocksForModuleAction(
  moduleSlug: string,
): Promise<BlocksForModuleResult> {
  try {
    const verticalMap = buildBlockVerticalMap(
      ALL_SUB_VERTICALS_DATA as unknown as SubVerticalWithIndustry[],
      SHARED_BLOCK_IDS_DATA,
    );

    const blocks: SimpleBlockRef[] = ALL_BLOCKS_DATA.filter(
      (b) => b.module === moduleSlug,
    ).map((b) => ({
      blockId: b.id,
      blockLabel: b.label,
      verticals: verticalMap.get(b.id) ?? [],
    }));

    return { success: true, blocks };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function getModuleForBlockAction(
  blockId: string,
): Promise<ModuleForBlockResult> {
  try {
    const block = ALL_BLOCKS_DATA.find((b) => b.id === blockId);
    if (!block) return { success: true, moduleSlug: null, module: null };
    const moduleSlug = block.module ?? null;
    if (!moduleSlug) {
      return { success: true, moduleSlug: null, module: null };
    }

    const snap = await db
      .collection('systemModules')
      .where('slug', '==', moduleSlug)
      .limit(1)
      .get();

    if (snap.empty) return { success: true, moduleSlug, module: null };

    const doc = snap.docs[0];
    return {
      success: true,
      moduleSlug,
      module: { id: doc.id, name: doc.data().name || moduleSlug, slug: moduleSlug },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
