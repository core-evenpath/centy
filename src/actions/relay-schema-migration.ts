'use server';

// ── Relay schema migration (PR E2) ─────────────────────────────────────
//
// One-shot, idempotent copy from `systemModules` (shared platform +
// Relay storage today) into `relaySchemas` (dedicated Relay-only
// storage, introduced here). After PR E4 retires the `systemModules/
// moduleItems` doc entirely, this file can be removed.
//
// Scope today: the block registry only references `moduleItems` as a
// Relay-bound slug (57 blocks bind it). Migration copies that one doc
// to `relaySchemas/items` — dropping the "module" prefix since
// "relay" is already in the collection name.
//
// Invariants:
//   - Idempotent: re-running overwrites the target with the latest
//     source. Click the admin button any time during the cutover
//     window to re-sync.
//   - Read-only source: never mutates systemModules.
//   - No dual-write. PR E4 will retire the source doc; until then the
//     partner + admin write paths still live on systemModules.
//   - Returns a summary the admin UI can toast.
//
// Slug renames live here so every consumer agrees on what got copied
// where. When PR E3 updates the block registry + analytics action to
// read from relaySchemas, it will also switch block.module values
// from 'moduleItems' → 'items' using this same table.

import { db as adminDb } from '@/lib/firebase-admin';

/**
 * Mapping from legacy `systemModules` slug → new `relaySchemas` slug.
 * Single source of truth — PR E3 imports this too when it switches
 * the block registry over.
 */
export const RELAY_SCHEMA_SLUG_MAP: Record<string, string> = {
  moduleItems: 'items',
};

export interface RelaySchemaMigrationResult {
  success: boolean;
  migrated: Array<{
    sourceSlug: string;
    targetSlug: string;
    sourceDocId: string;
    schemaFieldCount: number;
  }>;
  skipped: Array<{ sourceSlug: string; reason: string }>;
  error?: string;
}

export async function migrateSystemModulesToRelaySchemasAction(): Promise<RelaySchemaMigrationResult> {
  const migrated: RelaySchemaMigrationResult['migrated'] = [];
  const skipped: RelaySchemaMigrationResult['skipped'] = [];

  try {
    for (const [sourceSlug, targetSlug] of Object.entries(RELAY_SCHEMA_SLUG_MAP)) {
      // Find the source doc by slug. `systemModules` uses an auto-id
      // doc with slug as a field (not as the doc id), so we query.
      const snap = await adminDb
        .collection('systemModules')
        .where('slug', '==', sourceSlug)
        .limit(1)
        .get();

      if (snap.empty) {
        skipped.push({
          sourceSlug,
          reason: `No systemModules doc with slug='${sourceSlug}' found.`,
        });
        continue;
      }

      const sourceDoc = snap.docs[0];
      const sourceData = sourceDoc.data() || {};

      // Count schema fields for the result summary. Shape mirrors the
      // `systemModule.schema.fields[]` structure.
      const rawFields = sourceData.schema?.fields;
      const schemaFieldCount = Array.isArray(rawFields) ? rawFields.length : 0;

      // Write to relaySchemas/{targetSlug}. Use targetSlug as the doc
      // id (not auto-id) so callers can .doc(slug).get() directly —
      // partner + analytics paths in PR E3/E4 both need slug-keyed
      // lookup. Overwrite is intentional — idempotency guarantee.
      await adminDb
        .collection('relaySchemas')
        .doc(targetSlug)
        .set(
          {
            ...sourceData,
            // Overwrite slug to reflect the new name. Keep everything
            // else (schema, versions, migrations, settings) verbatim.
            slug: targetSlug,
            // Track provenance so we can debug which systemModules
            // doc each relaySchema originated from.
            migratedFromSystemModuleId: sourceDoc.id,
            migratedFromSystemModuleSlug: sourceSlug,
            migratedAt: new Date().toISOString(),
          },
          { merge: false },
        );

      migrated.push({
        sourceSlug,
        targetSlug,
        sourceDocId: sourceDoc.id,
        schemaFieldCount,
      });
    }

    return { success: true, migrated, skipped };
  } catch (err: any) {
    console.error('[relay-schema-migration] failed:', err);
    return {
      success: false,
      migrated,
      skipped,
      error: err?.message ?? 'unknown',
    };
  }
}

// ── PR E4: partner businessModules slug backfill ─────────────────────
//
// Idempotent scan of every partner's `businessModules` subcollection.
// Any doc still carrying the pre-migration legacy slug (e.g.
// `moduleSlug: 'moduleItems'`) is rewritten to the new target slug
// (`'items'`) from RELAY_SCHEMA_SLUG_MAP. Runs a single
// collection-group write batch per slug rename.
//
// getSystemModuleAction already normalises legacy slugs at read-time,
// so this backfill is cosmetic — but it closes out the migration so
// PR E5+ and all downstream consumers see only one canonical slug.

export interface RelaySchemaBackfillResult {
  success: boolean;
  renamed: Array<{ sourceSlug: string; targetSlug: string; docCount: number }>;
  error?: string;
}

export async function backfillPartnerModuleSlugsAction(): Promise<RelaySchemaBackfillResult> {
  const renamed: RelaySchemaBackfillResult['renamed'] = [];
  try {
    for (const [sourceSlug, targetSlug] of Object.entries(RELAY_SCHEMA_SLUG_MAP)) {
      // collectionGroup walks every partner's businessModules
      // subcollection in a single query.
      const snap = await adminDb
        .collectionGroup('businessModules')
        .where('moduleSlug', '==', sourceSlug)
        .get();

      if (snap.empty) {
        renamed.push({ sourceSlug, targetSlug, docCount: 0 });
        continue;
      }

      // Batch writes in chunks of 400 to stay under Firestore's 500-op
      // limit with margin.
      const docs = snap.docs;
      let written = 0;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = adminDb.batch();
        const chunk = docs.slice(i, i + 400);
        for (const doc of chunk) {
          batch.update(doc.ref, {
            moduleSlug: targetSlug,
            slugBackfilledFrom: sourceSlug,
            slugBackfilledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();
        written += chunk.length;
      }

      renamed.push({ sourceSlug, targetSlug, docCount: written });
    }
    return { success: true, renamed };
  } catch (err: any) {
    console.error('[relay-schema-migration] backfill failed:', err);
    return {
      success: false,
      renamed,
      error: err?.message ?? 'unknown',
    };
  }
}

// ── PR E4: delete the legacy systemModules Relay doc ─────────────────
//
// Destructive. Only safe once (a) the schema migration has run so
// relaySchemas/{targetSlug} exists, and (b) the partner backfill has
// run so no partner `businessModules.moduleSlug` points at the old
// slug anymore.
//
// The action checks both preconditions and refuses to delete unless
// they hold, to prevent accidentally breaking partner reads.

export interface RelaySchemaCleanupResult {
  success: boolean;
  deleted: Array<{ sourceSlug: string; docId: string }>;
  error?: string;
}

export async function deleteLegacyRelaySystemModulesAction(): Promise<RelaySchemaCleanupResult> {
  const deleted: RelaySchemaCleanupResult['deleted'] = [];
  try {
    for (const [sourceSlug, targetSlug] of Object.entries(RELAY_SCHEMA_SLUG_MAP)) {
      // Precondition 1: relaySchemas/{targetSlug} exists.
      const relayDoc = await adminDb
        .collection('relaySchemas')
        .doc(targetSlug)
        .get();
      if (!relayDoc.exists) {
        return {
          success: false,
          deleted,
          error: `relaySchemas/${targetSlug} is missing. Run the schema migration first.`,
        };
      }

      // Precondition 2: no partner still references the source slug.
      const stragglers = await adminDb
        .collectionGroup('businessModules')
        .where('moduleSlug', '==', sourceSlug)
        .limit(1)
        .get();
      if (!stragglers.empty) {
        return {
          success: false,
          deleted,
          error: `At least one partner businessModule still has moduleSlug='${sourceSlug}'. Run the partner backfill first.`,
        };
      }

      // Find and delete the legacy systemModules doc by slug.
      const src = await adminDb
        .collection('systemModules')
        .where('slug', '==', sourceSlug)
        .limit(1)
        .get();
      if (src.empty) {
        // Already deleted / never existed — treat as success.
        continue;
      }
      const doc = src.docs[0];
      await doc.ref.delete();
      deleted.push({ sourceSlug, docId: doc.id });
    }
    return { success: true, deleted };
  } catch (err: any) {
    console.error('[relay-schema-migration] cleanup failed:', err);
    return {
      success: false,
      deleted,
      error: err?.message ?? 'unknown',
    };
  }
}
