import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import { previewReset } from '../admin-reset-actions';

beforeEach(() => {
  resetFirestoreMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MR03 — previewReset: unknown collection + invalid filter', () => {
  it('rejects unknown collection id', async () => {
    const r = await previewReset('not-a-collection', { partnerId: 'p1' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toMatch(/unknown collection/i);
    }
  });

  it('rejects invalid filter with details', async () => {
    const r = await previewReset('relay-engine-health', {});  // missing partnerId
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('Filter invalid');
      expect(r.details?.length).toBeGreaterThan(0);
    }
  });
});

describe('MR03 — previewReset: relay-engine-health (recompute verb)', () => {
  it('counts partner-keyed docs with sample ids', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1', engine: 'booking', status: 'green' });
    seedMockDoc('relayEngineHealth/p1_commerce', { partnerId: 'p1', engine: 'commerce', status: 'amber' });
    seedMockDoc('relayEngineHealth/p2_booking', { partnerId: 'p2', engine: 'booking', status: 'green' });

    const r = await previewReset('relay-engine-health', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
      expect(r.sampleIds.sort()).toEqual(['p1_booking', 'p1_commerce']);
      expect(r.verb).toBe('recompute');
    }
  });

  it('narrows further when engine filter added', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1', engine: 'booking' });
    seedMockDoc('relayEngineHealth/p1_commerce', { partnerId: 'p1', engine: 'commerce' });

    const r = await previewReset('relay-engine-health', { partnerId: 'p1', engine: 'booking' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(1);
      expect(r.sampleIds).toEqual(['p1_booking']);
    }
  });
});

describe('MR03 — previewReset: relay-block-configs (clear verb, subcollection)', () => {
  it('counts block pref docs; skips flowDefinition', async () => {
    seedMockDoc('partners/p1/relayConfig/room_card', { isVisible: true });
    seedMockDoc('partners/p1/relayConfig/product_card', { isVisible: true });
    seedMockDoc('partners/p1/relayConfig/flowDefinition', { stages: [] });

    const r = await previewReset('relay-block-configs', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
      expect(r.sampleIds.sort()).toEqual(['product_card', 'room_card']);
      expect(r.verb).toBe('clear');
    }
  });
});

describe('MR03 — previewReset: preview-sessions (no required scope)', () => {
  it('filters docs by preview_ prefix', async () => {
    seedMockDoc('relaySessions/preview_p1_abc', {
      conversationId: 'preview_p1_abc',
      partnerId: 'p1',
    });
    seedMockDoc('relaySessions/preview_p1_def', {
      conversationId: 'preview_p1_def',
      partnerId: 'p1',
    });
    seedMockDoc('relaySessions/real_session_xyz', {
      conversationId: 'real_session_xyz',
      partnerId: 'p1',
    });

    const r = await previewReset('preview-sessions', {});
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(2);
      expect(r.sampleIds.every((id) => id.startsWith('preview_'))).toBe(true);
    }
  });

  it('optional partner filter narrows', async () => {
    seedMockDoc('relaySessions/preview_p1_abc', {
      conversationId: 'preview_p1_abc',
      partnerId: 'p1',
    });
    seedMockDoc('relaySessions/preview_p2_xyz', {
      conversationId: 'preview_p2_xyz',
      partnerId: 'p2',
    });

    const r = await previewReset('preview-sessions', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(1);
    }
  });
});

describe('MR03 — previewReset: partner-module-items (delete verb, deep subcollection)', () => {
  it('resolves partnerModuleId via systemModules + moduleAssignments', async () => {
    seedMockDoc('systemModules/sysm1', { slug: 'product_catalog' });
    seedMockDoc('moduleAssignments/assign1', {
      partnerId: 'p1',
      systemModuleId: 'sysm1',
      partnerModuleId: 'pmod1',
    });
    for (const id of ['i1', 'i2', 'i3']) {
      seedMockDoc(`partners/p1/businessModules/pmod1/items/${id}`, { name: id });
    }

    const r = await previewReset('partner-module-items', {
      partnerId: 'p1',
      moduleSlug: 'product_catalog',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(3);
      expect(r.sampleIds.sort()).toEqual(['i1', 'i2', 'i3']);
      expect(r.verb).toBe('delete');
    }
  });

  it('warns when partner has no module assignment', async () => {
    const r = await previewReset('partner-module-items', {
      partnerId: 'p-unassigned',
      moduleSlug: 'product_catalog',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.affectedCount).toBe(0);
      expect(r.warnings.some((w) => w.includes('no assignment'))).toBe(true);
    }
  });
});

describe('MR03 — audit log written for every dry-run', () => {
  it('writes a systemResetAudit doc with verb=dry-run', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1', engine: 'booking' });

    const r = await previewReset('relay-engine-health', { partnerId: 'p1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const audit = firestoreStore.get(`systemResetAudit/${r.auditId}`);
      expect(audit).toBeDefined();
      expect((audit!.data as { verb: string }).verb).toBe('dry-run');
      expect((audit!.data as { collectionId: string }).collectionId).toBe('relay-engine-health');
      expect((audit!.data as { affectedCount: number }).affectedCount).toBe(1);
    }
  });

  it('no writes to the target collection during dry-run', async () => {
    seedMockDoc('relayEngineHealth/p1_booking', { partnerId: 'p1', engine: 'booking' });
    const sizeBefore = firestoreStore.size;

    await previewReset('relay-engine-health', { partnerId: 'p1' });

    // Only the systemResetAudit doc was added; target (1 health doc)
    // unchanged.
    const sizeAfter = firestoreStore.size;
    expect(sizeAfter).toBe(sizeBefore + 1); // +1 audit, 0 target writes
    expect(firestoreStore.has('relayEngineHealth/p1_booking')).toBe(true);
  });
});

describe('MR03 — live-session warning for recent dateRange', () => {
  it('warns when dateRangeFrom is within last 24h', async () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1h ago
    const until = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    seedMockDoc('relaySessions/p1_abc', { partnerId: 'p1', conversationId: 'c1' });

    const r = await previewReset('relay-sessions', {
      partnerId: 'p1',
      dateRangeFrom: recent,
      dateRangeTo: until,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some((w) => w.includes('last 24 hours'))).toBe(true);
    }
  });
});
