'use server';

// Relay Engine Health — Firestore read/write + shadow-mode hook (M07).
//
// Writes `relayEngineHealth/{partnerId}_{engine}` in shadow mode: every
// partner write triggers a recompute, but Health status never blocks a
// save or runtime response in Phase 1. Admin UI (M09) reads via these
// actions, not directly from Firestore.
//
// Cache: 30s TTL, process-local map. Admin page reads get a cache hit
// when the page auto-refreshes faster than TTL (verified in tests).

import { db } from '@/lib/firebase-admin';
import { computeEngineHealth } from '@/lib/relay/health';
import type {
  EngineHealthDoc,
  BlockSnapshot,
  ModuleSnapshot,
  FlowSnapshot,
} from '@/lib/relay/health';
import type { Engine } from '@/lib/relay/engine-types';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';
import type { Partner } from '@/lib/types';
import { getCachedHealth, setCachedHealth } from '@/lib/relay/health-cache';

// Note: cache internals live in `@/lib/relay/health-cache` because this
// file is `'use server'` and Next.js Server Action modules must export
// only async functions.

function cacheKey(partnerId: string, engine: Engine): string {
  return `${partnerId}_${engine}`;
}

// ── Snapshot loaders (M0 — real partner-state resolution) ──────────
//
// These assemble the inputs `computeEngineHealth` needs from three
// sources:
//   1. Static registry — `_registry-data.ts` ALL_BLOCKS_DATA carries
//      block id, stage, engine tags (from M04).
//   2. Global block config — `relayBlockConfigs` Firestore collection
//      carries fields_req + fields_opt when admins have populated it.
//   3. Partner state — `partners/{pid}/relayConfig/{blockId}` docs
//      carry isVisible + fieldBindings (from M14 onboarding + M09
//      Apply-fix writes).
//   4. Module state — `moduleAssignments` + per-module items collection
//      provide item counts and field catalogs for ModuleSnapshot.
//   5. Flow state — `partners/{pid}/relayConfig/flowDefinition`
//      carries stages with blockTypes.
//
// Before M0 these returned stubs — every partner's Health doc was
// "red-no-data." Post-M0 Health reflects real configuration.

import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { getGlobalBlockConfigs } from '@/lib/relay/block-config-service';
import type { BlockTag } from '@/lib/relay/engine-types';

interface PartnerBlockPrefDoc {
  isVisible?: boolean;
  fieldBindings?: Record<string, { moduleSlug?: string; sourceField?: string }>;
}

async function loadPartnerBlockPrefs(
  partnerId: string,
): Promise<Map<string, PartnerBlockPrefDoc>> {
  const out = new Map<string, PartnerBlockPrefDoc>();
  try {
    const snap = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .get();
    for (const doc of snap.docs) {
      // `flowDefinition` is a sibling doc, not a block pref.
      if (doc.id === 'flowDefinition') continue;
      out.set(doc.id, doc.data() as PartnerBlockPrefDoc);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] loadPartnerBlockPrefs failed', { partnerId, err });
  }
  return out;
}

async function loadBlockSnapshots(
  partnerId: string,
  engine: Engine,
): Promise<BlockSnapshot[]> {
  // 1. Engine-scoped block inventory from the static registry.
  const engineBlocks = ALL_BLOCKS_DATA.filter((b) => {
    const tags = (b as typeof b & { engines?: BlockTag[] }).engines;
    if (!tags || tags.length === 0) return false; // untagged blocks ignored
    return tags.includes(engine) || tags.includes('shared');
  });

  // 2. Rich field metadata from `relayBlockConfigs` (when present).
  const globalConfigs = await getGlobalBlockConfigs();
  const configById = new Map(globalConfigs.map((c) => [c.id, c]));

  // 3. Partner-specific pref state.
  const prefs = await loadPartnerBlockPrefs(partnerId);

  const snapshots: BlockSnapshot[] = [];
  for (const block of engineBlocks) {
    const config = configById.get(block.id);
    const pref = prefs.get(block.id);
    const requiredFields = config?.fields_req ?? [];
    const optionalFields = config?.fields_opt ?? [];

    const fieldBindings: BlockSnapshot['fieldBindings'] = {};
    for (const field of requiredFields) {
      const binding = pref?.fieldBindings?.[field];
      fieldBindings[field] = {
        bound: binding !== undefined && binding.sourceField !== undefined,
        // Approximation: if the field has a binding record, assume the
        // source resolves non-empty. Cheaper than round-tripping module
        // items just to confirm; empty-module detection in
        // loadModuleSnapshots catches the "connected but no data" case
        // which is the main false-green we'd miss here.
        resolvedNonEmpty: binding !== undefined && binding.sourceField !== undefined,
        type: 'string',
        sourceField: binding?.sourceField,
      };
    }

    snapshots.push({
      id: block.id,
      engines: (block as typeof block & { engines?: BlockTag[] }).engines,
      stage: block.stage,
      requiredFields,
      optionalFields,
      moduleSlug: (block.module ?? config?.module) ?? null,
      // Enabled when the partner has explicitly set isVisible !== false,
      // OR when the block is 'shared' (auto-enabled for every partner).
      enabled: (pref?.isVisible !== false) && pref !== undefined
        || (block as typeof block & { engines?: BlockTag[] }).engines?.includes('shared') === true,
      fieldBindings,
    });
  }

  return snapshots;
}

async function loadModuleSnapshots(
  partnerId: string,
): Promise<Record<string, ModuleSnapshot>> {
  const out: Record<string, ModuleSnapshot> = {};
  try {
    // Partner's assigned modules.
    const assignSnap = await db
      .collection('moduleAssignments')
      .where('partnerId', '==', partnerId)
      .get();

    for (const assign of assignSnap.docs) {
      const assignData = assign.data() as {
        systemModuleId?: string;
        partnerModuleId?: string;
      };
      if (!assignData.systemModuleId || !assignData.partnerModuleId) continue;

      // System module for schema
      const sysSnap = await db
        .collection('systemModules')
        .doc(assignData.systemModuleId)
        .get();
      if (!sysSnap.exists) continue;
      const sys = sysSnap.data() as {
        slug?: string;
        schema?: { fields?: Array<{ id?: string; name?: string; type?: string }> };
      };
      if (!sys.slug) continue;

      // Count items in partner's module.
      const itemsSnap = await db
        .collection(
          `partners/${partnerId}/businessModules/${assignData.partnerModuleId}/items`,
        )
        .count()
        .get();
      const itemCount = itemsSnap.data().count ?? 0;

      const fieldCatalog = (sys.schema?.fields ?? [])
        .filter((f): f is { id: string; name?: string; type?: string } => typeof f.id === 'string')
        .map((f) => ({
          name: f.id,
          type: mapFieldType(f.type),
        }));

      out[sys.slug] = { slug: sys.slug, itemCount, fieldCatalog };
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] loadModuleSnapshots failed', { partnerId, err });
  }
  return out;
}

function mapFieldType(
  t: string | undefined,
): 'string' | 'number' | 'boolean' | 'array' | 'object' {
  switch (t) {
    case 'number':
    case 'currency':
    case 'duration':
      return 'number';
    case 'toggle':
      return 'boolean';
    case 'multi_select':
    case 'tags':
    case 'image':
    case 'images':
      return 'array';
    default:
      return 'string';
  }
}

async function loadFlowSnapshot(
  partnerId: string,
  _engine: Engine,
): Promise<FlowSnapshot | null> {
  try {
    const doc = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .get();
    if (!doc.exists) return null;
    const data = doc.data() as {
      id?: string;
      stages?: Array<{ id?: string; blockTypes?: string[] }>;
    };
    return {
      flowId: data.id ?? 'partner_flow',
      stages: (data.stages ?? []).map((s) => ({
        stageId: s.id ?? 'unknown',
        blockIds: Array.isArray(s.blockTypes) ? s.blockTypes : [],
      })),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] loadFlowSnapshot failed', { partnerId, err });
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────

export async function recomputeEngineHealth(
  partnerId: string,
  engine: Engine,
): Promise<EngineHealthDoc> {
  const [blocks, modules, flow] = await Promise.all([
    loadBlockSnapshots(partnerId, engine),
    loadModuleSnapshots(partnerId),
    loadFlowSnapshot(partnerId, engine),
  ]);

  const doc = computeEngineHealth({
    partnerId,
    engine,
    blocks,
    modules,
    flow,
  });

  const key = cacheKey(partnerId, engine);

  // Write to Firestore. Admin SDK bypasses the deny rule added in M02.
  try {
    await db.collection('relayEngineHealth').doc(key).set(doc);
  } catch (err) {
    // Shadow mode: never rethrow. Log for operator visibility.
    // eslint-disable-next-line no-console
    console.error('[health] write failed (shadow mode, swallowed)', {
      partnerId,
      engine,
      err,
    });
  }

  // Invalidate stale cache entry and re-seed with fresh value.
  setCachedHealth(partnerId, engine, doc);

  return doc;
}

export async function getEngineHealth(
  partnerId: string,
  engine: Engine,
): Promise<EngineHealthDoc | null> {
  const cached = getCachedHealth(partnerId, engine);
  if (cached) return cached;

  try {
    const snap = await db.collection('relayEngineHealth').doc(cacheKey(partnerId, engine)).get();
    if (!snap.exists) return null;
    const doc = snap.data() as EngineHealthDoc;
    setCachedHealth(partnerId, engine, doc);
    return doc;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] read failed', { partnerId, engine, err });
    return null;
  }
}

export async function getAllPartnerEngineHealth(
  partnerId: string,
): Promise<EngineHealthDoc[]> {
  try {
    const snap = await db
      .collection('relayEngineHealth')
      .where('partnerId', '==', partnerId)
      .get();
    return snap.docs.map((d) => d.data() as EngineHealthDoc);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] list failed', { partnerId, err });
    return [];
  }
}

// M09: dispatch Apply-fix proposals. Only `bind-field` mutates for now;
// the other three kinds return an explicit "not yet implemented" error
// with user-facing next-step guidance so the UI can show a clear message
// rather than silently failing.
export async function applyFixProposal(
  partnerId: string,
  engine: Engine,
  proposal: import('@/lib/relay/health').FixProposal,
): Promise<{ ok: boolean; error?: string; hint?: string }> {
  try {
    switch (proposal.kind) {
      case 'bind-field': {
        const blockId = proposal.blockId;
        const field = proposal.field;
        const moduleSlug = proposal.moduleSlug;
        const sourceField = proposal.sourceField;
        if (!blockId || !field || !moduleSlug || !sourceField) {
          return { ok: false, error: 'bind-field proposal missing required fields' };
        }
        // Store the field binding on the partner's relayBlockConfigs doc.
        // M12's snapshot loaders will read this path once they're wired.
        await db
          .collection('partners')
          .doc(partnerId)
          .collection('relayBlockConfigs')
          .doc(blockId)
          .set(
            {
              fieldBindings: { [field]: { moduleSlug, sourceField } },
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        // Recompute Health so the UI sees the issue disappear.
        await recomputeEngineHealth(partnerId, engine);
        return { ok: true };
      }
      case 'enable-block':
        return {
          ok: false,
          error: 'Not yet implemented — use the /admin/relay/blocks page to enable this block manually.',
          hint: 'enable-block',
        };
      case 'connect-flow':
        return {
          ok: false,
          error: 'Not yet implemented — edit the partner flow definition to include this block at the named stage.',
          hint: 'connect-flow',
        };
      case 'populate-module':
        return {
          ok: false,
          error: 'Not yet implemented — ships with M15 seed templates + CSV import.',
          hint: 'populate-module',
        };
      default: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const k: string = (proposal as any).kind;
        return { ok: false, error: `Unknown fix kind: ${k}` };
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] applyFixProposal failed', { partnerId, engine, err });
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error applying fix',
    };
  }
}

/**
 * Shadow-mode save-hook wrapper. Call after any admin save that could
 * change block, flow, module, or partner engine state. NEVER rethrows —
 * health write failures are logged and swallowed.
 */
export async function triggerHealthRecompute(
  partnerId: string,
  partner?: Partner | null,
): Promise<void> {
  try {
    // Resolve engines from the partner doc if we have one; otherwise just
    // run 'booking' (the pilot engine). Other engines' recomputes are
    // no-ops in Phase 1 since no blocks are tagged for them.
    let engines: Engine[] = ['booking'];
    if (partner) {
      // getPartnerEngines accepts a loose structural shape; cast to
      // unknown → its parameter type keeps the Partner public type clean.
      const resolved = getPartnerEngines(
        partner as unknown as Parameters<typeof getPartnerEngines>[0],
      );
      if (resolved.length > 0) engines = resolved;
    }

    await Promise.all(
      engines.map((engine) => recomputeEngineHealth(partnerId, engine)),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health] trigger failed (shadow mode, swallowed)', {
      partnerId,
      err,
    });
  }
}
