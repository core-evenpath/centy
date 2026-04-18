import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  firestoreStore,
  firestoreControls,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

// ── Firestore admin mock ───────────────────────────────────────────────
// Shared subcollection-aware mock (Q9). Previously this file carried an
// inline mock that lacked `.doc().collection()` support — M0's
// loadPartnerBlockPrefs caught the resulting TypeError in a try/catch,
// but the WARN log leaked through every run.

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

// Mock the global block-config service so recomputeEngineHealth doesn't
// need Firestore fixtures for the purposes of these tests.
vi.mock('@/lib/relay/block-config-service', () => ({
  getGlobalBlockConfigs: vi.fn(async () => []),
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
  resetFirestoreMock();
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
    expect(firestoreStore.get('relayEngineHealth/p1_booking')).toBeDefined();
  });

  it('shadow mode: write failure is swallowed, not rethrown', async () => {
    firestoreControls.throwOnWrite = true;
    const doc = await recomputeEngineHealth('p1', 'booking');
    // The function completes with the computed doc despite the write error.
    expect(doc.partnerId).toBe('p1');
    // Firestore store remains empty (write was rejected).
    expect(firestoreStore.get('relayEngineHealth/p1_booking')).toBeUndefined();
  });

  it('red Health does not prevent completion (shadow mode)', async () => {
    // Our stub loaders return [] blocks, which produces red status.
    const doc = await recomputeEngineHealth('p1', 'booking');
    expect(doc.status).toBe('red');
    // Red status is written, not swallowed — shadow mode means "don't
    // gate on red", not "don't persist red".
    expect(firestoreStore.get('relayEngineHealth/p1_booking')?.data.status).toBe('red');
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
    firestoreControls.throwOnWrite = true;
    // Should not throw; completes normally even though the underlying
    // write fails on every engine.
    await expect(triggerHealthRecompute('p1')).resolves.toBeUndefined();
  });

  it('defaults to booking engine when no partner passed', async () => {
    await triggerHealthRecompute('p1');
    expect(firestoreStore.get('relayEngineHealth/p1_booking')).toBeDefined();
  });

  it('uses partner.engines when partner object passed', async () => {
    const partner = {
      id: 'p1',
      engines: ['booking'],
    } as any;
    await triggerHealthRecompute('p1', partner);
    expect(firestoreStore.get('relayEngineHealth/p1_booking')).toBeDefined();
  });
});
