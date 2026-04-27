// ── Food & Beverage curated schemas (vertical aggregator) ───────────
//
// Each slug in this vertical lives in its own file (Steps 2–12 of the
// curated-schema rework). Add a new slug:
//
//   1. create `./menu.ts` (or whichever slug)
//   2. add the matching import below
//   3. register it in `schemas`
//
// Slugs not in this map fall through to writeRelaySchemaFromBlocks
// (the deterministic block.reads[] union seed) — never broken, just
// less rich until a curation is authored.

import type { CuratedSchema } from '../types';

// Per-slug imports go here. Example for Step 2:
//   import menu from './menu';
import menu from './menu';
import beverage from './beverage';
import booking from './booking';
import marketing from './marketing';
import info from './info';

const schemas: Record<string, CuratedSchema> = {
  food_beverage_menu: menu,
  food_beverage_beverage: beverage,
  food_beverage_booking: booking,
  food_beverage_marketing: marketing,
  food_beverage_info: info,
  // food_beverage_people: people,
  // food_beverage_social_proof: socialProof,
  // food_beverage_events: events,
  // food_beverage_preferences: preferences,
  // food_beverage_operations: operations,
  // food_beverage_ordering: ordering,
};

export default schemas;
