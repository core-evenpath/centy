import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ── Firestore admin mock ───────────────────────────────────────────────
//
// The action under test reads and writes `relayEngineHealth/*` via
// `db.collection(...).doc(...).set/get`. We replace `@/lib/firebase-admin`
// with an in-memory stub so tests run without Firestore emulator.

interface StoreDoc {
  id: string;
  data: Record<string, unknown>;
}
const store = new Map<string, StoreDoc>();
let throwOnWrite = false;

const docMock = (collectionName: string) => (docId: string) => ({
  set: vi.fn(async (data: Record<string, unknown>) => {
    if (throwOnWrite) throw new Error('simulated write failure');
    store.set(`${collectionName}/${docId}`, { id: docId, data });
  }),
  get: vi.fn(async () => {
    const key = `${collectionName}/${docId}`;
    const hit = store.get(key);
    return {
      exists: hit !== undefined,
      data: () => hit?.data,
    };
  }),
});

const collectionMock = (collectionName: string) => ({
  doc: docMock(collectionName),
  where: () => ({
    get: vi.fn(async () => ({
      docs: Array.from(store.entries())
        .filter(([key]) => key.startsWith(`${collectionName}/`))
        .map(([, v]) => ({ id: v.id, data: () => v.data })),
    })),
  }),
});

vi.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: vi.fn((name: string) => collectionMock(name)),
  },
}));

// ── SUT imports (after mock) ───────────────────────────────────────────

import {
  recomputeEngineHealth,
  getEngineHealth,
  getAllPartnerEngineHealth,
  triggerHealthRecompute,
} from '../relay-health-actions';
import { invalidateHealthCache } from '@/lib/relay/health-cache';

beforeEach(() => {
  store.clear();
  throwOnWrite = false;
  invalidateHealthCache('p1');
  invalidateHealthCache('p2');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('recomputeEngineHealth', () => {
  it('writes an EngineHealthDoc to Firestore', async () => {
    const doc = await recomputeEngineHealth('p1', 'booking');
    expect(doc.partnerId).toBe('p1');
    expect(doc.engine).toBe('booking');
    expect(typeof doc.computedAt).toBe('number');
    expect(store.get('relayEngineHealth/p1_booking')).toBeDefined();
  });

  it('shadow mode: write failure is swallowed, not rethrown', async () => {
    throwOnWrite = true;
    const doc = await recomputeEngineHealth('p1', 'booking');
    // The function completes with the computed doc despite the write error.
    expect(doc.partnerId).toBe('p1');
    // Firestore store remains empty (write was rejected).
    expect(store.get('relayEngineHealth/p1_booking')).toBeUndefined();
  });

  it('red Health does not prevent completion (shadow mode)', async () => {
    // Our stub loaders return [] blocks, which produces red status.
    const doc = await recomputeEngineHealth('p1', 'booking');
    expect(doc.status).toBe('red');
    // Red status is written, not swallowed — shadow mode means "don't
    // gate on red", not "don't persist red".
    expect(store.get('relayEngineHealth/p1_booking')?.data.status).toBe('red');
  });
});

describe('getEngineHealth caching', () => {
  it('returns null when no doc exists', async () => {
    const result = await getEngineHealth('p1', 'booking');
    expect(result).toBeNull();
  });

  it('reads from Firestore on cold miss', async () => {
    await recomputeEngineHealth('p1', 'booking');
    invalidateHealthCache('p1');

    const result = await getEngineHealth('p1', 'booking');
    expect(result?.partnerId).toBe('p1');
  });

  it('serves from cache within TTL', async () => {
    await recomputeEngineHealth('p1', 'booking');
    // recomputeEngineHealth seeds the cache; a subsequent get should not
    // hit Firestore at all.
    const spy = vi.fn(async () => ({ exists: false, data: () => undefined }));
    const { db } = await import('@/lib/firebase-admin');
    (db.collection as any).mockImplementation(() => ({
      doc: () => ({ get: spy, set: vi.fn() }),
    }));

    const result = await getEngineHealth('p1', 'booking');
    expect(result?.partnerId).toBe('p1');
    expect(spy).not.toHaveBeenCalled();
  });

  it('invalidateHealthCache: scoped key', async () => {
    await recomputeEngineHealth('p1', 'booking');
    await recomputeEngineHealth('p2', 'booking');

    invalidateHealthCache('p1', 'booking');

    // p1 cache gone → hit Firestore
    // p2 cache intact → served from cache (we don't re-seed store before
    // this, so if it weren't cached, it would still come from store).
    // Just verify the two partners' reads don't collide.
    const r1 = await getEngineHealth('p1', 'booking');
    const r2 = await getEngineHealth('p2', 'booking');
    expect(r1?.partnerId).toBe('p1');
    expect(r2?.partnerId).toBe('p2');
  });
});

describe('getAllPartnerEngineHealth', () => {
  it('returns all engine health docs', async () => {
    await recomputeEngineHealth('p1', 'booking');
    const all = await getAllPartnerEngineHealth('p1');
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all.every((d) => d.partnerId === 'p1')).toBe(true);
  });

  it('returns [] on read failure', async () => {
    const { db } = await import('@/lib/firebase-admin');
    (db.collection as any).mockImplementationOnce(() => ({
      where: () => ({ get: () => { throw new Error('boom'); } }),
    }));
    const all = await getAllPartnerEngineHealth('p1');
    expect(all).toEqual([]);
  });
});

describe('triggerHealthRecompute (save-hook wrapper)', () => {
  it('swallows all errors — never rethrows', async () => {
    throwOnWrite = true;
    // Should not throw; completes normally even though the underlying
    // write fails on every engine.
    await expect(triggerHealthRecompute('p1')).resolves.toBeUndefined();
  });

  it('defaults to booking engine when no partner passed', async () => {
    await triggerHealthRecompute('p1');
    expect(store.get('relayEngineHealth/p1_booking')).toBeDefined();
  });

  it('uses partner.engines when partner object passed', async () => {
    const partner = {
      id: 'p1',
      engines: ['booking'],
    } as any;
    await triggerHealthRecompute('p1', partner);
    expect(store.get('relayEngineHealth/p1_booking')).toBeDefined();
  });
});
