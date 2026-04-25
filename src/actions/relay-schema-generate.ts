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
// `{ slug, name, fieldCount, blockCount }` summary or null when the
// slug has no annotated reads[]. Exported so PR-fix-1's
// generateAndEnrichVerticalAction can reuse the exact same write
// path — no two-implementations-of-the-same-thing risk.
export interface PerSlugResult {
  slug: string;
  name: string;
  fieldCount: number;
  blockCount: number;
}

export async function writeRelaySchemaFromBlocks(
  slug: string,
  blocks: ReadonlyArray<ServerBlockData>,
): Promise<PerSlugResult | { skipped: true; reason: string }> {
  const fieldNames = unionReads(blocks);
  if (fieldNames.length === 0) {
    return {
      skipped: true,
      reason: 'No blocks declare reads[] for this slug yet.',
    };
  }
  const schemaFields = buildSchemaFields(fieldNames);
  const name = humanizeSlug(slug);
  const now = new Date().toISOString();

  await adminDb
    .collection('relaySchemas')
    .doc(slug)
    .set(
      {
        id: slug,
        slug,
        name,
        description: `Auto-generated from ${blocks.length} Relay block${
          blocks.length === 1 ? '' : 's'
        }. Field list is the union of block.reads[] across consumers.`,
        icon: '📦',
        color: '#6366f1',
        currentVersion: 1,
        schema: {
          fields: schemaFields,
          categories: [
            { id: 'cat_general', name: 'General', icon: '📁', order: 0 },
          ],
        },
        schemaHistory: {},
        migrations: {},
        itemLabel: 'Item',
        itemLabelPlural: 'Items',
        priceLabel: 'Price',
        priceType: 'one_time',
        defaultCurrency: 'USD',
        settings: { ...DEFAULT_MODULE_SETTINGS },
        applicableIndustries: [],
        applicableFunctions: [],
        status: 'active',
        usageCount: 0,
        generatedFromRegistryAt: now,
        generatedFromBlockCount: blocks.length,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
      },
      { merge: false },
    );

  return {
    slug,
    name,
    fieldCount: schemaFields.length,
    blockCount: blocks.length,
  };
}

// ── Public API ─────────────────────────────────────────────────────

export interface RelaySchemaGenerationResult {
  success: boolean;
  generated: Array<{
    slug: string;
    name: string;
    fieldCount: number;
    blockCount: number;
  }>;
  skipped: Array<{ slug: string; reason: string }>;
  error?: string;
}

export async function generateRelaySchemasFromRegistryAction(): Promise<RelaySchemaGenerationResult> {
  const generated: RelaySchemaGenerationResult['generated'] = [];
  const skipped: RelaySchemaGenerationResult['skipped'] = [];

  try {
    const groups = groupBlocksByModule(ALL_BLOCKS_DATA);

    for (const [slug, blocks] of groups) {
      const res = await writeRelaySchemaFromBlocks(slug, blocks);
      if ('skipped' in res) {
        skipped.push({ slug, reason: res.reason });
      } else {
        generated.push(res);
      }
    }

    return { success: true, generated, skipped };
  } catch (err: any) {
    console.error('[relay-schema-generate] failed:', err);
    return {
      success: false,
      generated,
      skipped,
      error: err?.message ?? 'unknown',
    };
  }
}
