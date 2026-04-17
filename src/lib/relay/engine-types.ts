// Relay Engine Architecture — canonical type definitions.
//
// Six engines scope every conversational surface the Relay platform
// exposes. Tagging a block, flow, partner, or session with one of these
// drives what a visitor sees and what the orchestrator considers in
// scope for the next turn.
//
// The `shared` tag is NOT an engine; it marks cross-cutting blocks
// (greeting, contact, promo, etc.) that are available regardless of the
// active engine. Block taggings accept `Engine | 'shared'`; flows,
// partners, and sessions never use `'shared'`.
//
// M01 is types-only. No consumers are wired in this milestone; callers
// appear in M02+ once the schema fields exist to reference these.

export const ENGINES = [
  'commerce',
  'booking',
  'lead',
  'engagement',
  'info',
  'service',
] as const;

export type Engine = (typeof ENGINES)[number];

export const BLOCK_TAGS = [...ENGINES, 'shared'] as const;

export type BlockTag = (typeof BLOCK_TAGS)[number];

const ENGINE_SET: ReadonlySet<string> = new Set(ENGINES);
const BLOCK_TAG_SET: ReadonlySet<string> = new Set(BLOCK_TAGS);

export function isEngine(x: unknown): x is Engine {
  return typeof x === 'string' && ENGINE_SET.has(x);
}

export function isBlockTag(x: unknown): x is BlockTag {
  return typeof x === 'string' && BLOCK_TAG_SET.has(x);
}
