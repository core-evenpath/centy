// ── Flow → Block allowlist helpers ─────────────────────────────────────
//
// Pure helpers consumed by both the chat route and the seed endpoint.
// The flow engine's `FlowEngineDecision.suggestedBlockTypes` is the
// authoritative source for which block ids are valid at any point in
// a conversation; callers validate Gemini's block choice against this
// list so the admin-configured flow is respected.
//
// No Firestore, no AI — trivially testable.

import type { FlowDefinition, FlowEngineDecision, FlowStage } from '@/lib/types-flow-engine';

/**
 * Compute the set of blockIds allowed under the current flow state.
 * Order of preference:
 *   1. `flowDecision.suggestedBlockTypes` — what the engine says fits
 *      the visitor's current stage + intent.
 *   2. Union of every stage's `blockTypes` — "any block reachable in
 *      this flow" fallback when the engine can't produce a decision.
 *   3. Empty array — caller falls back to the function-level catalog.
 */
export function allowedBlocksFromFlow(
  flowDecision: FlowEngineDecision | null,
  flowDef: FlowDefinition | null,
): string[] {
  if (flowDecision?.suggestedBlockTypes?.length) {
    return Array.from(new Set(flowDecision.suggestedBlockTypes));
  }
  if (flowDef?.stages?.length) {
    const all = new Set<string>();
    for (const stage of flowDef.stages) {
      for (const id of stage.blockTypes ?? []) all.add(id);
    }
    return Array.from(all);
  }
  return [];
}

/**
 * Lightweight validator — true when the blockId fits the current flow.
 * An empty allow-list is treated as permissive so pre-flow partners
 * keep working.
 */
export function isBlockAllowedByFlow(
  blockId: string,
  flowDecision: FlowEngineDecision | null,
  flowDef: FlowDefinition | null,
): boolean {
  const allowed = allowedBlocksFromFlow(flowDecision, flowDef);
  if (allowed.length === 0) return true;
  return allowed.includes(blockId);
}

/**
 * Resolve a flow's entry stage — the one flagged `isEntry`, otherwise
 * the first stage in the list. Returns null for a missing flow.
 */
export function getEntryStage(
  flowDef: FlowDefinition | null,
): FlowStage | null {
  if (!flowDef?.stages?.length) return null;
  return flowDef.stages.find((s) => s.isEntry) ?? flowDef.stages[0];
}

/**
 * Lookup helper — find a stage by id in a flow definition.
 */
export function findStageById(
  flowDef: FlowDefinition | null,
  stageId: string | undefined,
): FlowStage | null {
  if (!flowDef?.stages || !stageId) return null;
  return flowDef.stages.find((s) => s.id === stageId) ?? null;
}
