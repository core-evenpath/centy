'use server';

// ── Apply curated schema (replaces Gemini enrichment) ───────────────
//
// Replaces relay-schema-enrich's two-step Gemini call with a single
// deterministic apply from src/lib/relay/schema-curations. Admin
// edits the curated TS files; clicking "Apply curated schema" on
// /admin/relay/data/[slug] (or the bulk Generate + Enrich flow) lands
// the curation verbatim in `relaySchemas/{slug}.schema.fields[]`.
//
// Preserve rules (consistent with Step 0's writeRelaySchemaFromBlocks
// hardening):
//   - schema.fields:    OVERWRITTEN from the curation (the contract)
//   - contentCategory:  preserve admin override; else use curation
//   - name:             preserve admin override; else use curation
//   - description:      preserve admin prose; else use curation
//   - itemLabel/itemLabelPlural/defaultCurrency: curation wins (these
//     are admin-curated metadata, not partner-side identity)
//   - schemaHistory / migrations / settings / provenance fields:
//     never touched
//
// Two server actions:
//   1. applyCuratedSchemaAction(slug)  — write
//   2. previewCuratedSchemaAction(slug) — diff for the modal

import { db as adminDb } from '@/lib/firebase-admin';
import { DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';
import {
  getCuratedSchemaForSlug,
  type CuratedField,
} from '@/lib/relay/schema-curations';
import type { ModuleFieldDefinition } from '@/lib/modules/types';

const AUTO_DESCRIPTION_RE = /^Auto-generated from \d+ Relay block/;

// ── Field shape conversion ──────────────────────────────────────────

function curatedFieldToDefinition(
  f: CuratedField,
  order: number,
): ModuleFieldDefinition {
  const def: ModuleFieldDefinition = {
    id: `fld_${f.name}`,
    name: f.name,
    type: f.type,
    isRequired: !!f.isRequired,
    isSearchable: !!f.isSearchable,
    showInList: !!f.showInList,
    showInCard: !!f.showInCard,
    order,
  };
  if (f.options && f.options.length > 0) def.options = [...f.options];
  if (typeof f.description === 'string' && f.description.trim()) {
    def.description = f.description.trim();
  }
  if (typeof f.placeholder === 'string' && f.placeholder.trim()) {
    def.placeholder = f.placeholder.trim();
  }
  if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
    def.defaultValue = f.defaultValue;
  }
  if (f.validation && typeof f.validation === 'object') {
    def.validation = { ...f.validation };
  }
  return def;
}

// ── Apply ──────────────────────────────────────────────────────────

export interface ApplyCuratedSchemaResult {
  success: boolean;
  /** Number of fields written from the curation. */
  appliedFieldCount?: number;
  /** True when admin's contentCategory override was preserved over the curation's. */
  preservedContentCategory?: boolean;
  /** True when admin's name was preserved over the curation's. */
  preservedName?: boolean;
  /** True when admin's description (non-boilerplate) was preserved. */
  preservedDescription?: boolean;
  /** True when the schema doc didn't exist — created fresh from the curation. */
  createdNew?: boolean;
  error?: string;
}

export async function applyCuratedSchemaAction(
  slug: string,
): Promise<ApplyCuratedSchemaResult> {
  try {
    if (!slug) return { success: false, error: 'slug is required' };
    const curated = getCuratedSchemaForSlug(slug);
    if (!curated) {
      return {
        success: false,
        error: `No curated schema for "${slug}". Add one under src/lib/relay/schema-curations/.`,
      };
    }

    const fields = curated.fields.map((f, i) => curatedFieldToDefinition(f, i));
    const ref = adminDb.collection('relaySchemas').doc(slug);
    const existingSnap = await ref.get();
    const existing: Record<string, any> = existingSnap.exists
      ? (existingSnap.data() ?? {})
      : {};
    const now = new Date().toISOString();

    // ── New doc path: create with curation as the seed ──────────────
    if (!existingSnap.exists) {
      await ref.set({
        id: slug,
        slug,
        name: curated.name ?? slug,
        description: curated.description ?? '',
        icon: '📦',
        color: '#6366f1',
        currentVersion: 1,
        schema: {
          fields,
          categories: [
            { id: 'cat_general', name: 'General', icon: '📁', order: 0 },
          ],
        },
        schemaHistory: {},
        migrations: {},
        itemLabel: curated.itemLabel ?? 'Item',
        itemLabelPlural: curated.itemLabelPlural ?? 'Items',
        priceLabel: 'Price',
        priceType: 'one_time',
        defaultCurrency: curated.defaultCurrency ?? 'USD',
        settings: { ...DEFAULT_MODULE_SETTINGS },
        applicableIndustries: [],
        applicableFunctions: [],
        status: 'active',
        usageCount: 0,
        ...(curated.contentCategory
          ? { contentCategory: curated.contentCategory }
          : {}),
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        lastEditedAt: now,
      });
      return {
        success: true,
        appliedFieldCount: fields.length,
        createdNew: true,
        preservedContentCategory: false,
        preservedName: false,
        preservedDescription: false,
      };
    }

    // ── Existing doc path: targeted update with admin preservation ──
    const preservedName =
      typeof existing.name === 'string' &&
      existing.name &&
      curated.name !== undefined &&
      existing.name !== curated.name;
    const preservedContentCategory =
      typeof existing.contentCategory === 'string' && !!existing.contentCategory;
    const preservedDescription =
      typeof existing.description === 'string' &&
      !!existing.description &&
      !AUTO_DESCRIPTION_RE.test(existing.description);

    const update: Record<string, any> = {
      'schema.fields': fields,
      lastEditedAt: now,
      updatedAt: now,
    };

    if (!preservedName && curated.name) {
      update.name = curated.name;
    }
    if (!preservedContentCategory && curated.contentCategory) {
      update.contentCategory = curated.contentCategory;
    }
    if (!preservedDescription && curated.description) {
      update.description = curated.description;
    }
    // itemLabel / itemLabelPlural / defaultCurrency: the curation is
    // authoritative — admin doesn't get a UI to override these today,
    // and the curation files are the right place to set them.
    if (curated.itemLabel) update.itemLabel = curated.itemLabel;
    if (curated.itemLabelPlural) update.itemLabelPlural = curated.itemLabelPlural;
    if (curated.defaultCurrency) update.defaultCurrency = curated.defaultCurrency;

    await ref.update(update);

    return {
      success: true,
      appliedFieldCount: fields.length,
      createdNew: false,
      preservedContentCategory,
      preservedName,
      preservedDescription,
    };
  } catch (err: any) {
    console.error('[relay-schema-apply-curated] apply failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}

// ── Preview / diff ──────────────────────────────────────────────────

export interface CuratedSchemaPreview {
  success: boolean;
  /** False when no curation exists for this slug — UI shows "no curation yet". */
  available: boolean;
  /** Field names present in the curation but missing from the live schema. */
  toAdd: string[];
  /** Field names present in the live schema but missing from the curation. */
  toRemove: string[];
  /** Fields where the type differs between curation and live schema. */
  toChange: Array<{ name: string; was: string; now: string }>;
  /** Fields whose name + type match — round-trip identity. */
  unchanged: string[];
  /** Total fields in the curation (for the "Apply N fields" affordance). */
  curatedFieldCount?: number;
  error?: string;
}

const EMPTY_PREVIEW: CuratedSchemaPreview = {
  success: true,
  available: false,
  toAdd: [],
  toRemove: [],
  toChange: [],
  unchanged: [],
};

export async function previewCuratedSchemaAction(
  slug: string,
): Promise<CuratedSchemaPreview> {
  try {
    if (!slug) return { ...EMPTY_PREVIEW, success: false, error: 'slug is required' };
    const curated = getCuratedSchemaForSlug(slug);
    if (!curated) return EMPTY_PREVIEW;

    const ref = adminDb.collection('relaySchemas').doc(slug);
    const snap = await ref.get();
    const existingFields: any[] = snap.exists
      ? snap.data()?.schema?.fields ?? []
      : [];

    const existingByName = new Map<string, any>();
    for (const f of existingFields) {
      if (f && typeof f.name === 'string') existingByName.set(f.name, f);
    }
    const curatedByName = new Map<string, CuratedField>();
    for (const f of curated.fields) curatedByName.set(f.name, f);

    const toAdd: string[] = [];
    const unchanged: string[] = [];
    const toChange: CuratedSchemaPreview['toChange'] = [];
    for (const f of curated.fields) {
      const existing = existingByName.get(f.name);
      if (!existing) {
        toAdd.push(f.name);
      } else if (existing.type !== f.type) {
        toChange.push({ name: f.name, was: String(existing.type), now: f.type });
      } else {
        unchanged.push(f.name);
      }
    }
    const toRemove: string[] = [];
    for (const f of existingFields) {
      if (f && typeof f.name === 'string' && !curatedByName.has(f.name)) {
        toRemove.push(f.name);
      }
    }

    return {
      success: true,
      available: true,
      toAdd,
      toRemove,
      toChange,
      unchanged,
      curatedFieldCount: curated.fields.length,
    };
  } catch (err: any) {
    console.error('[relay-schema-apply-curated] preview failed:', err);
    return { ...EMPTY_PREVIEW, success: false, error: err?.message ?? 'unknown' };
  }
}
