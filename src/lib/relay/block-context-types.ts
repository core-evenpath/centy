// ── Block context types (PR fix-16) ─────────────────────────────────
//
// Single struct returned by `getBlockContextAction(partnerId, blockId)`.
// Test-chat (and any future consumer) gets one server roundtrip to know
// everything about a block firing in this partner's context: its
// schema (from relaySchemas, the /admin/relay/data canonical store),
// which Transaction Flow it belongs to, and whether the partner has
// bound or drifted from the schema.
//
// Replaces the older systemModules-driven dispatch — schema reads
// now flow through relaySchemas exclusively.

import type { BlockTag } from './engine-types';

export interface BlockContextField {
  /** Field name from the relaySchemas doc — e.g. "price". */
  name: string;
  /** Optional human-readable label. */
  label?: string;
  /** Field type from the schema (text / number / currency / ...). */
  type?: string;
  /** Whether the block actually reads this field (from block.reads[]). */
  isRead: boolean;
  /** Whether the schema marks this field required. */
  isRequired?: boolean;
}

export interface BlockContextSchema {
  /** Schema slug — same as `block.module`. */
  slug: string;
  /** Display name from the relaySchemas doc. */
  name: string;
  /** Number of fields in the schema (cheap headline stat). */
  fieldCount: number;
  /** Per-field detail merged with block.reads[]. */
  fields: BlockContextField[];
  /** Fields the schema doesn't have but the block reads — drift. */
  drift: string[];
}

export interface BlockContextFlow {
  /** Engine slug, e.g. 'commerce' / 'booking'. */
  engine: BlockTag;
  /** UI label per flow-definitions.ts — e.g. 'Buying'. */
  label: string;
  /** Where this block sits in the flow's happy path. Null if the block
   *  isn't on the happy path (still returned for context completeness). */
  role: 'entry' | 'core' | 'exit' | null;
  /** Whether the block is required in the happy path. */
  required: boolean | null;
}

export interface BlockContextBinding {
  /** False when admin explicitly unbound this block via the per-block
   *  toggle on /admin/relay/data/[slug]. */
  isBound: boolean;
  /** Schema slug the block binds (mirrors `schema.slug` for convenience). */
  moduleSlug: string | null;
}

export interface BlockContext {
  block: {
    id: string;
    label: string;
    family: string;
    stage: string;
    desc?: string;
  };
  schema: BlockContextSchema | null;
  flow: BlockContextFlow | null;
  binding: BlockContextBinding;
}

export type SampleOrLive = 'sample' | 'live';
