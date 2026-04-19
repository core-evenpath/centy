// X05 Health gating policy (P3.M01).
//
// Single decision function consulted by any save-path action that
// might gate on Health. The flag `HEALTH_GATING_ENABLED` controls
// whether the policy actually denies; when false, every call returns
// allow with reason 'gating-disabled' (shadow-mode parity).
//
// This module is shipped in P3.M01 with no callers. P3.M05 (Session 2)
// wires save-path callers; P3.M01-flip (Session 2) flips
// HEALTH_GATING_ENABLED to true.
//
// Safety design:
//   - Missing health → allow (default open). The shadow→gating
//     transition must not block partners whose Health hasn't been
//     computed yet. Operators see "no health data" as a separate UX
//     concern, not as gating denial.
//   - Amber → allow. Only red blocks. Amber is "review recommended,"
//     not "block."
//   - Red + flag on → deny with reason 'health-red'.
//   - Red + flag off → allow with reason 'gating-disabled'.

import { HEALTH_GATING_ENABLED } from '@/lib/feature-flags';
import type { EngineHealthDoc } from './types';

export interface GatingDecision {
  allow: boolean;
  reason?: 'health-red' | 'gating-disabled';
}

/**
 * Decide whether a save should proceed given the partner+engine's
 * current Health. Pure function — no Firestore reads, no side effects.
 *
 * Callers fetch the Health doc themselves (e.g. via `getEngineHealth`)
 * and pass it in. Passing `null` means "Health hasn't been computed"
 * and is allowed (default open) so the shadow→gating transition
 * doesn't block partners whose snapshot is missing.
 */
export function decideHealthGate(health: EngineHealthDoc | null): GatingDecision {
  if (!HEALTH_GATING_ENABLED) {
    return { allow: true, reason: 'gating-disabled' };
  }
  if (health?.status === 'red') {
    return { allow: false, reason: 'health-red' };
  }
  return { allow: true };
}
