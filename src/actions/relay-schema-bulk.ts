'use server';

// ── Bulk per-vertical Generate + Apply Curated (Step 1) ─────────────
//
// One-click bootstrap. For every schema in the chosen vertical:
//
//   1. If the slug has a curation in src/lib/relay/schema-curations,
//      apply it — the curation is the source of truth for fields,
//      contentCategory hint, name hint, etc.
//   2. Else fall back to the deterministic block.reads[] union seed
//      via writeRelaySchemaFromBlocks (Step 0 hardened it to preserve
//      admin-set metadata).
//
// Replaces the previous Gemini enrichment step. Curated apply is
// deterministic, reviewable in PRs, and produces the comprehensive
// field lists Gemini failed to deliver consistently. Slugs without a
// curation still get a usable seed — never broken, just less rich
// until a curation is authored.
//
// The Gemini path (relay-schema-enrich.ts) is intentionally left in
// place but no longer wired into the bulk flow. It can be repurposed
// as an opt-in "AI suggest" affordance later if needed.

import { ALL_BLOCKS_DATA, type ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import { writeRelaySchemaFromBlocks } from '@/actions/relay-schema-generate';
import { applyCuratedSchemaAction } from '@/actions/relay-schema-apply-curated';
import { getCuratedSchemaForSlug } from '@/lib/relay/schema-curations';
import {
  getVerticalForSlug,
  type RelayVertical,
} from '@/lib/relay/relay-verticals';
import { revalidatePath } from 'next/cache';

export interface VerticalEnrichResult {
  success: boolean;
  vertical: RelayVertical;
  schemas: Array<{
    slug: string;
    /** Where the field list came from for this slug. */
    source: 'curated' | 'deterministic';
    /** Total fields written to schema.fields. */
    fieldCount: number;
    /**
     * Deterministic-path only: true when consumer blocks had no
     * reads[] annotated and the seed fell back to universal defaults
     * (name / description / image_url). Hint that this slug needs a
     * curation.
     */
    seededFromDefaults?: boolean;
    /**
     * Curated-path only: true when admin had set contentCategory
     * and/or name and the apply preserved those over the curation.
     */
    preservedAdminMetadata?: boolean;
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
      const curated = getCuratedSchemaForSlug(slug);

      if (curated) {
        // ── Curated path ─────────────────────────────────────────
        // Apply lands the canonical fields verbatim. Admin overrides
        // for contentCategory / name / description survive.
        const applied = await applyCuratedSchemaAction(slug);
        schemas.push({
          slug,
          source: 'curated',
          fieldCount: applied.appliedFieldCount ?? 0,
          preservedAdminMetadata:
            !!applied.preservedContentCategory ||
            !!applied.preservedName ||
            !!applied.preservedDescription,
          error: applied.success ? undefined : applied.error,
        });
        continue;
      }

      // ── Deterministic fallback ─────────────────────────────────
      // No curation yet for this slug. Use the block.reads[] union
      // seed; Step 0 ensured this preserves admin-set metadata so
      // re-runs are safe.
      const seed = await writeRelaySchemaFromBlocks(slug, blocks);
      schemas.push({
        slug,
        source: 'deterministic',
        fieldCount: seed.fieldCount,
        seededFromDefaults: seed.seededFromDefaults,
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
  } finally {
    // Crucial: invalidate the analytics page so the Schemas tab,
    // SummaryCards, and Recent Runs all reflect the new state.
    // Without this, the user sees Schemas (0) even after a
    // successful generation because the server tree is cached.
    revalidatePath('/admin/relay/data');
    revalidatePath('/admin/relay/data/[slug]', 'page');
  }
}
