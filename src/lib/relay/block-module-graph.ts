// ── Block ↔ module graph helpers (pure) ─────────────────────────────
//
// Derivation utilities that operate on the in-memory block registry +
// systemModule schema. No Firestore, no async, no React — so this file
// is safe to import from server actions, client components, and tests.
//
// Consumed by `getRelayModuleAnalyticsAction` (PR B) and the UX rework
// in `/admin/relay/modules` (PR D).

import type { ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import type { BlockTag } from '@/lib/relay/engine-types';

/**
 * All blocks whose `.module` field matches the given slug. Stable order
 * (same as registry input).
 */
export function getBlocksForModule(
  moduleSlug: string,
  allBlocks: ReadonlyArray<ServerBlockData>,
): ServerBlockData[] {
  return allBlocks.filter((b) => b.module === moduleSlug);
}

/**
 * Unique, alphabetically sorted engine tags across every block that
 * binds this module. Empty array when no annotated blocks exist (the
 * module is real but untagged) — callers render that as "engines TBD".
 */
export function getEnginesForModule(
  moduleSlug: string,
  allBlocks: ReadonlyArray<ServerBlockData>,
): BlockTag[] {
  const tags = new Set<BlockTag>();
  for (const block of getBlocksForModule(moduleSlug, allBlocks)) {
    for (const tag of block.engines ?? []) tags.add(tag);
  }
  return Array.from(tags).sort();
}

export interface FieldDrift {
  /** Fields the block reads that don't exist in the module schema. */
  missing: string[];
  /** Fields the block reads that ARE present in the module schema. */
  ok: string[];
  /** True when the block has no `reads` annotation yet (PR C fills these). */
  unannotated: boolean;
}

/**
 * Compare a block's declared `reads` against the actual module schema
 * field names. `schemaFields` is the list of `ModuleFieldDefinition.name`
 * from the live `systemModule`. When the block has no `reads` declared,
 * returns `unannotated: true` and empty arrays — drift checking is
 * opt-in.
 */
export function getFieldDriftForBlock(
  block: Pick<ServerBlockData, 'reads'>,
  schemaFields: ReadonlyArray<string>,
): FieldDrift {
  const reads = block.reads;
  if (!reads || reads.length === 0) {
    return { missing: [], ok: [], unannotated: true };
  }
  const schema = new Set(schemaFields);
  const missing: string[] = [];
  const ok: string[] = [];
  for (const field of reads) {
    if (schema.has(field)) ok.push(field);
    else missing.push(field);
  }
  return { missing, ok, unannotated: false };
}

/**
 * True when a module-less block has declared a reason (PR A contract).
 * Module-less blocks without a reason are "unjustified" and should
 * surface as a gentle nudge to annotate, not as a broken binding.
 */
export function isJustifiedModuleLess(
  block: Pick<ServerBlockData, 'module' | 'noModuleReason'>,
): boolean {
  return block.module === null && !!block.noModuleReason;
}
