'use server';

// ── Bulk per-vertical generate + enrich (PR-fix-1) ──────────────────
//
// Consolidates the two-step bootstrap workflow ("Generate from block
// registry" → 153 thin schemas, then "Suggest richer fields" 153×)
// into one click per vertical:
//
//   pickVertical → click Run → for each schema in that vertical:
//     1. write the deterministic seed (PR E7/E8 union-of-reads)
//     2. ask Gemini for additional industry-standard fields
//     3. auto-append all suggestions (no per-field diff review)
//
// Auto-accept is intentional: bulk runs are for the rapid bootstrap,
// not curation. Admin can still drill into individual schemas via
// the per-schema viewer + "Suggest richer fields" button (PR E9) to
// refine afterwards.
//
// Per-vertical scope keeps each click ~30-90s (3-12 schemas × Gemini
// latency), well inside server-action timeouts.

import { ALL_BLOCKS_DATA, type ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import { writeRelaySchemaFromBlocks } from '@/actions/relay-schema-generate';
import {
  enrichRelaySchemaAction,
  appendFieldsToRelaySchemaAction,
} from '@/actions/relay-schema-enrich';
import {
  getVerticalForSlug,
  type RelayVertical,
} from '@/lib/relay/relay-verticals';

export interface VerticalEnrichResult {
  success: boolean;
  vertical: RelayVertical;
  schemas: Array<{
    slug: string;
    deterministicFields: number;
    aiFields: number;
    skipped?: string;
    error?: string;
  }>;
  error?: string;
}

export async function generateAndEnrichVerticalAction(
  vertical: RelayVertical,
): Promise<VerticalEnrichResult> {
  const schemas: VerticalEnrichResult['schemas'] = [];
  try {
    // Group ALL_BLOCKS_DATA by module slug, then keep only the slugs
    // that belong to the chosen vertical. Inline grouping (rather
    // than importing a sync helper from a 'use server' file) since
    // server-action files can only export async functions.
    const blocksBySlug = new Map<string, ServerBlockData[]>();
    for (const b of ALL_BLOCKS_DATA) {
      if (!b.module) continue;
      if (getVerticalForSlug(b.module) !== vertical) continue;
      const arr = blocksBySlug.get(b.module) ?? [];
      arr.push(b);
      blocksBySlug.set(b.module, arr);
    }

    for (const [slug, blocks] of blocksBySlug) {
      // 1. Deterministic seed — overwrites the schema. Idempotent.
      const seed = await writeRelaySchemaFromBlocks(slug, blocks);
      if ('skipped' in seed) {
        schemas.push({
          slug,
          deterministicFields: 0,
          aiFields: 0,
          skipped: seed.reason,
        });
        continue;
      }

      // 2. Ask Gemini for additional fields. Failures don't abort
      // the whole vertical — record per-schema error and move on.
      const enriched = await enrichRelaySchemaAction(slug);
      if (!enriched.success) {
        schemas.push({
          slug,
          deterministicFields: seed.fieldCount,
          aiFields: 0,
          error: enriched.error,
        });
        continue;
      }

      // 3. Auto-accept all suggestions. Bulk = bulk; no diff modal.
      let aiFields = 0;
      if (enriched.suggestions.length > 0) {
        const appended = await appendFieldsToRelaySchemaAction(
          slug,
          enriched.suggestions,
        );
        aiFields = appended.success ? appended.appended : 0;
      }

      schemas.push({
        slug,
        deterministicFields: seed.fieldCount,
        aiFields,
      });
    }

    return { success: true, vertical, schemas };
  } catch (err: any) {
    console.error('[relay-schema-bulk] failed:', err);
    return {
      success: false,
      vertical,
      schemas,
      error: err?.message ?? 'unknown',
    };
  }
}
