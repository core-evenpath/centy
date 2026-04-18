// Reusable Firestore admin mock for Vitest.
//
// Backs `@/lib/firebase-admin` with a path-keyed in-memory store that
// supports nested subcollections — the shape the real Firestore admin
// SDK exposes but the older inline mocks in `relay-health-actions.test.ts`
// omit.
//
// Usage:
//
//   import {
//     firestoreStore,
//     makeFirestoreAdminMock,
//     resetFirestoreMock,
//   } from '@/__tests__/helpers/firestore-admin-mock';
//
//   vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
//
//   beforeEach(() => { resetFirestoreMock(); });
//
// Path convention: keys are slash-joined collection/doc paths, matching
// real Firestore — `partners/p1/relayConfig/room_card` for a nested
// subcollection doc. Tests seed data by writing directly to
// `firestoreStore`.

import { vi } from 'vitest';

export interface MockDoc {
  id: string;
  data: Record<string, unknown>;
}

export const firestoreStore = new Map<string, MockDoc>();
export const firestoreCountByCollection = new Map<string, number>();

/** Optional write-hook: set to `true` to make every `.set()` throw once. */
export const firestoreControls = {
  throwOnWrite: false as boolean | (() => boolean),
};

export function resetFirestoreMock(): void {
  firestoreStore.clear();
  firestoreCountByCollection.clear();
  firestoreControls.throwOnWrite = false;
}

function shouldThrow(): boolean {
  const f = firestoreControls.throwOnWrite;
  return typeof f === 'function' ? f() : f;
}

interface CollectionRef {
  doc: (id: string) => DocRef;
  get: () => Promise<{ docs: Array<{ id: string; data: () => unknown; ref: { id: string; path: string } }> }>;
  where: (_field: string, _op: string, _value: unknown) => CollectionRef;
  count: () => { get: () => Promise<{ data: () => { count: number } }> };
  limit: (_n: number) => CollectionRef;
}

interface DocRef {
  id: string;
  set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
  get: () => Promise<{ exists: boolean; data: () => unknown; id: string }>;
  collection: (sub: string) => CollectionRef;
  delete: () => Promise<void>;
}

function makeCollectionRef(path: string): CollectionRef {
  const listDocs = () =>
    [...firestoreStore.entries()]
      .filter(([k]) => {
        const parentPath = k.substring(0, k.lastIndexOf('/'));
        return parentPath === path;
      })
      .map(([k, v]) => ({
        id: v.id,
        data: () => v.data,
        ref: { id: v.id, path: k },
      }));

  return {
    doc: (id: string) => makeDocRef(`${path}/${id}`),
    get: async () => ({ docs: listDocs() }),
    where: (_field, _op, _value) => makeCollectionRef(path),
    limit: (_n) => makeCollectionRef(path),
    count: () => ({
      get: async () => {
        const n = listDocs().length;
        firestoreCountByCollection.set(path, n);
        return { data: () => ({ count: n }) };
      },
    }),
  };
}

function makeDocRef(path: string): DocRef {
  const id = path.split('/').pop() ?? '';
  return {
    id,
    set: async (data, opts) => {
      if (shouldThrow()) throw new Error('simulated write failure');
      const existing = firestoreStore.get(path);
      const merged = opts?.merge && existing ? { ...existing.data, ...data } : data;
      firestoreStore.set(path, { id, data: merged });
    },
    get: async () => {
      const hit = firestoreStore.get(path);
      return { exists: hit !== undefined, data: () => hit?.data, id };
    },
    collection: (sub) => makeCollectionRef(`${path}/${sub}`),
    delete: async () => {
      firestoreStore.delete(path);
    },
  };
}

/**
 * Factory returned to `vi.mock('@/lib/firebase-admin', ...)`. Exported
 * from the helper so multiple test files share a consistent shape.
 *
 * `db.collection` is wrapped in `vi.fn(...)` so tests that override it
 * with `.mockImplementation()` / `.mockImplementationOnce()` keep
 * working — the inline mock this helper replaces did the same.
 */
export function makeFirestoreAdminMock(): { db: { collection: ReturnType<typeof vi.fn> } } {
  return {
    db: {
      collection: vi.fn((name: string) => makeCollectionRef(name)),
    },
  };
}

/**
 * Convenience: seed a doc at a full slash-joined path. Accepts nested
 * paths like `partners/p1/relayConfig/room_card`.
 */
export function seedMockDoc(path: string, data: Record<string, unknown>): void {
  const id = path.split('/').pop() ?? '';
  firestoreStore.set(path, { id, data });
}
