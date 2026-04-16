import 'server-only';

// ── Partner block prefs signal ────────────────────────────────────────
//
// Loads `partners/{pid}/relayConfig/blocks` — the partner's per-block
// overrides (visible / hidden, custom labels, sort order). Empty
// subcollection is treated as permissive downstream: the policy layer
// skips the partner filter when `hasPrefs === false`.

import { db } from '@/lib/firebase-admin';
import type { BlocksSignal, PartnerBlockPref } from '../types';

export async function loadBlocksSignal(
  partnerId: string,
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

  const visibleBlockIds = Object.values(prefs)
    .filter((p) => p.isVisible)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((p) => p.blockId);

  return { prefs, visibleBlockIds, hasPrefs };
}
