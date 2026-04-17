// Health checker types (M06).
//
// Pure, deterministic shapes describing the "is this engine coherently
// wired?" state of a partner. Written to Firestore by the M07 save-hook
// wrapper, in shadow mode. Never gates publishes in Phase 1.

import type { Engine } from '../engine-types';
import type { Health as FieldHealth } from '../binding-health';

export type HealthStatus = 'green' | 'amber' | 'red';

export interface BlockHealth {
  blockId: string;
  status: FieldHealth; // uses the 4-state primitive from binding-health
  hasFlowReference: boolean;
  hasModuleConnection: boolean;
  fieldsOk: number;
  fieldsEmpty: number;
  fieldsMissing: number;
}

export interface StageHealth {
  stageId: string;
  status: HealthStatus;
  blockCount: number;
  blocksWithData: number;
}

export type FixProposalKind =
  | 'bind-field'
  | 'enable-block'
  | 'connect-flow'
  | 'populate-module';

export type FixConfidence = 'high' | 'medium' | 'low';

export interface FixProposal {
  kind: FixProposalKind;
  blockId?: string;
  field?: string;
  moduleSlug?: string;
  sourceField?: string;
  confidence: FixConfidence;
  reason: string;
  payload: Record<string, unknown>;
}

export interface EngineHealthDoc {
  partnerId: string;
  engine: Engine;
  status: HealthStatus;
  computedAt: number; // ms since epoch; only non-deterministic piece
  stages: StageHealth[];
  orphanBlocks: Array<{ blockId: string; reason: string }>;
  orphanFlowTargets: Array<{ flowId: string; stageId: string; blockId: string }>;
  unresolvedBindings: Array<{ blockId: string; field: string; reason: string }>;
  emptyModules: string[];
  fixProposals: FixProposal[];
}

// ── Inputs (plain data, no I/O) ─────────────────────────────────────────
//
// The Health checker is a pure function that takes snapshots of the partner's
// blocks, modules, and (optional) flow as plain data. Loading happens
// elsewhere (M07 save-hook wrapper, admin UI). The snapshots are deliberately
// narrow so the check remains fast and deterministic.

export interface BlockSnapshot {
  id: string;                         // block id ('room_card' etc.)
  engines?: string[];                 // from M04 tagging
  stage: string;                      // canonical stage id
  requiredFields: string[];           // fields_req
  optionalFields: string[];           // fields_opt
  moduleSlug: string | null;          // from UnifiedBlockConfig.module
  enabled: boolean;                   // partner override: isVisible
  fieldBindings: Record<string, {     // per-field binding state
    bound: boolean;
    resolvedNonEmpty: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    sourceField?: string;             // for bind-field proposals
  }>;
}

export interface ModuleSnapshot {
  slug: string;                       // 'room_inventory' etc.
  itemCount: number;                  // > 0 means populated
  fieldCatalog: Array<{               // fields available on items
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  }>;
}

export interface FlowSnapshot {
  flowId: string;
  stages: Array<{
    stageId: string;
    blockIds: string[];               // ids the flow suggests for this stage
  }>;
}

// The canonical booking stage order (from M05). Used by `computeEngineHealth`
// to decide whether a stage is missing. Exposed here (not hard-coded inside
// the checker) so callers with different engines can pass their own.
export const BOOKING_CANONICAL_STAGES = [
  'greeting',
  'discovery',
  'showcase',
  'comparison',
  'conversion',
  'followup',
  'handoff',
] as const;
