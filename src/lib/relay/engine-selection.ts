// Sticky active-engine selection (M11).
//
// Pure function. Given a session's current activeEngine, the latest
// intent's engineHint and confidence, and the partner's engine set,
// return the new active engine along with a reason tag the orchestrator
// logs for debugging.
//
// Rules:
//   1. Weak hints NEVER switch.
//   2. A strong hint for a DIFFERENT engine that's in partnerEngines →
//      switch-strong-hint.
//   3. Current engine still in partnerEngines → sticky.
//   4. No current engine but partnerEngines non-empty → fallback-first
//      (first engine in partnerEngines — deterministic ordering comes
//      from M03's engine-recipes.ts which sorts by the canonical ENGINES
//      tuple).
//   5. partnerEngines empty → fallback-none (engine resolution fails
//      gracefully; M12 orchestrator will treat this like the legacy
//      no-engine path).
//
// Service overlay is a normal switch target, no special code path.

import type { Engine } from './engine-types';
import type { EngineConfidence } from './engine-keywords';

export type EngineSelectionReason =
  | 'sticky'
  | 'switch-strong-hint'
  | 'fallback-first'
  | 'fallback-none';

export interface EngineSelectionInput {
  currentActive: Engine | null | undefined;
  engineHint?: Engine;
  engineConfidence: EngineConfidence;
  partnerEngines: readonly Engine[];
}

export interface EngineSelectionResult {
  engine: Engine | null;
  reason: EngineSelectionReason;
}

export function selectActiveEngine(
  input: EngineSelectionInput,
): EngineSelectionResult {
  const { currentActive, engineHint, engineConfidence, partnerEngines } = input;

  // Rule 2: strong hint → switch, but only if the target is in the
  // partner's engine set AND differs from the current active.
  if (
    engineConfidence === 'strong' &&
    engineHint &&
    partnerEngines.includes(engineHint) &&
    engineHint !== currentActive
  ) {
    return { engine: engineHint, reason: 'switch-strong-hint' };
  }

  // Rule 3: stick with the current active if it's still valid.
  if (currentActive && partnerEngines.includes(currentActive)) {
    return { engine: currentActive, reason: 'sticky' };
  }

  // Rule 4: no (valid) current, but the partner has engines — pick the
  // first as fallback. partnerEngines is already sorted by the canonical
  // ENGINES tuple (see engine-recipes.ts).
  if (partnerEngines.length > 0) {
    return { engine: partnerEngines[0], reason: 'fallback-first' };
  }

  // Rule 5: nothing to pick.
  return { engine: null, reason: 'fallback-none' };
}
