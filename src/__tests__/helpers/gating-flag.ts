// Test helper for running a block with `HEALTH_GATING_ENABLED` swapped
// on or off. Extracted from P3.M01 gating tests; P3.M05 adds more
// flag-dependent tests and benefits from the shared pattern.
//
// Usage:
//
//   it('denies on red when gating is on', async () => {
//     await withGatingEnabled(true, async () => {
//       const { decideHealthGate } = await import('@/lib/relay/health/gating');
//       expect(decideHealthGate(red).allow).toBe(false);
//     });
//   });
//
// The helper resets the module cache before and after the block so that
// modules reading `HEALTH_GATING_ENABLED` at import time pick up the
// mocked value, and subsequent tests see the production default.

import { vi } from 'vitest';

export async function withGatingEnabled<T>(
  enabled: boolean,
  fn: () => Promise<T> | T,
): Promise<T> {
  vi.resetModules();
  vi.doMock('@/lib/feature-flags', () => ({
    HEALTH_GATING_ENABLED: enabled,
  }));
  try {
    return await fn();
  } finally {
    vi.resetModules();
    vi.doUnmock('@/lib/feature-flags');
  }
}
