// ── Curated schema registry (top-level loader) ──────────────────────
//
// Aggregates every vertical's per-slug curations into one lookup. The
// apply action (src/actions/relay-schema-apply-curated.ts) consumes
// `getCuratedSchemaForSlug` here; bulk regeneration falls through to
// `writeRelaySchemaFromBlocks` for slugs without a curation.
//
// Adding a new vertical: create the folder, drop in per-slug TS files,
// the aggregator imports them, and spread the aggregator into ALL
// below.

import foodBeverage from './food_beverage';
import shared from './shared';
import type { CuratedSchema } from './types';

const ALL: Record<string, CuratedSchema> = {
  ...foodBeverage,
  ...shared,
};

/**
 * Curated definition for a slug, or null when none exists. Caller
 * should fall through to the deterministic block.reads[] seed.
 */
export function getCuratedSchemaForSlug(slug: string): CuratedSchema | null {
  if (!slug) return null;
  return ALL[slug] ?? null;
}

/**
 * Slugs covered by curated definitions. Used by the admin viewer to
 * decide whether the "Apply curated schema" affordance is enabled,
 * and by tests to surface coverage.
 */
export function curatedSlugs(): string[] {
  return Object.keys(ALL).sort();
}

export type { CuratedField, CuratedSchema } from './types';
