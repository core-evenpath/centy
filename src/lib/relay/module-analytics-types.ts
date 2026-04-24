// ── Module analytics types ──────────────────────────────────────────────
//
// Shapes returned by `/admin/relay/modules`. Kept here (no
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

export interface RelayModuleAnalytics {
  connectedBlocks: BlockModuleBinding[];
  darkBlocks: BlockModuleBinding[];
  modules: ModuleBlockUsage[];

  totalBlocks: number;
  blocksWithModules: number;
  darkBlockCount: number;
  totalModules: number;
}

export interface SimpleBlockRef {
  blockId: string;
  blockLabel: string;
  verticals: string[];
}
