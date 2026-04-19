// Health checker public API (M06).

export type {
  HealthStatus,
  BlockHealth,
  StageHealth,
  FixProposal,
  FixProposalKind,
  FixConfidence,
  EngineHealthDoc,
  BlockSnapshot,
  ModuleSnapshot,
  FlowSnapshot,
} from './types';
export type { ComputeEngineHealthInput } from './engine-health';

export { BOOKING_CANONICAL_STAGES } from './types';

export { computeBlockHealth, isBlockRenderable } from './block-health';
export { computeStageHealth } from './stage-health';
export { computeEngineHealth, computeAllEngineHealths } from './engine-health';
export {
  levenshtein,
  levenshteinSimilarity,
  tokenOverlapSimilarity,
  fieldSimilarity,
  FIX_MATCH_THRESHOLD,
  proposeBindFieldFixes,
  proposeEmptyModuleFix,
  proposeConnectFlowFix,
  proposeEnableBlockFix,
} from './fix-proposals';

// X05 Health gating policy (P3.M01). No callers consume this yet;
// P3.M05 (Session 2) wires save-path callers. Shipped in P3.M01 so the
// policy decision lives in one place when it's needed.
export { decideHealthGate } from './gating';
export type { GatingDecision } from './gating';
