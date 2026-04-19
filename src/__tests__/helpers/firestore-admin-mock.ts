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

interface WherePredicate {
  field: string;
  op: string;
  value: unknown;
}

function matchesPredicate(data: Record<string, unknown>, p: WherePredicate): boolean {
  const actual = data[p.field];
  switch (p.op) {
    case '==':
      return actual === p.value;
    case '!=':
      return actual !== p.value;
    case '>':
      return typeof actual === 'number' && typeof p.value === 'number' && actual > p.value;
    case '>=':
      return typeof actual === 'number' && typeof p.value === 'number' && actual >= p.value;
    case '<':
      return typeof actual === 'number' && typeof p.value === 'number' && actual < p.value;
    case '<=':
      return typeof actual === 'number' && typeof p.value === 'number' && actual <= p.value;
    case 'in':
      return Array.isArray(p.value) && p.value.includes(actual);
    default:
      // Unknown op: return false so mis-specified tests fail loudly
      // rather than silently accept all docs.
      return false;
  }
}

function makeCollectionRef(path: string, predicates: WherePredicate[] = [], limit?: number): CollectionRef {
  const listDocs = () => {
    const all = [...firestoreStore.entries()]
      .filter(([k]) => {
        const parentPath = k.substring(0, k.lastIndexOf('/'));
        return parentPath === path;
      })
      .filter(([, v]) => predicates.every((p) => matchesPredicate(v.data, p)));
    const mapped = all.map(([k, v]) => ({
      id: v.id,
      data: () => v.data,
      ref: { id: v.id, path: k },
    }));
    return typeof limit === 'number' ? mapped.slice(0, limit) : mapped;
  };

  return {
    doc: (id: string) => makeDocRef(`${path}/${id}`),
    get: async () => ({ docs: listDocs() }),
    where: (field, op, value) => makeCollectionRef(path, [...predicates, { field, op, value }], limit),
    limit: (n) => makeCollectionRef(path, predicates, n),
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
  const ref: DocRef & { __path: string } = {
    // Tag the ref with its concrete path so batch ops can resolve it.
    // The real Firestore SDK exposes `.path` on refs; we use `__path`
    // to avoid colliding with anything else tests might reference.
    __path: path,
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
  return ref;
}

// ── Batch mock ──────────────────────────────────────────────────
//
// Supports set / delete / update queued ops; commit applies them.
// The queued ops carry the concrete doc path so the batch can
// operate on nested subcollections without holding references to
// the ref objects themselves.
interface BatchOp {
  kind: 'set' | 'delete' | 'update';
  path: string;
  data?: Record<string, unknown>;
}

function resolvePath(ref: unknown): string | null {
  // DocRef objects we produce expose a .id but not a .path. The
  // admin SDK has ref.path for docs; emulate by tracking the path
  // on the ref itself. Our DocRef doesn't expose path today — fall
  // back by reading the `(ref as any).__path` backing field we attach
  // at construction time (see buildPath extension below).
  const r = ref as { __path?: string };
  return r?.__path ?? null;
}

function makeBatch() {
  const ops: BatchOp[] = [];
  return {
    set: (ref: unknown, data: Record<string, unknown>) => {
      const path = resolvePath(ref);
      if (path) ops.push({ kind: 'set', path, data });
    },
    delete: (ref: unknown) => {
      const path = resolvePath(ref);
      if (path) ops.push({ kind: 'delete', path });
    },
    update: (ref: unknown, data: Record<string, unknown>) => {
      const path = resolvePath(ref);
      if (path) ops.push({ kind: 'update', path, data });
    },
    commit: async () => {
      if (shouldThrow()) throw new Error('simulated batch commit failure');
      for (const op of ops) {
        if (op.kind === 'delete') {
          firestoreStore.delete(op.path);
        } else if (op.kind === 'set') {
          const id = op.path.split('/').pop() ?? '';
          firestoreStore.set(op.path, { id, data: op.data ?? {} });
        } else if (op.kind === 'update') {
          const existing = firestoreStore.get(op.path);
          const id = op.path.split('/').pop() ?? '';
          firestoreStore.set(op.path, {
            id,
            data: { ...(existing?.data ?? {}), ...(op.data ?? {}) },
          });
        }
      }
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
 *
 * `db.batch()` returns a queued-ops batch (set / delete / update →
 * commit applies them atomically in test-land).
 */
export function makeFirestoreAdminMock(): {
  db: { collection: ReturnType<typeof vi.fn>; batch: () => ReturnType<typeof makeBatch> };
} {
  return {
    db: {
      collection: vi.fn((name: string) => makeCollectionRef(name)),
      batch: () => makeBatch(),
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
