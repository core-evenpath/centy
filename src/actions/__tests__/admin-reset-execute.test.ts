import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import { executeReset } from '../admin-reset-actions';

const ORIG_ENV = process.env.RESET_ALLOW_UNSCOPED;

beforeEach(() => {
  resetFirestoreMock();
  delete process.env.RESET_ALLOW_UNSCOPED;
});

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIG_ENV === undefined) {
    delete process.env.RESET_ALLOW_UNSCOPED;
  } else {
    process.env.RESET_ALLOW_UNSCOPED = ORIG_ENV;
  }
});

describe('MR04 — executeReset: input validation', () => {
  it('rejects unknown collection id', async () => {
    const r = await executeReset('not-a-collection', { partnerId: 'p1' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toMatch(/unknown collection/i);
    }
  });

  it('rejects invalid filter before any side effects', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1', engine: 'booking' });
    const sizeBefore = firestoreStore.size;

    const r = await executeReset('relay-engine-health', {});  // missing partnerId
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('Filter invalid');
    }
    // No writes; no audit entry for invalid input.
    expect(firestoreStore.size).toBe(sizeBefore);
    // Target doc still present.
    expect(firestoreStore.has('relayEngineHealth/p1_booking')).toBe(true);
  });
});

describe('MR04 — executeReset: env gate for unscoped', () => {
  it('rejects unscoped when RESET_ALLOW_UNSCOPED unset', async () => {
    const r = await executeReset('relay-engine-health', { unscoped: true });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toMatch(/RESET_ALLOW_UNSCOPED/);
    }
  });

  it('allows unscoped when RESET_ALLOW_UNSCOPED=true', async () => {
    process.env.RESET_ALLOW_UNSCOPED = 'true';
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1' });
    seedMockDoc('relayEngineHealth/p2_commerce', { partnerId: 'p2' });

    const r = await executeReset('relay-engine-health', { unscoped: true });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
    }
  });

  it('rejects unscoped when env is "false" string (not just "true")', async () => {
    process.env.RESET_ALLOW_UNSCOPED = 'false';
    const r = await executeReset('relay-engine-health', { unscoped: true });
    expect(r.ok).toBe(false);
  });
});

describe('MR04 — executeReset: recompute verb (relay-engine-health)', () => {
  it('deletes matching health docs', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1', engine: 'booking' });
    seedMockDoc('relayEngineHealth/p1_commerce', { partnerId: 'p1', engine: 'commerce' });
    seedMockDoc('relayEngineHealth/p2_booking', { partnerId: 'p2', engine: 'booking' });

    const r = await executeReset('relay-engine-health', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
      expect(r.verb).toBe('recompute');
      expect(r.postResetAction).toBe('trigger-recompute');
    }
    expect(firestoreStore.has('relayEngineHealth/p1_booking')).toBe(false);
    expect(firestoreStore.has('relayEngineHealth/p1_commerce')).toBe(false);
    expect(firestoreStore.has('relayEngineHealth/p2_booking')).toBe(true);
  });
});

describe('MR04 — executeReset: clear verb (relay-block-configs)', () => {
  it('deletes partner block prefs; preserves flowDefinition', async () => {
    seedMockDoc('partners/p1/relayConfig/room_card', { isVisible: true });
    seedMockDoc('partners/p1/relayConfig/product_card', { isVisible: true });
    seedMockDoc('partners/p1/relayConfig/flowDefinition', { stages: [] });

    const r = await executeReset('relay-block-configs', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
      expect(r.verb).toBe('clear');
    }
    expect(firestoreStore.has('partners/p1/relayConfig/room_card')).toBe(false);
    expect(firestoreStore.has('partners/p1/relayConfig/product_card')).toBe(false);
    expect(firestoreStore.has('partners/p1/relayConfig/flowDefinition')).toBe(true);
  });
});

describe('MR04 — executeReset: clear verb (preview-sessions)', () => {
  it('deletes preview_ sessions; preserves production sessions', async () => {
    seedMockDoc('relaySessions/preview_p1_abc', { conversationId: 'preview_p1_abc' });
    seedMockDoc('relaySessions/preview_p1_def', { conversationId: 'preview_p1_def' });
    seedMockDoc('relaySessions/prod_xyz', { conversationId: 'prod_xyz' });

    const r = await executeReset('preview-sessions', {});
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
    }
    expect(firestoreStore.has('relaySessions/preview_p1_abc')).toBe(false);
    expect(firestoreStore.has('relaySessions/preview_p1_def')).toBe(false);
    expect(firestoreStore.has('relaySessions/prod_xyz')).toBe(true);
  });
});

describe('MR04 — executeReset: delete verb (partner-module-items, deep subcollection)', () => {
  it('deletes items after resolving partnerModuleId', async () => {
    seedMockDoc('systemModules/sysm1', { slug: 'product_catalog' });
    seedMockDoc('moduleAssignments/assign1', {
      partnerId: 'p1',
      systemModuleId: 'sysm1',
      partnerModuleId: 'pmod1',
    });
    for (const id of ['i1', 'i2', 'i3']) {
      seedMockDoc(`partners/p1/businessModules/pmod1/items/${id}`, { name: id });
    }

    const r = await executeReset('partner-module-items', {
      partnerId: 'p1',
      moduleSlug: 'product_catalog',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(3);
      expect(r.verb).toBe('delete');
    }
    for (const id of ['i1', 'i2', 'i3']) {
      expect(firestoreStore.has(`partners/p1/businessModules/pmod1/items/${id}`)).toBe(false);
    }
  });
});

describe('MR04 — audit entries', () => {
  it('every execute writes a systemResetAudit entry with concrete verb', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1' });

    const r = await executeReset('relay-engine-health', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const audit = firestoreStore.get(`systemResetAudit/${r.auditId}`);
      expect(audit).toBeDefined();
      const data = audit!.data as { verb: string; confirmedDryRunId: string | null };
      expect(data.verb).toBe('recompute'); // not 'dry-run'
      expect(data.confirmedDryRunId).toBeNull();
    }
  });

  it('confirmedDryRunId is stored in audit when supplied', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1' });

    const r = await executeReset('relay-engine-health', { partnerId: 'p1' }, 'audit-preview-123');
    expect(r.ok).toBe(true);
    if (r.ok) {
      const audit = firestoreStore.get(`systemResetAudit/${r.auditId}`);
      const data = audit!.data as { confirmedDryRunId: string };
      expect(data.confirmedDryRunId).toBe('audit-preview-123');
    }
  });

  it('failed execute writes no audit entry (invalid filter rejected first)', async () => {
    await executeReset('relay-engine-health', {});  // invalid
    // No audit should be written; check nothing in systemResetAudit.
    const auditDocs = [...firestoreStore.keys()].filter((k) => k.startsWith('systemResetAudit/'));
    expect(auditDocs).toEqual([]);
  });
});

describe('MR04 — idempotent: running twice deletes nothing the second time', () => {
  it('second run reports affectedCount=0', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1' });

    const r1 = await executeReset('relay-engine-health', { partnerId: 'p1' });
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.affectedCount).toBe(1);

    const r2 = await executeReset('relay-engine-health', { partnerId: 'p1' });
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.affectedCount).toBe(0);
  });
});
