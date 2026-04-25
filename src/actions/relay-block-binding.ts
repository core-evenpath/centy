'use server';

// ── Block ↔ schema binding override (PR E11) ────────────────────────
//
// Each block in the registry binds its `(vertical, family)` schema by
// default — that's what `block.module` declares. PR E11 lets admin
// override that per block: a block can be marked unbound, in which
// case it disappears from the schema's consumer list, drift detection
// skips it, and (eventually, follow-up) the partner test-chat falls
// back to the block's design sample instead of fetching module data.
//
// Storage: the existing `relayBlockConfigs/{blockId}` doc gains a
// `bindsSchema?: boolean` field. Default is true (binding is the
// expected case); only an explicit `false` unbinds. Doc absence is
// also "bound".
//
// Why a Firestore override (not a code-level field on the registry):
// admin needs to flip this at runtime without a deploy.

import { db as adminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export interface SetBindingResult {
  success: boolean;
  bindsSchema: boolean;
  error?: string;
}

/**
 * Persist a per-block binding override. Idempotent. Doesn't validate
 * that `blockId` exists in the registry — admin tooling owns that.
 *
 * Uses set with merge so we don't disturb other fields the
 * /admin/relay/blocks tooling writes (status, etc).
 */
export async function setBlockSchemaBindingAction(
  blockId: string,
  bindsSchema: boolean,
): Promise<SetBindingResult> {
  try {
    await adminDb
      .collection('relayBlockConfigs')
      .doc(blockId)
      .set(
        {
          id: blockId,
          bindsSchema,
          bindsSchemaUpdatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

    // Revalidate so the schema viewer (server-rendered) picks up the
    // new binding state on the next request.
    revalidatePath('/admin/relay/data');
    revalidatePath('/admin/relay/data/[slug]', 'page');

    return { success: true, bindsSchema };
  } catch (err: any) {
    console.error('[relay-block-binding] failed:', err);
    return {
      success: false,
      bindsSchema,
      error: err?.message ?? 'unknown',
    };
  }
}

/**
 * Bulk read: returns the bindsSchema state for every doc currently
 * in `relayBlockConfigs`. Callers (analytics action, schema viewer)
 * treat absent block ids as bound.
 *
 * Returned shape is a Map<blockId, boolean>. Inspect with .get(id) —
 * `undefined` means "not in the override collection at all", which
 * defaults to bound.
 */
export async function loadBlockSchemaBindingsAction(): Promise<{
  success: boolean;
  bindings: Record<string, boolean>;
  error?: string;
}> {
  try {
    const snap = await adminDb.collection('relayBlockConfigs').get();
    const bindings: Record<string, boolean> = {};
    for (const doc of snap.docs) {
      const data = doc.data();
      // Only record explicit overrides — absent or === true means
      // bound (the default). Recording absent-as-true would force
      // every doc into the map, which adds noise without value.
      if (data.bindsSchema === false) {
        bindings[doc.id] = false;
      }
    }
    return { success: true, bindings };
  } catch (err: any) {
    console.error('[relay-block-binding] load failed:', err);
    return {
      success: false,
      bindings: {},
      error: err?.message ?? 'unknown',
    };
  }
}
