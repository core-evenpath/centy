'use server';

// Admin reset — server actions.
//
// MR03 scope: dry-run preview only. Execute lands in MR04 building
// on this file.
//
// Every action:
//   1. Looks up the collection via the MR01 allow-list (unknown → reject)
//   2. Validates the filter via MR02 (invalid → reject)
//   3. Builds the Firestore query from the filter
//   4. Counts matching docs + fetches sample ids (no writes in dry-run)
//   5. Writes a systemResetAudit entry (including dry-runs)
//   6. Returns result
//
// Env gate for unscoped requests lives in MR04 (executeReset); dry-run
// accepts unscoped=true because previewing what would happen is safe.
// The UI surfaces a warning in that case.

import { db as adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  getResettableCollection,
  type ResetVerb,
  type ResettableCollection,
} from '@/lib/admin/reset/resettable-collections';
import {
  validateFilterForCollection,
  type ResetFilter,
} from '@/lib/admin/reset/filter-model';

export interface DryRunResult {
  ok: true;
  collectionId: string;
  firestorePath: string;
  verb: ResetVerb;
  filter: ResetFilter;
  affectedCount: number;
  sampleIds: string[];
  warnings: string[];
  auditId: string;
}

export interface ResetError {
  ok: false;
  error: string;
  details?: string[];
}

const SAMPLE_LIMIT = 10;
const PREVIEW_SESSION_PREFIX = 'preview_';

// ── Firestore path builder ─────────────────────────────────────────
//
// Builds the concrete Firestore path from the collection template +
// filter. Collection templates with `{partnerId}` or `{moduleId}`
// placeholders get substituted; the caller must have validated that
// the filter provides the needed fields (MR02 handles this).
//
// Returns { path, subcollectionPattern } where subcollectionPattern
// is the last path segment for use in queries.
function buildFirestorePath(
  collection: ResettableCollection,
  filter: ResetFilter,
): { path: string; isSubcollection: boolean } {
  let path = collection.collection;
  if (path.includes('{partnerId}')) {
    if (!filter.partnerId) {
      // Should be impossible if MR02 validation ran first; defensive.
      throw new Error(`collection ${collection.id} needs partnerId for path`);
    }
    path = path.replace('{partnerId}', filter.partnerId);
  }
  if (path.includes('{moduleId}')) {
    if (!filter.moduleSlug) {
      throw new Error(`collection ${collection.id} needs moduleSlug for path`);
    }
    // Reset semantics: filter.moduleSlug is the SEMANTIC slug; the
    // Firestore {moduleId} is the partnerModuleId. Look up the
    // assignment to resolve — lives in a helper for readability.
    path = path.replace('{moduleId}', filter.moduleSlug);
  }
  const isSubcollection = collection.collection.includes('{');
  return { path, isSubcollection };
}

// ── Partner-module-id resolution ───────────────────────────────────
//
// partner-module-items collection path is
// `partners/{partnerId}/businessModules/{moduleId}/items` where
// {moduleId} is the partner's partnerModuleId, NOT the system module
// slug. Resolve the slug → partnerModuleId lookup.
async function resolvePartnerModuleId(
  partnerId: string,
  moduleSlug: string,
): Promise<string | null> {
  try {
    const systemSnap = await adminDb
      .collection('systemModules')
      .where('slug', '==', moduleSlug)
      .limit(1)
      .get();
    if (systemSnap.empty) return null;
    const systemModuleId = systemSnap.docs[0].id;
    const assignSnap = await adminDb
      .collection('moduleAssignments')
      .where('partnerId', '==', partnerId)
      .where('systemModuleId', '==', systemModuleId)
      .limit(1)
      .get();
    if (assignSnap.empty) return null;
    const data = assignSnap.docs[0].data() as { partnerModuleId?: string };
    return data.partnerModuleId ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[admin-reset] resolvePartnerModuleId failed', { partnerId, moduleSlug, err });
    return null;
  }
}

// ── Query builder ──────────────────────────────────────────────────

interface MatchingDocs {
  ids: string[];  // all matching ids
  sampleIds: string[];  // first N for display
  warnings: string[];
}

async function findMatchingDocs(
  collection: ResettableCollection,
  filter: ResetFilter,
): Promise<MatchingDocs> {
  const warnings: string[] = [];
  const ids: string[] = [];

  // Collection-specific query shapes. Each branch resolves the
  // concrete Firestore path + filter predicates.
  switch (collection.id) {
    case 'relay-engine-health': {
      // relayEngineHealth docs are keyed `${partnerId}_${engine}`.
      // Filter by partnerId and optionally engine.
      if (!filter.partnerId && !filter.unscoped) return { ids: [], sampleIds: [], warnings };
      let query = adminDb.collection('relayEngineHealth').where('partnerId', '==', filter.partnerId ?? null);
      if (filter.unscoped) {
        query = adminDb.collection('relayEngineHealth') as unknown as typeof query;
      }
      if (filter.engine) {
        query = query.where('engine', '==', filter.engine);
      }
      const snap = await query.get();
      for (const d of snap.docs) ids.push(d.id);
      break;
    }
    case 'relay-block-configs': {
      if (!filter.partnerId) return { ids: [], sampleIds: [], warnings };
      const snap = await adminDb
        .collection('partners')
        .doc(filter.partnerId)
        .collection('relayConfig')
        .get();
      for (const d of snap.docs) {
        // Skip flowDefinition — that's a separate concern, not a
        // block pref.
        if (d.id === 'flowDefinition') continue;
        ids.push(d.id);
      }
      break;
    }
    case 'relay-sessions': {
      if (!filter.partnerId && !filter.unscoped) return { ids: [], sampleIds: [], warnings };
      let query = adminDb.collection('relaySessions').where('partnerId', '==', filter.partnerId ?? null);
      if (filter.unscoped) {
        query = adminDb.collection('relaySessions') as unknown as typeof query;
      }
      // Session docs don't have a preview_ flag; conversationId is
      // stored on the doc. This query pulls all; MR03 dry-run returns
      // count + sample ids.
      const snap = await query.limit(1000).get();
      for (const d of snap.docs) {
        ids.push(d.id);
      }
      // Live-session warning: if dateRangeFrom is within last 24h,
      // caller might be about to wipe an active conversation.
      if (filter.dateRangeFrom) {
        const fromTime = new Date(filter.dateRangeFrom).getTime();
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (fromTime > dayAgo) {
          warnings.push('Date range includes the last 24 hours — may affect live sessions');
        }
      }
      break;
    }
    case 'preview-sessions': {
      // Sandbox sessions have conversationId starting with preview_.
      // The id of the doc also starts with preview_ by convention in
      // M13 runner. Fetch + filter.
      const snap = await adminDb
        .collection('relaySessions')
        .limit(1000)
        .get();
      for (const d of snap.docs) {
        const data = d.data() as { conversationId?: string };
        const cid = data.conversationId ?? d.id;
        if (!cid.startsWith(PREVIEW_SESSION_PREFIX)) continue;
        if (filter.partnerId) {
          const docData = data as { partnerId?: string };
          if (docData.partnerId !== filter.partnerId) continue;
        }
        ids.push(d.id);
      }
      break;
    }
    case 'partner-module-items': {
      if (!filter.partnerId || !filter.moduleSlug) {
        return { ids: [], sampleIds: [], warnings };
      }
      const partnerModuleId = await resolvePartnerModuleId(filter.partnerId, filter.moduleSlug);
      if (!partnerModuleId) {
        warnings.push(
          `Partner ${filter.partnerId} has no assignment for module ${filter.moduleSlug} — nothing to reset`,
        );
        break;
      }
      const snap = await adminDb
        .collection('partners')
        .doc(filter.partnerId)
        .collection('businessModules')
        .doc(partnerModuleId)
        .collection('items')
        .get();
      for (const d of snap.docs) ids.push(d.id);
      break;
    }
    default: {
      // Defensive: any new allow-list entry without a query branch
      // surfaces a clear error rather than silently returning 0.
      throw new Error(`findMatchingDocs: no query branch for collection ${collection.id}`);
    }
  }

  const sampleIds = ids.slice(0, SAMPLE_LIMIT);
  return { ids, sampleIds, warnings };
}

// ── Audit write ─────────────────────────────────────────────────

interface AuditEntryInput {
  collectionId: string;
  firestorePath: string;
  verb: ResetVerb | 'dry-run';
  filter: ResetFilter;
  affectedCount: number;
  sampleIds: string[];
  startedAt: number;
  completedAt: number;
  confirmedDryRunId?: string;
}

async function writeAuditEntry(input: AuditEntryInput): Promise<string> {
  const docRef = adminDb.collection('systemResetAudit').doc();
  await docRef.set({
    id: docRef.id,
    collectionId: input.collectionId,
    firestorePath: input.firestorePath,
    verb: input.verb,
    filter: input.filter,
    affectedCount: input.affectedCount,
    sampleIds: input.sampleIds,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    confirmedDryRunId: input.confirmedDryRunId ?? null,
    triggeredBy: 'admin-ui', // MR04 may widen to per-user identity
    environment: process.env.NODE_ENV ?? 'unknown',
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Dry-run preview: compute what a reset would affect without any
 * writes to the target collection. Writes one `systemResetAudit`
 * entry with `verb: 'dry-run'`.
 */
export async function previewReset(
  collectionId: string,
  filter: ResetFilter,
): Promise<DryRunResult | ResetError> {
  const collection = getResettableCollection(collectionId);
  if (!collection) {
    return { ok: false, error: `Unknown collection id: ${collectionId}` };
  }

  const validation = validateFilterForCollection(collection, filter);
  if (!validation.valid) {
    return { ok: false, error: 'Filter invalid', details: validation.errors };
  }

  const startedAt = Date.now();
  try {
    const { ids, sampleIds, warnings } = await findMatchingDocs(collection, filter);
    const { path } = buildFirestorePath(collection, filter);
    const completedAt = Date.now();

    const auditId = await writeAuditEntry({
      collectionId,
      firestorePath: path,
      verb: 'dry-run',
      filter,
      affectedCount: ids.length,
      sampleIds,
      startedAt,
      completedAt,
    });

    return {
      ok: true,
      collectionId,
      firestorePath: path,
      verb: collection.verb,
      filter,
      affectedCount: ids.length,
      sampleIds,
      warnings,
      auditId,
    };
  } catch (err) {
    return {
      ok: false,
      error: 'Preview failed',
      details: [err instanceof Error ? err.message : String(err)],
    };
  }
}
