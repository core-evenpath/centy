// Engine-level health roll-up. Pure function.
//
// Given a partner's block snapshots, module snapshots, and (optional) flow
// definition, compute the EngineHealthDoc for one engine + the shared tag.
// Status determination:
//   red   — any canonical stage has 0 renderable blocks
//   amber — all stages covered but ≥1 unresolved binding or empty module
//   green — no issues at all
//
// The function touches `Date.now()` exactly once at the end to stamp
// `computedAt`. Every other output is deterministic for a given input.

import type { Engine } from '../engine-types';
import { computeBlockHealth, isBlockRenderable } from './block-health';
import { computeStageHealth } from './stage-health';
import {
  proposeBindFieldFixes,
  proposeEmptyModuleFix,
  proposeEnableBlockFix,
} from './fix-proposals';
import type {
  BlockSnapshot,
  ModuleSnapshot,
  FlowSnapshot,
  EngineHealthDoc,
  FixProposal,
  HealthStatus,
  StageHealth,
} from './types';
import { BOOKING_CANONICAL_STAGES } from './types';

export interface ComputeEngineHealthInput {
  partnerId: string;
  engine: Engine;
  blocks: BlockSnapshot[];
  modules: Record<string, ModuleSnapshot>; // slug -> snapshot
  flow: FlowSnapshot | null;
  canonicalStages?: readonly string[]; // default: BOOKING_CANONICAL_STAGES
}

function blockMatchesEngine(block: BlockSnapshot, engine: Engine): boolean {
  if (!block.engines || block.engines.length === 0) return false;
  return block.engines.includes(engine) || block.engines.includes('shared');
}

export function computeEngineHealth(
  input: ComputeEngineHealthInput,
): EngineHealthDoc {
  const {
    partnerId,
    engine,
    blocks,
    modules,
    flow,
    canonicalStages = BOOKING_CANONICAL_STAGES,
  } = input;

  // 1. Filter blocks to engine + shared
  const engineBlocks = blocks.filter((b) => blockMatchesEngine(b, engine));

  // 2. Compute per-block health (pure, no mutation)
  const blockHealths = engineBlocks.map((b) => ({
    block: b,
    health: computeBlockHealth(b, flow),
  }));

  // 3. Group by stage and compute stage health
  const stageHealths: StageHealth[] = [];
  for (const stageId of canonicalStages) {
    const stageBlocks = engineBlocks.filter((b) => b.stage === stageId);
    stageHealths.push(computeStageHealth(stageId, stageBlocks));
  }

  // 4. Detect orphans / unresolved / empties
  const orphanBlocks: Array<{ blockId: string; reason: string }> = [];
  const orphanFlowTargets: Array<{ flowId: string; stageId: string; blockId: string }> = [];
  const unresolvedBindings: Array<{ blockId: string; field: string; reason: string }> = [];
  const emptyModules: string[] = [];
  const fixProposals: FixProposal[] = [];

  // 4a. Orphan blocks: tagged + enabled but the flow doesn't reference them
  //     OR block is enabled but no required field is bound.
  for (const { block, health } of blockHealths) {
    if (!block.enabled) continue;
    if (flow && !health.hasFlowReference) {
      orphanBlocks.push({
        blockId: block.id,
        reason: 'Block is enabled but no flow stage references it',
      });
    }
    if (health.fieldsMissing > 0) {
      for (const field of block.requiredFields) {
        const b = block.fieldBindings[field];
        if (!b || !b.bound) {
          unresolvedBindings.push({
            blockId: block.id,
            field,
            reason: 'Required field has no binding',
          });
        }
      }
    }
  }

  // 4b. Orphan flow targets: flow references a block the partner doesn't have
  //     enabled (or that isn't tagged for this engine).
  if (flow) {
    const engineBlockIds = new Set(engineBlocks.map((b) => b.id));
    const enabledBlockIds = new Set(
      engineBlocks.filter((b) => b.enabled).map((b) => b.id),
    );
    for (const stage of flow.stages) {
      for (const blockId of stage.blockIds) {
        if (!engineBlockIds.has(blockId)) {
          orphanFlowTargets.push({
            flowId: flow.flowId,
            stageId: stage.stageId,
            blockId,
          });
        } else if (!enabledBlockIds.has(blockId)) {
          fixProposals.push(proposeEnableBlockFix(blockId));
        }
      }
    }
  }

  // 4c. Empty modules: module is connected to an enabled block but has 0 items.
  const touchedModules = new Set<string>();
  for (const { block } of blockHealths) {
    if (!block.enabled) continue;
    if (!block.moduleSlug) continue;
    if (touchedModules.has(block.moduleSlug)) continue;
    touchedModules.add(block.moduleSlug);
    const m = modules[block.moduleSlug];
    if (m && m.itemCount === 0) {
      emptyModules.push(block.moduleSlug);
      fixProposals.push(proposeEmptyModuleFix(block.id, block.moduleSlug));
    }
  }

  // 4d. Bind-field proposals for unresolved bindings where a module match is possible
  for (const { block } of blockHealths) {
    if (!block.enabled) continue;
    if (!block.moduleSlug) continue;
    const module = modules[block.moduleSlug] ?? null;
    const ps = proposeBindFieldFixes(block, module);
    for (const p of ps) fixProposals.push(p);
  }

  // 5. Status roll-up
  const anyRedStage = stageHealths.some((s) => s.status === 'red');
  const anyAmberSignal =
    stageHealths.some((s) => s.status === 'amber') ||
    unresolvedBindings.length > 0 ||
    emptyModules.length > 0 ||
    orphanFlowTargets.length > 0;

  let status: HealthStatus;
  if (anyRedStage) status = 'red';
  else if (anyAmberSignal) status = 'amber';
  else status = 'green';

  // 6. Stamp computedAt — the ONE allowed non-deterministic call.
  return {
    partnerId,
    engine,
    status,
    computedAt: Date.now(),
    stages: stageHealths,
    orphanBlocks,
    orphanFlowTargets,
    unresolvedBindings,
    emptyModules,
    fixProposals,
  };
}

/**
 * Convenience: recompute for all engines in the partner's set at once.
 * Returns an array — caller decides storage strategy (M07).
 */
export function computeAllEngineHealths(
  partnerId: string,
  engines: Engine[],
  blocks: BlockSnapshot[],
  modules: Record<string, ModuleSnapshot>,
  flow: FlowSnapshot | null,
): EngineHealthDoc[] {
  return engines.map((engine) =>
    computeEngineHealth({ partnerId, engine, blocks, modules, flow }),
  );
}
