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

// ── Cache ──────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  doc: EngineHealthDoc;
  loadedAt: number;
}
const cache = new Map<string, CacheEntry>();

function cacheKey(partnerId: string, engine: Engine): string {
  return `${partnerId}_${engine}`;
}

export function invalidateHealthCache(partnerId: string, engine?: Engine): void {
  if (engine) {
    cache.delete(cacheKey(partnerId, engine));
  } else {
    for (const key of Array.from(cache.keys())) {
      if (key.startsWith(`${partnerId}_`)) cache.delete(key);
    }
  }
}

// ── Snapshot loaders (M07 — minimal shape; full resolution comes in M12) ──
//
// These are narrow stubs: they don't yet walk the partner's full block
// config or module state. The shadow-mode writes in Phase 1 produce
// mostly-empty EngineHealthDoc entries for operator visibility; real
// content fills in once M12 wires engine-scoped resolution and M09
// surfaces the results.

async function loadBlockSnapshots(_partnerId: string, _engine: Engine): Promise<BlockSnapshot[]> {
  // Placeholder: full resolution ties into M12's orchestrator policy.
  // Returning [] means the checker will mark every canonical stage as
  // red, which is the correct shadow-mode baseline for "we don't know
  // yet" partners. Admin UI surfaces this as "no data".
  return [];
}

async function loadModuleSnapshots(_partnerId: string): Promise<Record<string, ModuleSnapshot>> {
  return {};
}

async function loadFlowSnapshot(_partnerId: string, _engine: Engine): Promise<FlowSnapshot | null> {
  return null;
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
  cache.set(key, { doc, loadedAt: Date.now() });

  return doc;
}

export async function getEngineHealth(
  partnerId: string,
  engine: Engine,
): Promise<EngineHealthDoc | null> {
  const key = cacheKey(partnerId, engine);
  const now = Date.now();

  const hit = cache.get(key);
  if (hit && now - hit.loadedAt < CACHE_TTL_MS) {
    return hit.doc;
  }

  try {
    const snap = await db.collection('relayEngineHealth').doc(key).get();
    if (!snap.exists) return null;
    const doc = snap.data() as EngineHealthDoc;
    cache.set(key, { doc, loadedAt: now });
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
