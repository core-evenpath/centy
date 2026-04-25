// ── Relay vertical list (client + server safe) ──────────────────────
//
// Authoritative list of vertical ids used across the Relay rollout.
// Mirrors the per-vertical folder layout under
// src/app/admin/relay/blocks/previews/ plus 'shared' for the
// cross-vertical bucket (greeting, cart, contact, etc.).
//
// Lives outside any 'use server' file so the consts + sync helpers
// can be imported from both client components (VerticalEnrichButton)
// and server actions (generateAndEnrichVerticalAction).

export const RELAY_VERTICALS = [
  'automotive',
  'business',
  'ecommerce',
  'education',
  'events_entertainment',
  'financial_services',
  'food_beverage',
  'food_supply',
  'healthcare',
  'home_property',
  'hospitality',
  'personal_wellness',
  'public_nonprofit',
  'travel_transport',
  'shared',
] as const;

export type RelayVertical = (typeof RELAY_VERTICALS)[number];

/**
 * Resolve a schema slug to its owning vertical.
 *
 * Slugs are formatted `<vertical>_<family>`; vertical names can
 * themselves contain underscores (`events_entertainment`). Match by
 * longest-prefix-wins so `events_entertainment_catalog` resolves to
 * `events_entertainment` rather than the (non-existent) `events`.
 *
 * Returns null when no vertical matches — call site decides what to
 * do with orphan slugs.
 */
export function getVerticalForSlug(slug: string): RelayVertical | null {
  const sorted = [...RELAY_VERTICALS].sort((a, b) => b.length - a.length);
  for (const v of sorted) {
    if (slug === v || slug.startsWith(`${v}_`)) return v;
  }
  return null;
}
