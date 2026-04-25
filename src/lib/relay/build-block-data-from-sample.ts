// ── Sample-mode block data (PR fix-16a) ────────────────────────────
//
// Returns the block's design-sample envelope from the runtime block
// registry — the `sampleData` that ships alongside every BlockDefinition
// in src/lib/relay/blocks/**. This is the new default path for
// /partner/relay/test-chat: a partner with zero modules configured can
// still drive the bot through every block using its sample data, then
// flip a "Use my live data" toggle when ready.
//
// Why this is decoupled from buildBlockData:
//   - buildBlockData hits Firestore (partnerData + modules); too heavy
//     for the "open test-chat, see something" UX.
//   - sampleData on the BlockDefinition is the canonical demo payload
//     authored alongside the block component — same data the admin
//     gallery previews render against.
//
// Currency thread (from PR fix-15) is preserved: if the partner has
// `businessPersona.identity.currency` set, the sample envelope picks
// it up so the renderer formats prices in the partner's currency
// (₹ INR → $ USD without changing sample shapes).

import { getBlock } from './registry';

export interface BuildSampleInput {
  blockId: string;
  /** Optional partner doc — only used to thread currency. The sample
   *  data itself is partner-independent. */
  partnerData?: Record<string, any> | null;
}

/**
 * Build the sample-mode block data envelope. Returns `undefined`
 * when the block isn't in the runtime registry (test-chat falls back
 * to no-data render in that case).
 *
 * Be sure to import the block registry index first (`@/lib/relay/blocks`)
 * to ensure all blocks have been registered — otherwise `getBlock`
 * returns undefined for blocks the test runner hasn't loaded.
 */
export function buildBlockDataFromSample({
  blockId,
  partnerData,
}: BuildSampleInput): Record<string, unknown> | undefined {
  const entry = getBlock(blockId);
  if (!entry) return undefined;

  const sample = entry.definition.sampleData;
  if (!sample || typeof sample !== 'object') return undefined;

  // Shallow clone so callers can mutate without touching the registry.
  const data: Record<string, unknown> = { ...sample };

  // Currency thread (mirrors PR fix-15 in admin-block-data.ts).
  if (!data.currency) {
    const personaCurrency =
      partnerData?.businessPersona?.identity?.currency;
    if (typeof personaCurrency === 'string' && personaCurrency.trim()) {
      data.currency = personaCurrency.trim().toUpperCase();
    }
  }

  return data;
}
