import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ── Firestore admin mock ──────────────────────────────────────────────
//
// The applyFixProposal server action writes to
// `partners/{partnerId}/relayBlockConfigs/{blockId}` via `db.collection`.
// We stub `@/lib/firebase-admin` with an in-memory Firestore so tests
// run without emulator.

interface StoreDoc {
  id: string;
  data: Record<string, unknown>;
}
const store = new Map<string, StoreDoc>();

const docMock = (path: string) => ({
  set: vi.fn(async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
    const existing = store.get(path);
    const merged = opts?.merge && existing
      ? { ...existing.data, ...data }
      : data;
    store.set(path, { id: path.split('/').pop()!, data: merged });
  }),
  get: vi.fn(async () => {
    const hit = store.get(path);
    return {
      exists: hit !== undefined,
      data: () => hit?.data,
    };
  }),
});

function collectionMock(name: string, prefix = ''): {
  doc: (id: string) => ReturnType<typeof docMock> & { collection: (sub: string) => ReturnType<typeof collectionMock> };
  where: () => { get: () => Promise<{ docs: Array<{ id: string; data: () => unknown }> }> };
} {
  return {
    doc: (id: string) => {
      const path = `${prefix}${name}/${id}`;
      const base = docMock(path);
      return {
        ...base,
        collection: (sub: string) => collectionMock(sub, `${path}/`),
      };
    },
    where: () => ({
      get: vi.fn(async () => ({
        docs: Array.from(store.entries())
          .filter(([k]) => k.startsWith(`${prefix}${name}/`))
          .map(([, v]) => ({ id: v.id, data: () => v.data })),
      })),
    }),
  };
}

vi.mock('@/lib/firebase-admin', () => ({
  db: {
    collection: vi.fn((name: string) => collectionMock(name)),
  },
}));

// ── SUT imports (after mock) ──────────────────────────────────────────

import { applyFixProposal } from '../relay-health-actions';
import type { FixProposal } from '@/lib/relay/health';

beforeEach(() => {
  store.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('applyFixProposal — bind-field (happy path)', () => {
  it('writes partner block config with fieldBindings', async () => {
    const proposal: FixProposal = {
      kind: 'bind-field',
      blockId: 'room_card',
      field: 'name',
      moduleSlug: 'room_inventory',
      sourceField: 'roomName',
      confidence: 'high',
      reason: 'Field "name" matches module field "roomName" (similarity 1.00)',
      payload: {
        blockId: 'room_card',
        field: 'name',
        moduleSlug: 'room_inventory',
        sourceField: 'roomName',
      },
    };
    const result = await applyFixProposal('p1', 'booking', proposal);
    expect(result.ok).toBe(true);

    const key = 'partners/p1/relayBlockConfigs/room_card';
    const written = store.get(key);
    expect(written).toBeDefined();
    expect((written!.data as { fieldBindings: Record<string, { moduleSlug: string; sourceField: string }> }).fieldBindings).toEqual({
      name: { moduleSlug: 'room_inventory', sourceField: 'roomName' },
    });
  });

  it('rejects bind-field proposal missing fields', async () => {
    const bad: FixProposal = {
      kind: 'bind-field',
      blockId: 'room_card',
      confidence: 'high',
      reason: 'missing payload',
      payload: {},
    } as FixProposal;
    const result = await applyFixProposal('p1', 'booking', bad);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/missing/i);
  });
});

describe('applyFixProposal — other kinds return explicit "not yet implemented"', () => {
  const baseProposal = (kind: FixProposal['kind']): FixProposal => ({
    kind,
    blockId: 'b1',
    confidence: 'medium',
    reason: 'test',
    payload: { blockId: 'b1' },
  });

  it('enable-block: clear hint', async () => {
    const result = await applyFixProposal('p1', 'booking', baseProposal('enable-block'));
    expect(result.ok).toBe(false);
    expect(result.hint).toBe('enable-block');
    expect(result.error).toMatch(/not yet implemented/i);
    expect(result.error).toMatch(/\/admin\/relay\/blocks/i);
  });

  it('connect-flow: clear hint', async () => {
    const result = await applyFixProposal('p1', 'booking', baseProposal('connect-flow'));
    expect(result.ok).toBe(false);
    expect(result.hint).toBe('connect-flow');
  });

  it('populate-module: references M15', async () => {
    const result = await applyFixProposal('p1', 'booking', baseProposal('populate-module'));
    expect(result.ok).toBe(false);
    expect(result.hint).toBe('populate-module');
    expect(result.error).toMatch(/M15|seed/i);
  });
});

describe('applyFixProposal — underlying-state unchanged on error', () => {
  it('failed apply does not leave half-written state', async () => {
    const before = store.size;
    await applyFixProposal('p1', 'booking', {
      kind: 'enable-block',
      blockId: 'b1',
      confidence: 'high',
      reason: 'test',
      payload: {},
    });
    expect(store.size).toBe(before);
  });
});
