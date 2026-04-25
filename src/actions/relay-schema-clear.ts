'use server';

// ── Clear all Relay schemas (PR-fix-4) ──────────────────────────────
//
// Destructive bulk reset. Deletes every doc in `relaySchemas` so an
// admin can start fresh — useful when:
//   - Block registry refactor leaves orphan slugs behind
//   - Schemas have drifted from many enrichment runs and admin wants
//     a clean baseline
//   - Recovering from a bad state during testing
//
// After running, partner test-chat falls back to design samples for
// every block (since no schemas exist). Admin should re-run
// "Generate + Enrich" per vertical to rebuild.
//
// Returns a list of deleted slugs so the UI can confirm the reset
// landed and surface them in a result panel.

import { db as adminDb } from '@/lib/firebase-admin';

export interface ClearSchemasResult {
  success: boolean;
  deleted: number;
  deletedSlugs: string[];
  error?: string;
}

const BATCH_SIZE = 400;

export async function clearAllRelaySchemasAction(): Promise<ClearSchemasResult> {
  try {
    const snap = await adminDb.collection('relaySchemas').get();
    if (snap.empty) {
      return { success: true, deleted: 0, deletedSlugs: [] };
    }

    const docs = snap.docs;
    const deletedSlugs: string[] = [];

    // Firestore caps batch ops at 500. 400 leaves headroom for any
    // future enrichment writes admin might trigger by accident
    // mid-clear.
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);
      for (const doc of chunk) {
        batch.delete(doc.ref);
        deletedSlugs.push(doc.id);
      }
      await batch.commit();
    }

    return {
      success: true,
      deleted: deletedSlugs.length,
      deletedSlugs,
    };
  } catch (err: any) {
    console.error('[relay-schema-clear] failed:', err);
    return {
      success: false,
      deleted: 0,
      deletedSlugs: [],
      error: err?.message ?? 'unknown',
    };
  }
}
