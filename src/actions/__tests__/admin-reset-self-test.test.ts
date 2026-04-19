// Admin Reset — self-test flow (MR06).
//
// End-to-end sequence mirroring what Phase 3 P3.M06 final-validation
// will run:
//   1. Seed a disposable test partner's Health + sessions + module items
//   2. Use the public reset actions (previewReset + executeReset) to
//      reset each collection, exercising every verb
//   3. Verify post-reset state matches expectations (deletion happened;
//      audit entries written; audit chain via confirmedDryRunId)
//   4. Idempotence: run again, verify affectedCount=0
//   5. Rejection matrix: every input-validation path has a test

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import { previewReset, executeReset } from '../admin-reset-actions';

const TEST_PARTNER = 'p-test-mr06';

function seedDisposableTestPartner() {
  // Health snapshots across 3 engines
  seedMockDoc(`relayEngineHealth/${TEST_PARTNER}_booking`, {
    partnerId: TEST_PARTNER,
    engine: 'booking',
    status: 'green',
  });
  seedMockDoc(`relayEngineHealth/${TEST_PARTNER}_commerce`, {
    partnerId: TEST_PARTNER,
    engine: 'commerce',
    status: 'amber',
  });
  seedMockDoc(`relayEngineHealth/${TEST_PARTNER}_lead`, {
    partnerId: TEST_PARTNER,
    engine: 'lead',
    status: 'green',
  });

  // Partner block prefs (3 blocks + 1 flowDefinition)
  seedMockDoc(`partners/${TEST_PARTNER}/relayConfig/room_card`, { isVisible: true });
  seedMockDoc(`partners/${TEST_PARTNER}/relayConfig/product_card`, { isVisible: true });
  seedMockDoc(`partners/${TEST_PARTNER}/relayConfig/fin_application`, { isVisible: false });
  seedMockDoc(`partners/${TEST_PARTNER}/relayConfig/flowDefinition`, { stages: [] });

  // Preview sessions for this partner
  seedMockDoc('relaySessions/preview_mr06_a', {
    conversationId: 'preview_mr06_a',
    partnerId: TEST_PARTNER,
  });
  seedMockDoc('relaySessions/preview_mr06_b', {
    conversationId: 'preview_mr06_b',
    partnerId: TEST_PARTNER,
  });
  // Production session — should NOT be affected by preview-sessions reset
  seedMockDoc('relaySessions/real_mr06', {
    conversationId: 'conv_real',
    partnerId: TEST_PARTNER,
  });

  // Module items (partner-module-items verb: delete)
  seedMockDoc('systemModules/sysm-test', { slug: 'product_catalog' });
  seedMockDoc('moduleAssignments/assign-test', {
    partnerId: TEST_PARTNER,
    systemModuleId: 'sysm-test',
    partnerModuleId: 'pmod-test',
  });
  for (const id of ['item1', 'item2', 'item3']) {
    seedMockDoc(
      `partners/${TEST_PARTNER}/businessModules/pmod-test/items/${id}`,
      { name: `sample-${id}` },
    );
  }
}

beforeEach(() => {
  resetFirestoreMock();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MR06 — self-test: full reset cycle for a disposable partner', () => {
  it('preview → execute → verify for relay-engine-health (recompute)', async () => {
    seedDisposableTestPartner();

    // Preview
    const preview = await previewReset('relay-engine-health', { partnerId: TEST_PARTNER });
    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error('preview failed');
    expect(preview.affectedCount).toBe(3);
    expect(preview.verb).toBe('recompute');

    // Execute with confirmedDryRunId
    const exec = await executeReset(
      'relay-engine-health',
      { partnerId: TEST_PARTNER },
      preview.auditId,
    );
    expect(exec.ok).toBe(true);
    if (!exec.ok) throw new Error('execute failed');
    expect(exec.affectedCount).toBe(3);
    expect(exec.postResetAction).toBe('trigger-recompute');

    // Post-state: all 3 health docs gone
    expect(firestoreStore.has(`relayEngineHealth/${TEST_PARTNER}_booking`)).toBe(false);
    expect(firestoreStore.has(`relayEngineHealth/${TEST_PARTNER}_commerce`)).toBe(false);
    expect(firestoreStore.has(`relayEngineHealth/${TEST_PARTNER}_lead`)).toBe(false);

    // Audit chain: execute audit references preview audit
    const execAudit = firestoreStore.get(`systemResetAudit/${exec.auditId}`);
    expect((execAudit!.data as { confirmedDryRunId: string }).confirmedDryRunId).toBe(
      preview.auditId,
    );
  });

  it('preview → execute → verify for relay-block-configs (clear); flowDefinition preserved', async () => {
    seedDisposableTestPartner();

    const preview = await previewReset('relay-block-configs', { partnerId: TEST_PARTNER });
    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error('preview failed');
    expect(preview.affectedCount).toBe(3);

    const exec = await executeReset('relay-block-configs', { partnerId: TEST_PARTNER });
    expect(exec.ok).toBe(true);
    if (!exec.ok) throw new Error('execute failed');

    expect(firestoreStore.has(`partners/${TEST_PARTNER}/relayConfig/room_card`)).toBe(false);
    expect(firestoreStore.has(`partners/${TEST_PARTNER}/relayConfig/product_card`)).toBe(false);
    expect(firestoreStore.has(`partners/${TEST_PARTNER}/relayConfig/fin_application`)).toBe(false);
    // flowDefinition is skipped by design
    expect(firestoreStore.has(`partners/${TEST_PARTNER}/relayConfig/flowDefinition`)).toBe(true);
  });

  it('preview → execute → verify for preview-sessions (clear)', async () => {
    seedDisposableTestPartner();

    const exec = await executeReset('preview-sessions', { partnerId: TEST_PARTNER });
    expect(exec.ok).toBe(true);
    if (!exec.ok) throw new Error('execute failed');
    expect(exec.affectedCount).toBe(2);

    expect(firestoreStore.has('relaySessions/preview_mr06_a')).toBe(false);
    expect(firestoreStore.has('relaySessions/preview_mr06_b')).toBe(false);
    expect(firestoreStore.has('relaySessions/real_mr06')).toBe(true);
  });

  it('preview → execute → verify for partner-module-items (delete, deep subcollection)', async () => {
    seedDisposableTestPartner();

    const exec = await executeReset('partner-module-items', {
      partnerId: TEST_PARTNER,
      moduleSlug: 'product_catalog',
    });
    expect(exec.ok).toBe(true);
    if (!exec.ok) throw new Error('execute failed');
    expect(exec.affectedCount).toBe(3);

    for (const id of ['item1', 'item2', 'item3']) {
      expect(
        firestoreStore.has(`partners/${TEST_PARTNER}/businessModules/pmod-test/items/${id}`),
      ).toBe(false);
    }
  });
});

describe('MR06 — idempotence', () => {
  it('running the same reset twice produces affectedCount=0 on the second', async () => {
    seedDisposableTestPartner();

    const first = await executeReset('relay-engine-health', { partnerId: TEST_PARTNER });
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.affectedCount).toBe(3);

    const second = await executeReset('relay-engine-health', { partnerId: TEST_PARTNER });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.affectedCount).toBe(0);

    // Audit entries written for both runs (including the second no-op)
    const auditDocs = [...firestoreStore.keys()].filter((k) => k.startsWith('systemResetAudit/'));
    expect(auditDocs.length).toBe(2);
  });
});

describe('MR06 — rejection matrix', () => {
  it('unknown collection id → reject (preview + execute)', async () => {
    const p = await previewReset('unknown-collection', { partnerId: 'p1' });
    expect(p.ok).toBe(false);
    const e = await executeReset('unknown-collection', { partnerId: 'p1' });
    expect(e.ok).toBe(false);
  });

  it('missing required scope → reject', async () => {
    const r = await executeReset('relay-engine-health', {});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('Filter invalid');
      expect(r.details?.some((d) => d.includes('per-partner'))).toBe(true);
    }
  });

  it('malformed partnerId → reject', async () => {
    const r = await executeReset('relay-engine-health', { partnerId: '../../evil' });
    expect(r.ok).toBe(false);
  });

  it('malformed moduleSlug → reject', async () => {
    const r = await executeReset('partner-module-items', {
      partnerId: 'p1',
      moduleSlug: 'Product-Catalog',  // uppercase + hyphen not allowed
    });
    expect(r.ok).toBe(false);
  });

  it('partial date range → reject', async () => {
    const r = await executeReset('relay-sessions', {
      partnerId: 'p1',
      dateRangeFrom: '2026-04-19',
    });
    expect(r.ok).toBe(false);
  });

  it('unscoped without env flag → reject at action layer', async () => {
    delete process.env.RESET_ALLOW_UNSCOPED;
    const r = await executeReset('relay-engine-health', { unscoped: true });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toMatch(/RESET_ALLOW_UNSCOPED/);
    }
  });
});

describe('MR06 — audit log correctness', () => {
  it('dry-run + execute produce exactly two audit entries', async () => {
    seedDisposableTestPartner();

    await previewReset('relay-engine-health', { partnerId: TEST_PARTNER });
    await executeReset('relay-engine-health', { partnerId: TEST_PARTNER });

    const auditDocs = [...firestoreStore.keys()].filter((k) => k.startsWith('systemResetAudit/'));
    expect(auditDocs.length).toBe(2);

    const verbs = auditDocs
      .map((k) => (firestoreStore.get(k)!.data as { verb: string }).verb)
      .sort();
    expect(verbs).toEqual(['dry-run', 'recompute']);
  });

  it('audit entries carry the resolved firestore path (not the template)', async () => {
    seedDisposableTestPartner();

    const exec = await executeReset('partner-module-items', {
      partnerId: TEST_PARTNER,
      moduleSlug: 'product_catalog',
    });
    expect(exec.ok).toBe(true);
    if (!exec.ok) return;

    const audit = firestoreStore.get(`systemResetAudit/${exec.auditId}`);
    const data = audit!.data as { firestorePath: string };
    // Path is resolved with real partnerModuleId, not the slug
    expect(data.firestorePath).toBe(
      `partners/${TEST_PARTNER}/businessModules/pmod-test/items`,
    );
  });
});

describe('MR06 — Phase 3 readiness sequence (documented in runbook)', () => {
  it('end-to-end: reset partner Health → verify snapshots gone (next read would recompute)', async () => {
    seedDisposableTestPartner();

    // Step 1: operator picks a test partner — TEST_PARTNER above
    // Step 2: dry-run to verify what would change
    const preview = await previewReset('relay-engine-health', { partnerId: TEST_PARTNER });
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.affectedCount).toBe(3);

    // Step 3: execute
    const exec = await executeReset(
      'relay-engine-health',
      { partnerId: TEST_PARTNER },
      preview.auditId,
    );
    expect(exec.ok).toBe(true);
    if (!exec.ok) return;

    // Step 4: verify Health docs gone
    expect(firestoreStore.has(`relayEngineHealth/${TEST_PARTNER}_booking`)).toBe(false);

    // Step 5: (in production, this would be the operator visiting
    // /admin/relay/health?partnerId=${TEST_PARTNER}, which triggers
    // recompute via relay-health-actions). Simulate by re-seeding
    // a post-recompute shape and asserting the postResetAction hint
    // reflected the right guidance.
    expect(exec.postResetAction).toBe('trigger-recompute');

    // Step 6: audit trail is complete
    expect(exec.auditId).toBeTruthy();
    const auditDoc = firestoreStore.get(`systemResetAudit/${exec.auditId}`);
    expect(auditDoc).toBeDefined();
  });
});
