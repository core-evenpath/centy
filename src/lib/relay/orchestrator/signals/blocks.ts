import 'server-only';

// ── Partner block prefs signal ────────────────────────────────────────
//
// Loads `partners/{pid}/relayConfig/blocks` — the partner's per-block
// overrides (visible / hidden, custom labels, sort order). Empty
// subcollection is treated as permissive downstream: the policy layer
// skips the partner filter when `hasPrefs === false`.

import { db } from '@/lib/firebase-admin';
import { ALL_BLOCKS_DATA, type ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import type { Engine, BlockTag } from '@/lib/relay/engine-types';
import type { BlocksSignal, PartnerBlockPref } from '../types';

function blockMatchesEngine(
  blockId: string,
  engine: Engine,
): boolean {
  const entry = ALL_BLOCKS_DATA.find((b) => b.id === blockId) as
    | (ServerBlockData & { engines?: BlockTag[] })
    | undefined;
  if (!entry) return true; // unknown block id — leave for downstream to handle
  const tags = entry.engines;
  // Untagged blocks pass through (non-booking verticals are untagged in M04).
  if (!tags || tags.length === 0) return true;
  return tags.includes(engine) || tags.includes('shared');
}

export async function loadBlocksSignal(
  partnerId: string,
  activeEngine: Engine | null = null,
): Promise<BlocksSignal> {
  const prefs: Record<string, PartnerBlockPref> = {};
  let hasPrefs = false;

  try {
    const snap = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('blocks')
      .collection('entries')
      .get();

    // Many partner-setups store each block pref as a doc directly under
    // `partners/{pid}/relayConfig/blocks` (the collection pattern used
    // by `relay-block-actions.ts`). Fall back to that path when the
    // nested `entries` subcollection is empty.
    let docs = snap.docs;
    if (docs.length === 0) {
      const flatSnap = await db
        .collection('partners')
        .doc(partnerId)
        .collection('relayConfig')
        .get();
      docs = flatSnap.docs.filter((d) => d.id !== 'flowDefinition');
    }

    for (const doc of docs) {
      const data = doc.data();
      const blockId = (data?.blockId as string | undefined) ?? doc.id;
      if (!blockId || blockId === 'flowDefinition') continue;
      hasPrefs = true;
      prefs[blockId] = {
        blockId,
        isVisible: data?.isVisible !== false,
        customLabel: data?.customLabel,
        customDescription: data?.customDescription,
        sortOrder:
          typeof data?.sortOrder === 'number' ? data.sortOrder : 999,
      };
    }
  } catch {
    /* non-fatal */
  }

  let visibleBlockIds = Object.values(prefs)
    .filter((p) => p.isVisible)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((p) => p.blockId);

  // M12: engine scoping. When an active engine is resolved, drop any
  // visible block that's tagged for a different engine (blocks tagged
  // 'shared' and untagged blocks pass through).
  //
  // P3.M05.1: engine-null case is now fail-closed. Partners whose
  // engine resolution yields null (engines array empty) see no blocks,
  // not the full catalog. Since Phase 3 invariant says no production
  // partners lack engines, this is a dormant runtime change; its value
  // is removing a silently-permissive branch so future bugs fail loud.
  if (activeEngine) {
    visibleBlockIds = visibleBlockIds.filter((id) =>
      blockMatchesEngine(id, activeEngine),
    );
  } else {
    visibleBlockIds = [];
  }

  return { prefs, visibleBlockIds, hasPrefs };
}
