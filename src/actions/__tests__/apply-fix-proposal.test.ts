import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

// Shared subcollection-aware mock (Q9).
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

// ── SUT imports (after mock) ──────────────────────────────────────────

import { applyFixProposal } from '../relay-health-actions';
import type { FixProposal } from '@/lib/relay/health';

beforeEach(() => {
  resetFirestoreMock();
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
    const written = firestoreStore.get(key);
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
    const before = firestoreStore.size;
    await applyFixProposal('p1', 'booking', {
      kind: 'enable-block',
      blockId: 'b1',
      confidence: 'high',
      reason: 'test',
      payload: {},
    });
    expect(firestoreStore.size).toBe(before);
  });
});
