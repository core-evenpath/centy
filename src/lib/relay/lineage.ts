// X02 — Lineage view (cross-engine block-usage visualization).
//
// For any given block id, compute a lineage record showing:
//   1. Which engines tag the block (from ALL_BLOCKS_DATA).
//   2. Which flow templates reference the block in their stages.
//   3. Which functionIds would include the block in their engine-scoped
//      catalog (derived from FUNCTION_TO_ENGINES + engine tags).
//
// Pure function: no Firestore reads, no partner-specific data. This is
// a build-time/static-time reflection over the registries + recipe.
// An admin UI can render it; tests assert the shape.
//
// Shadow-mode contract: lineage data is READ-ONLY — nothing about it
// can change block behavior, recipe routing, or health computation.
// It's an analytical lens over what's already shipped.

import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { FUNCTION_TO_ENGINES } from './engine-recipes';
import type { Engine } from './engine-types';

// Flow template registries — import each explicitly rather than via a
// shared index to avoid circular deps. Each registry exposes a map of
// functionId → SystemFlowTemplate.
import { COMMERCE_FLOW_TEMPLATES } from './flow-templates/commerce';
import { LEAD_FLOW_TEMPLATES } from './flow-templates/lead';
import { ENGAGEMENT_FLOW_TEMPLATES } from './flow-templates/engagement';
import { INFO_FLOW_TEMPLATES } from './flow-templates/info';

export interface BlockLineage {
  /** Block id from the registry. */
  blockId: string;
  /** Engines tagged on the block (from `engines: [...]`). */
  engines: Engine[];
  /**
   * Flow templates (identified by their `id`) that reference this block
   * in any stage's `blockTypes`. Sorted for determinism.
   */
  referencedByFlowTemplates: string[];
  /**
   * functionIds whose scoped catalog would include this block, based on:
   *   - partner engines (from FUNCTION_TO_ENGINES)
   *   - block engine tags (from ALL_BLOCKS_DATA)
   *
   * A block appears in a partner's catalog when any of the partner's
   * engines overlaps with the block's engine tags (or the block has
   * shared tag). Computed deterministically; sorted.
   */
  appliesToFunctionIds: string[];
}

/**
 * Build the full lineage record for a single block id, or null if the
 * block isn't in the registry.
 */
export function getBlockLineage(blockId: string): BlockLineage | null {
  type WithEngines = { id: string; engines?: Engine[] };
  const block = (ALL_BLOCKS_DATA as WithEngines[]).find((b) => b.id === blockId);
  if (!block) return null;

  const engines: Engine[] = block.engines ?? [];

  // Scan all flow-template registries for stages referencing this blockId.
  const referenced = new Set<string>();
  const registries = [
    COMMERCE_FLOW_TEMPLATES,
    LEAD_FLOW_TEMPLATES,
    ENGAGEMENT_FLOW_TEMPLATES,
    INFO_FLOW_TEMPLATES,
  ];
  for (const reg of registries) {
    const seenTemplateIds = new Set<string>();
    for (const tpl of Object.values(reg)) {
      if (seenTemplateIds.has(tpl.id)) continue;
      seenTemplateIds.add(tpl.id);
      const referencesBlock = tpl.stages.some((s) => s.blockTypes.includes(blockId));
      if (referencesBlock) referenced.add(tpl.id);
    }
  }

  // Apply-to: which functionIds include this block when scoped by engine.
  // Rule: if block has 'shared' tag, it applies everywhere. Otherwise,
  // intersect block.engines with partner.engines — any overlap means the
  // block is scope-eligible.
  const applies = new Set<string>();
  const isShared = engines.includes('shared' as Engine);
  for (const [fn, partnerEngines] of Object.entries(FUNCTION_TO_ENGINES)) {
    if (isShared || engines.length === 0) {
      applies.add(fn);
      continue;
    }
    const overlap = partnerEngines.some((e) => engines.includes(e));
    if (overlap) applies.add(fn);
  }

  return {
    blockId,
    engines: [...engines].sort(),
    referencedByFlowTemplates: [...referenced].sort(),
    appliesToFunctionIds: [...applies].sort(),
  };
}

/**
 * Build lineage records for every block in the registry. Deterministic
 * order (registry order). Pure function; safe to call from build steps
 * or admin-side rendering.
 */
export function buildAllBlockLineages(): BlockLineage[] {
  type WithEngines = { id: string; engines?: Engine[] };
  return (ALL_BLOCKS_DATA as WithEngines[])
    .map((b) => getBlockLineage(b.id))
    .filter((l): l is BlockLineage => l !== null);
}

/**
 * Summary counts — useful for X02 admin overview at a glance.
 */
export interface LineageSummary {
  totalBlocks: number;
  untaggedBlocks: string[];
  multiEngineBlocks: number;
  blocksReferencedByNoFlow: string[];
}

export function summarizeLineage(lineages: BlockLineage[]): LineageSummary {
  return {
    totalBlocks: lineages.length,
    untaggedBlocks: lineages
      .filter((l) => l.engines.length === 0)
      .map((l) => l.blockId)
      .sort(),
    multiEngineBlocks: lineages.filter((l) => l.engines.length >= 2).length,
    blocksReferencedByNoFlow: lineages
      .filter((l) => l.referencedByFlowTemplates.length === 0 && l.engines.length > 0)
      .map((l) => l.blockId)
      .sort(),
  };
}
