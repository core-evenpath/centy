// X05 Health gating policy tests (P3.M01).
//
// `decideHealthGate` is a pure function reading `HEALTH_GATING_ENABLED`
// at call time. We swap the constant via vi.doMock for the flag-on
// case so the policy logic is exercised without changing the production
// default.

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { EngineHealthDoc, GatingDecision } from '../index';

function makeHealth(status: EngineHealthDoc['status']): EngineHealthDoc {
  return {
    partnerId: 'p1',
    engine: 'booking',
    status,
    computedAt: 1700000000000,
    stages: [],
    orphanBlocks: [],
    orphanFlowTargets: [],
    unresolvedBindings: [],
    emptyModules: [],
    fixProposals: [],
  };
}

// ── Flag-off behavior (production default) ─────────────────────────

describe('decideHealthGate — HEALTH_GATING_ENABLED = false (production default)', () => {
  it('always allows when flag is off, regardless of red status', async () => {
    // Use the production module — flag is false in source.
    const { decideHealthGate } = await import('../gating');
    const r: GatingDecision = decideHealthGate(makeHealth('red'));
    expect(r.allow).toBe(true);
    expect(r.reason).toBe('gating-disabled');
  });

  it('always allows for amber + green when flag off', async () => {
    const { decideHealthGate } = await import('../gating');
    expect(decideHealthGate(makeHealth('amber'))).toEqual({
      allow: true,
      reason: 'gating-disabled',
    });
    expect(decideHealthGate(makeHealth('green'))).toEqual({
      allow: true,
      reason: 'gating-disabled',
    });
  });

  it('always allows for missing health (null) when flag off', async () => {
    const { decideHealthGate } = await import('../gating');
    expect(decideHealthGate(null)).toEqual({
      allow: true,
      reason: 'gating-disabled',
    });
  });
});

// ── Flag-on behavior (P3.M01-flip target state) ────────────────────
//
// We swap @/lib/feature-flags so the imported HEALTH_GATING_ENABLED
// constant resolves to true. vi.resetModules ensures gating.ts
// re-evaluates with the new flag.

describe('decideHealthGate — HEALTH_GATING_ENABLED = true (P3.M01-flip target)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('@/lib/feature-flags', () => ({ HEALTH_GATING_ENABLED: true }));
  });

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/lib/feature-flags');
  });

  it('denies on red status with reason health-red', async () => {
    const { decideHealthGate } = await import('../gating');
    const r = decideHealthGate(makeHealth('red'));
    expect(r.allow).toBe(false);
    expect(r.reason).toBe('health-red');
  });

  it('allows on amber (review-recommended, not blocking)', async () => {
    const { decideHealthGate } = await import('../gating');
    const r = decideHealthGate(makeHealth('amber'));
    expect(r.allow).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it('allows on green', async () => {
    const { decideHealthGate } = await import('../gating');
    const r = decideHealthGate(makeHealth('green'));
    expect(r.allow).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it('allows on missing health (default open during shadow→gating transition)', async () => {
    // Safety: partners whose Health snapshot hasn't been computed yet
    // must not be blocked. Operators see "no health data" as a UX
    // concern, not as gating denial.
    const { decideHealthGate } = await import('../gating');
    const r = decideHealthGate(null);
    expect(r.allow).toBe(true);
    expect(r.reason).toBeUndefined();
  });
});

// ── No-caller assertion (M01 scope guard) ──────────────────────────
//
// M01 ships infrastructure only. Any save-path action consuming
// `decideHealthGate` is M05's job. This test guards the boundary —
// if a caller leaks in during M01, it fails so we catch it at commit.

describe('decideHealthGate — M01 scope guard', () => {
  it('no save-path action imports decideHealthGate yet (M05 wires callers)', async () => {
    // Read the source files under src/actions and confirm none
    // imports decideHealthGate. The single permitted import in
    // relay-health-actions.ts is for the helper `evaluateHealthGate`,
    // which is itself dormant until M05 wires its callers.
    const { readFileSync, readdirSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');

    function walk(dir: string, files: string[] = []): string[] {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const s = statSync(full);
        if (s.isDirectory()) {
          if (entry === '__tests__' || entry === 'node_modules') continue;
          walk(full, files);
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
          files.push(full);
        }
      }
      return files;
    }

    const actionFiles = walk('src/actions');
    const importingDecide = actionFiles.filter((f) => {
      const src = readFileSync(f, 'utf-8');
      return /\bdecideHealthGate\b/.test(src);
    });
    // Expected: only relay-health-actions.ts imports decideHealthGate
    // (to wrap it in evaluateHealthGate). M05 will add more callers
    // and update this assertion.
    expect(importingDecide.map((f) => f.replace(/^.*\/actions\//, ''))).toEqual([
      'relay-health-actions.ts',
    ]);
  });
});
