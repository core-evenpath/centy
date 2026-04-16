import 'server-only';

// ── Datamap readiness signal ──────────────────────────────────────────
//
// Loads `partners/{pid}/contentStudio/state`, which the Content Studio
// page maintains. Each key in `blockStates` is a blockId whose value
// tells us whether the partner has wired data for that block (`ready`)
// or whether it's still empty (`dark`).

import { db } from '@/lib/firebase-admin';
import type { DatamapSignal } from '../types';

interface RawBlockState {
  dataProvided?: unknown;
  autoConfigured?: unknown;
  sourceType?: string;
}

function isTruthy(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

export async function loadDatamapSignal(
  partnerId: string,
): Promise<DatamapSignal> {
  const readyBlockIds: string[] = [];
  const darkBlockIds: string[] = [];
  let hasState = false;

  try {
    const doc = await db
      .collection('partners')
      .doc(partnerId)
      .collection('contentStudio')
      .doc('state')
      .get();
    if (!doc.exists) {
      return { readyBlockIds, darkBlockIds, hasState };
    }
    const data = doc.data() as { blockStates?: Record<string, RawBlockState> };
    const blockStates = data.blockStates ?? {};
    hasState = Object.keys(blockStates).length > 0;

    for (const [blockId, state] of Object.entries(blockStates)) {
      if (isTruthy(state.dataProvided) || isTruthy(state.autoConfigured)) {
        readyBlockIds.push(blockId);
      } else {
        darkBlockIds.push(blockId);
      }
    }
  } catch {
    /* non-fatal */
  }

  return { readyBlockIds, darkBlockIds, hasState };
}
