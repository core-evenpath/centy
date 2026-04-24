'use server';

// ── Relay schema reads (PR E6) ──────────────────────────────────────
//
// Server actions for the Relay schema viewer at /admin/relay/data/[slug].
// Read-only surface that fetches the live schema from the dedicated
// `relaySchemas` collection.
//
// Write-side actions (edit schema fields, add fields, rename etc.)
// are intentionally deferred — Relay schemas are infra-level, rarely
// edited, and the block registry's `reads[]` is the source-of-truth
// driver. Adding mutation actions here without the matching
// reads[]-aware validation story would let admins drift the two apart.

import { db as adminDb } from '@/lib/firebase-admin';
import type { SystemModule } from '@/lib/modules/types';

export interface GetRelaySchemaResult {
  success: boolean;
  data?: SystemModule;
  error?: string;
}

/**
 * Fetch a Relay schema doc by slug. The migration (PR E2) writes
 * relaySchemas/{slug} with slug-as-doc-id, so direct .doc().get()
 * is the primary lookup path. Returns the full SystemModule shape
 * so downstream UI can reuse the same renderers as /admin/modules.
 */
export async function getRelaySchemaBySlugAction(
  slug: string,
): Promise<GetRelaySchemaResult> {
  try {
    const doc = await adminDb.collection('relaySchemas').doc(slug).get();
    if (!doc.exists) {
      return {
        success: false,
        error: `No relaySchemas doc with slug='${slug}'. Run the schema migration first.`,
      };
    }
    return {
      success: true,
      data: { id: doc.id, ...doc.data() } as SystemModule,
    };
  } catch (err: any) {
    console.error('[relay-schema-read] failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}
