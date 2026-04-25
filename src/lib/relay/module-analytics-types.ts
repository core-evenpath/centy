// ── Module analytics types ──────────────────────────────────────────────
//
// Shapes returned by `/admin/relay/data`. Kept here (no
// `'use server'` / `server-only`) so the client view component can
// import the types without pulling the action module into the client
// bundle.

import type { BlockTag } from '@/lib/relay/engine-types';
import type { NoModuleReason } from '@/app/admin/relay/blocks/previews/_schema-contract';

export interface BlockModuleBinding {
  blockId: string;
  blockLabel: string;
  blockFamily: string;
  blockStatus: 'active' | 'new' | 'planned';
  verticals: string[];

  moduleSlug: string | null;
  moduleConnected: boolean;
  moduleName?: string;
  moduleItemCount?: number;

  isDark: boolean;        // Needs a module but no partner data yet
  isConfigured: boolean;  // Has a relayBlockConfigs doc

  // ── PR B additions ────────────────────────────────────────────────
  //
  // New optional fields derived from the schema contract (PR A). The
  // existing UX (PR <D) ignores these, so legacy consumers don't break.
  // PR D rebuckets the UI around `noModuleReason` and `driftFields`.
  /** Field names this block reads (from block.reads). */
  reads?: string[];
  /** Engine tags from the block definition (unchanged copy for UI). */
  engines?: BlockTag[];
  /** Reason this block has no module binding, if declared. */
  noModuleReason?: NoModuleReason;
  /** Subset of `reads` that aren't present in the module schema. */
  driftFields?: string[];
  /** Field names from the module's live schema (for side-by-side UI). */
  moduleSchemaFields?: string[];

  // ── PR E11 ────────────────────────────────────────────────────────
  /**
   * False when admin has explicitly unbound this block from its
   * schema via the per-block toggle on /admin/relay/data/[slug].
   * Default true (binding is the expected case). Unbound blocks
   * skip drift detection and render dimmed in the consumer panel.
   */
  bindsSchema?: boolean;
}

export interface ModuleBlockUsage {
  moduleId: string;
  moduleSlug: string;
  moduleName: string;
  moduleColor: string;

  connectedBlocks: {
    blockId: string;
    blockLabel: string;
    verticals: string[];
  }[];

  itemCount: number;
  partnerCount: number;

  // ── PR B additions ────────────────────────────────────────────────
  /** Union of engines across every block that binds this module. */
  engines?: BlockTag[];
  /** Field names from the module's schema (for drift comparison in UI). */
  schemaFields?: string[];
}

// ── PR fix-9: pipeline health + recent runs ────────────────────────

/**
 * Actionable issues found by walking the registry + relaySchemas
 * collection. Surfaced on /admin/relay/data so admin can spot what
 * needs fixing without hunting through tabs.
 */
export interface PipelineGaps {
  /** Slugs referenced by `block.module` that have no relaySchemas doc. */
  missingSchemas: string[];
  /** Schemas with `schema.fields.length === 0` — broken seed. */
  emptySchemas: string[];
  /** Schemas with no consumer blocks in the current registry — orphan slugs. */
  orphanSchemas: string[];
  /** Total blocks with non-empty driftFields (already in BlockModuleBinding). */
  driftBlocks: number;
  /** Total blocks with bindsSchema === false. */
  unboundBlocks: number;
}

/**
 * One recent generate/enrich/edit event per schema. Sourced from the
 * provenance timestamps stored on each relaySchemas doc. Sorted by
 * most-recent-first.
 */
export interface RecentRun {
  slug: string;
  schemaName?: string;
  /** ISO timestamp of the most recent provenance event on this schema. */
  at: string;
  /** What kind of run produced the latest state. */
  kind: 'enriched' | 'edited' | 'generated';
  /** Number of fields the schema currently has. */
  fieldCount: number;
  /** Model used if kind === 'enriched'. */
  model?: string;
  /** Number of fields appended in the last enrichment, when known. */
  enrichedFieldCount?: number;
}

export interface RelayModuleAnalytics {
  connectedBlocks: BlockModuleBinding[];
  darkBlocks: BlockModuleBinding[];
  modules: ModuleBlockUsage[];

  totalBlocks: number;
  blocksWithModules: number;
  darkBlockCount: number;
  totalModules: number;

  // PR fix-9
  pipelineGaps?: PipelineGaps;
  recentRuns?: RecentRun[];
}

export interface SimpleBlockRef {
  blockId: string;
  blockLabel: string;
  verticals: string[];
}
