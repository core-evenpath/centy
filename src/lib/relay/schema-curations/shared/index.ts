// ── Shared (cross-vertical) curated schemas (vertical aggregator) ───
//
// The `shared_*` slugs that every vertical's partner sees on
// /partner/relay/data — checkout, confirmation, marketing,
// conversation, navigation. Each lives in its own file (Steps 13–17
// of the curated-schema rework). Add a new slug:
//
//   1. create `./marketing.ts` (or whichever slug)
//   2. add the matching import below
//   3. register it in `schemas`

import type { CuratedSchema } from '../types';

// Per-slug imports go here. Example:
//   import marketing from './marketing';

const schemas: Record<string, CuratedSchema> = {
  // shared_marketing: marketing,
  // shared_checkout: checkout,
  // shared_confirmation: confirmation,
  // shared_conversation: conversation,
  // shared_navigation: navigation,
};

export default schemas;
