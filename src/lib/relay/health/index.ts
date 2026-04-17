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
