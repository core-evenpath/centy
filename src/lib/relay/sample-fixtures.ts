// ── Sample-data fixtures (Phase 4) ──────────────────────────────────
//
// Curated sample items per Relay schema slug, used by the partner-side
// "Generate sample data" CTA. Replaces the deterministic generator's
// generic "Sample category 1" output with realistic, slug-aware
// content that actually shows partners what their chat will look
// like.
//
// Source of truth is `sample-fixtures.json` next to this file —
// human-editable, tracked in git, no Firestore round-trip. Slugs not
// present in the JSON fall through to the deterministic generator
// in `relay-sample-data-actions.ts` so coverage gaps are graceful.

import fixtures from './sample-fixtures.json';

export interface FixtureItem {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  isActive?: boolean;
  images?: string[];
  fields?: Record<string, unknown>;
}

// `_meta` is documentation inside the JSON (purpose / schema notes).
// Strip it from the typed lookup so consumers only see real slugs.
const FIXTURE_MAP: Record<string, FixtureItem[]> = Object.fromEntries(
  Object.entries(fixtures as Record<string, unknown>).filter(
    ([key, value]) => !key.startsWith('_') && Array.isArray(value),
  ),
) as Record<string, FixtureItem[]>;

/**
 * Curated sample items for the given Relay schema slug, or null when
 * none exist. Caller should fall back to the deterministic generator
 * when this returns null.
 */
export function getFixtureItemsForSlug(slug: string): FixtureItem[] | null {
  if (!slug) return null;
  const items = FIXTURE_MAP[slug];
  return items && items.length > 0 ? items : null;
}

/**
 * Slugs that have curated fixtures. Used by tests + future admin UI
 * to show coverage at a glance.
 */
export function fixtureCoverageSlugs(): string[] {
  return Object.keys(FIXTURE_MAP).sort();
}
