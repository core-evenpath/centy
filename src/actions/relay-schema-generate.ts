'use server';

// ── Relay schema generator (PR E7) ──────────────────────────────────
//
// Deterministic: derives every Relay schema directly from the block
// registry. No systemModules dependency, no migration, no backfill.
// The block registry's `reads[]` annotations (added PR C) declare
// exactly which module fields each block consumes; the union of
// those reads across blocks that share a `.module` slug IS the
// schema.
//
// Flow:
//   1. Group ALL_BLOCKS_DATA by block.module (skipping null/design-only).
//   2. For each slug, union reads[] + add a default 'isActive' flag.
//   3. Map each field name → ModuleFieldDefinition using an inference
//      table tuned to the vocab the PR C annotations used.
//   4. Write `relaySchemas/{slug}` deterministically (merge: false).
//
// Idempotent. Re-run any time the block registry changes; each run
// rebuilds the schema from scratch so field additions / removals in
// the registry propagate cleanly.
//
// Replaces the earlier migrate/backfill/delete buttons — those were
// historical baggage from a design where `systemModules` was the
// source of truth.

import { db as adminDb } from '@/lib/firebase-admin';
import { ALL_BLOCKS_DATA, type ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import { DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';
import type { ModuleFieldDefinition } from '@/lib/modules/types';

// ── Field-type inference ───────────────────────────────────────────
//
// Exact-match takes priority over pattern-match. Keeps the common
// Relay fields (name, description, image_url, price, category) on
// sensible types without needing to annotate types in the registry.

const EXACT_FIELD_TYPES: Record<string, ModuleFieldDefinition['type']> = {
  name: 'text',
  title: 'text',
  description: 'textarea',
  subtitle: 'text',
  price: 'currency',
  currency: 'text',
  category: 'text',
  rating: 'number',
  badges: 'tags',
  features: 'tags',
  sku: 'text',
  stock: 'number',
  stock_quantity: 'number',
  cta_label: 'text',
  cta_url: 'url',
  image_url: 'url',
  images: 'tags',
};

const REQUIRED_FIELDS = new Set(['name']);

function inferFieldType(name: string): ModuleFieldDefinition['type'] {
  if (name in EXACT_FIELD_TYPES) return EXACT_FIELD_TYPES[name];
  const lower = name.toLowerCase();
  if (lower.endsWith('_url') || lower.endsWith('_link')) return 'url';
  if (lower.startsWith('is_') || lower.startsWith('has_')) return 'toggle';
  if (lower.endsWith('_count') || lower === 'count') return 'number';
  if (lower.endsWith('_at') || lower.endsWith('_date')) return 'text';
  if (lower.endsWith('_list') || lower === 'tags') return 'tags';
  if (lower.endsWith('_description')) return 'textarea';
  return 'text';
}

// ── Union reads per module slug ────────────────────────────────────

function groupBlocksByModule(
  blocks: ReadonlyArray<ServerBlockData>,
): Map<string, ServerBlockData[]> {
  const map = new Map<string, ServerBlockData[]>();
  for (const b of blocks) {
    if (!b.module) continue;
    if (!map.has(b.module)) map.set(b.module, []);
    map.get(b.module)!.push(b);
  }
  return map;
}

function unionReads(blocks: ReadonlyArray<ServerBlockData>): string[] {
  const set = new Set<string>();
  for (const b of blocks) {
    for (const r of b.reads ?? []) set.add(r);
  }
  return Array.from(set);
}

function humanizeSlug(slug: string): string {
  return slug
    .split(/[_-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function buildSchemaFields(fieldNames: string[]): ModuleFieldDefinition[] {
  return fieldNames.map((name, idx) => {
    const type = inferFieldType(name);
    const showInCard = ['name', 'image_url', 'price', 'subtitle', 'rating', 'badges'].includes(
      name,
    );
    const showInList = showInCard || name === 'category' || name === 'sku';
    const isSearchable = ['name', 'description', 'subtitle', 'features', 'sku'].includes(name);
    return {
      id: `fld_${name}`,
      name,
      type,
      isRequired: REQUIRED_FIELDS.has(name),
      isSearchable,
      showInList,
      showInCard,
      order: idx,
    };
  });
}

// ── Per-slug helper (shared with the per-vertical bulk path) ───────
//
// Writes one Relay schema deterministically. Returns a
// `{ slug, name, fieldCount, blockCount, seededFromDefaults }`
// summary. Exported so generateAndEnrichVerticalAction can reuse
// the exact same write path — no two-implementations-of-the-same-
// thing risk.
//
// Behaviour when consumer blocks have no reads[] annotations:
// previously this path returned a "skipped" outcome — which left
// the schema doc nonexistent and made the bulk vertical run report
// "No blocks declare reads[]". That broke AI enrichment for the
// affected slugs (Gemini can't enrich a doc that doesn't exist).
// Now the helper seeds with three universal defaults
// (name / description / image_url) so the schema always exists.
// AI enrichment will expand from the block descriptions in the
// follow-up step. The result flags `seededFromDefaults: true` so
// the bulk-action UI can show admin which schemas got the fallback.

export interface PerSlugResult {
  slug: string;
  name: string;
  fieldCount: number;
  blockCount: number;
  /**
   * True when the consumer blocks had no `reads[]` annotated and the
   * helper fell back to a universal default seed. AI enrichment will
   * flesh these schemas out the most.
   */
  seededFromDefaults: boolean;
}

const DEFAULT_SEED_FIELDS: ReadonlyArray<string> = ['name', 'description', 'image_url'];

// Boilerplate description we emit ourselves (below). Used by the
// preserve-on-overwrite logic to distinguish admin-authored
// descriptions from this function's own auto-generated one — admin
// prose survives a re-run, our boilerplate gets refreshed.
const AUTO_DESCRIPTION_RE = /^Auto-generated from \d+ Relay block/;

export async function writeRelaySchemaFromBlocks(
  slug: string,
  blocks: ReadonlyArray<ServerBlockData>,
): Promise<PerSlugResult> {
  const annotatedReads = unionReads(blocks);
  const seededFromDefaults = annotatedReads.length === 0;
  const fieldNames = seededFromDefaults
    ? [...DEFAULT_SEED_FIELDS]
    : annotatedReads;

  const schemaFields = buildSchemaFields(fieldNames);
  const autoName = humanizeSlug(slug);
  const autoDescription = seededFromDefaults
    ? `Auto-generated from ${blocks.length} Relay block${
        blocks.length === 1 ? '' : 's'
      }. Seeded with universal defaults — no reads[] annotated; AI enrichment expands from block descriptions.`
    : `Auto-generated from ${blocks.length} Relay block${
        blocks.length === 1 ? '' : 's'
      }. Field list is the union of block.reads[] across consumers.`;
  const now = new Date().toISOString();

  // ── Preserve admin-curated metadata across re-runs ────────────────
  //
  // Earlier this function did `set({...}, { merge: false })` with a
  // freshly minted shape — wiping every doc-level field admin had set
  // (Phase 1B's `contentCategory` override, manually edited `name`,
  // `description`, and the enrichment provenance trail). Re-running
  // Generate + Enrich silently undid hours of curation work.
  //
  // Now we read the existing doc first and carry forward anything
  // that's clearly admin-authored or system-tracked metadata. The
  // detection rules:
  //   - contentCategory: any non-empty string survives (only ever
  //     written by admin's setRelaySchemaContentCategoryAction or a
  //     curated-schema apply, never by this function — so presence
  //     means "preserve")
  //   - name: keep when it differs from `humanizeSlug(slug)`
  //     (i.e. admin renamed it)
  //   - description: keep when it doesn't match our boilerplate
  //     pattern (i.e. admin authored prose)
  //   - schemaHistory: never wipe — the version log
  //   - lastEnrichedAt / lastEnrichedModel / lastEnrichedFieldCount
  //     / lastEditedAt / createdAt: provenance trail, always carry
  //
  // Field list (`schema.fields`) IS overwritten — that's the whole
  // point of this function. Admin per-field metadata edits made via
  // SchemaEditor get rebuilt from `block.reads[]` here. Curated-
  // schema apply is the place to bring richer field data back.
  const ref = adminDb.collection('relaySchemas').doc(slug);
  const existingSnap = await ref.get();
  const existing: Record<string, any> = existingSnap.exists
    ? (existingSnap.data() ?? {})
    : {};

  const preservedName =
    typeof existing.name === 'string' && existing.name && existing.name !== autoName
      ? existing.name
      : autoName;

  const preservedDescription =
    typeof existing.description === 'string' &&
    existing.description &&
    !AUTO_DESCRIPTION_RE.test(existing.description)
      ? existing.description
      : autoDescription;

  const doc: Record<string, any> = {
    id: slug,
    slug,
    name: preservedName,
    description: preservedDescription,
    icon: typeof existing.icon === 'string' && existing.icon ? existing.icon : '📦',
    color: typeof existing.color === 'string' && existing.color ? existing.color : '#6366f1',
    currentVersion:
      typeof existing.currentVersion === 'number' ? existing.currentVersion : 1,
    schema: {
      fields: schemaFields,
      // Categories: keep admin-defined ones if any exist; else default.
      categories:
        Array.isArray(existing.schema?.categories) &&
        existing.schema.categories.length > 0
          ? existing.schema.categories
          : [{ id: 'cat_general', name: 'General', icon: '📁', order: 0 }],
    },
    schemaHistory:
      existing.schemaHistory && typeof existing.schemaHistory === 'object'
        ? existing.schemaHistory
        : {},
    migrations:
      existing.migrations && typeof existing.migrations === 'object'
        ? existing.migrations
        : {},
    itemLabel:
      typeof existing.itemLabel === 'string' && existing.itemLabel
        ? existing.itemLabel
        : 'Item',
    itemLabelPlural:
      typeof existing.itemLabelPlural === 'string' && existing.itemLabelPlural
        ? existing.itemLabelPlural
        : 'Items',
    priceLabel:
      typeof existing.priceLabel === 'string' && existing.priceLabel
        ? existing.priceLabel
        : 'Price',
    priceType:
      typeof existing.priceType === 'string' && existing.priceType
        ? existing.priceType
        : 'one_time',
    defaultCurrency:
      typeof existing.defaultCurrency === 'string' && existing.defaultCurrency
        ? existing.defaultCurrency
        : 'USD',
    settings: existing.settings ?? { ...DEFAULT_MODULE_SETTINGS },
    applicableIndustries: Array.isArray(existing.applicableIndustries)
      ? existing.applicableIndustries
      : [],
    applicableFunctions: Array.isArray(existing.applicableFunctions)
      ? existing.applicableFunctions
      : [],
    status:
      typeof existing.status === 'string' && existing.status
        ? existing.status
        : 'active',
    usageCount:
      typeof existing.usageCount === 'number' ? existing.usageCount : 0,
    generatedFromRegistryAt: now,
    generatedFromBlockCount: blocks.length,
    createdAt:
      typeof existing.createdAt === 'string' && existing.createdAt
        ? existing.createdAt
        : now,
    updatedAt: now,
    createdBy:
      typeof existing.createdBy === 'string' && existing.createdBy
        ? existing.createdBy
        : 'system',
  };

  // Conditionally carry forward admin overrides + provenance — only
  // include keys when the existing doc had them, so the post-merge
  // shape stays clean.
  if (typeof existing.contentCategory === 'string' && existing.contentCategory) {
    doc.contentCategory = existing.contentCategory;
  }
  if (typeof existing.lastEnrichedAt === 'string' && existing.lastEnrichedAt) {
    doc.lastEnrichedAt = existing.lastEnrichedAt;
  }
  if (typeof existing.lastEnrichedModel === 'string' && existing.lastEnrichedModel) {
    doc.lastEnrichedModel = existing.lastEnrichedModel;
  }
  if (typeof existing.lastEnrichedFieldCount === 'number') {
    doc.lastEnrichedFieldCount = existing.lastEnrichedFieldCount;
  }
  if (typeof existing.lastEditedAt === 'string' && existing.lastEditedAt) {
    doc.lastEditedAt = existing.lastEditedAt;
  }

  await ref.set(doc, { merge: false });

  return {
    slug,
    name: preservedName,
    fieldCount: schemaFields.length,
    blockCount: blocks.length,
    seededFromDefaults,
  };
}

// ── Public API ─────────────────────────────────────────────────────
//
// Bulk "generate everything from scratch" used to live here as
// `generateRelaySchemasFromRegistryAction`. Removed in PR-fix-3 —
// the per-vertical "Generate + Enrich" button on /admin/relay/data
// (relay-schema-bulk.ts) is the single supported entry point now,
// and reuses `writeRelaySchemaFromBlocks` above for the same write
// behaviour, slug by slug. Two buttons doing overlapping work was
// confusing.
