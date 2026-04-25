'use server';

// ── /admin/relay/data analytics action ──────────────────────────────────
//
// Joins the block registry (`ALL_BLOCKS_DATA`) with `systemModules` and
// partner `businessModules` to tell the admin three things:
//   1. Which blocks need data and don't have any (dark).
//   2. Which blocks are connected (have module data across >= 1 partner).
//   3. Which modules power which blocks, with total item / partner counts.

import { db } from '@/lib/firebase-admin';
import {
  ALL_BLOCKS_DATA,
  ALL_SUB_VERTICALS_DATA,
  SHARED_BLOCK_IDS_DATA,
  type ServerBlockData,
} from '@/app/admin/relay/blocks/previews/_registry-data';
import {
  buildBlockVerticalMap,
  resolveBlockVerticals,
} from '@/lib/relay/module-analytics-derive';
import {
  getEnginesForModule,
  getFieldDriftForBlock,
} from '@/lib/relay/block-module-graph';
import { loadBlockSchemaBindingsAction } from '@/actions/relay-block-binding';
import type {
  BlockModuleBinding,
  ModuleBlockUsage,
  RelayModuleAnalytics,
  PipelineGaps,
  RecentRun,
} from '@/lib/relay/module-analytics-types';

interface ModuleInfo {
  id: string;
  name: string;
  color: string;
  slug: string;
  /** Field names from the live schema — used for drift comparison. */
  schemaFields: string[];
  // PR fix-9: provenance for the recent-runs panel + pipeline gaps.
  generatedFromRegistryAt?: string;
  lastEnrichedAt?: string;
  lastEnrichedModel?: string;
  lastEnrichedFieldCount?: number;
  lastEditedAt?: string;
}

interface ModuleCounts {
  items: number;
  partners: Set<string>;
}

export interface GetRelayModuleAnalyticsResult {
  success: boolean;
  data?: RelayModuleAnalytics;
  error?: string;
}

// PR E3: read Relay schemas from the dedicated `relaySchemas` collection
// introduced in PR E2 (not the shared `systemModules`). The block
// registry's `.module` values now resolve against this store.
//
// Doc shape mirrors `systemModules` (copied by the migration action),
// so the field extraction logic is unchanged — only the collection
// name differs.
async function loadRelaySchemas(): Promise<Map<string, ModuleInfo>> {
  const out = new Map<string, ModuleInfo>();
  const snap = await db.collection('relaySchemas').get();
  snap.docs.forEach((doc) => {
    const d = doc.data();
    const slug: string | undefined = d.slug;
    if (!slug) return;
    // Pull live schema field names so we can diff against block.reads
    // for drift detection. Schema shape is `{ fields: [{ name, type, ...}] }`.
    const rawFields = d.schema?.fields;
    const schemaFields: string[] = Array.isArray(rawFields)
      ? rawFields
          .map((f: unknown) =>
            typeof f === 'object' && f && 'name' in f && typeof (f as { name: unknown }).name === 'string'
              ? (f as { name: string }).name
              : null,
          )
          .filter((n): n is string => !!n)
      : [];
    out.set(slug, {
      id: doc.id,
      name: d.name || slug,
      color: d.color || '#6366f1',
      slug,
      schemaFields,
      // PR fix-9: provenance for recent-runs view.
      generatedFromRegistryAt:
        typeof d.generatedFromRegistryAt === 'string' ? d.generatedFromRegistryAt : undefined,
      lastEnrichedAt:
        typeof d.lastEnrichedAt === 'string' ? d.lastEnrichedAt : undefined,
      lastEnrichedModel:
        typeof d.lastEnrichedModel === 'string' ? d.lastEnrichedModel : undefined,
      lastEnrichedFieldCount:
        typeof d.lastEnrichedFieldCount === 'number' ? d.lastEnrichedFieldCount : undefined,
      lastEditedAt:
        typeof d.lastEditedAt === 'string' ? d.lastEditedAt : undefined,
    });
  });
  return out;
}

async function loadConfiguredBlockIds(): Promise<Set<string>> {
  const snap = await db.collection('relayBlockConfigs').get();
  return new Set(snap.docs.map((d) => d.id));
}

async function loadModuleItemCounts(): Promise<Map<string, ModuleCounts>> {
  // `businessModules` is the partner-side subcollection; each doc
  // records the slug + itemCount for a partner. Collection-group query
  // gives us cross-partner totals without iterating every partner.
  const out = new Map<string, ModuleCounts>();
  const snap = await db.collectionGroup('businessModules').get();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const slug: string | undefined = data.moduleSlug;
    if (!slug) return;
    const partnerId = doc.ref.parent.parent?.id;
    const itemCount: number = typeof data.itemCount === 'number' ? data.itemCount : 0;
    if (!out.has(slug)) out.set(slug, { items: 0, partners: new Set() });
    const entry = out.get(slug)!;
    entry.items += itemCount;
    if (partnerId) entry.partners.add(partnerId);
  });
  return out;
}

function bindBlock(
  block: ServerBlockData,
  verticalMap: Map<string, string[]>,
  modules: Map<string, ModuleInfo>,
  counts: Map<string, ModuleCounts>,
  configured: Set<string>,
  unboundSet: Set<string>,
): BlockModuleBinding {
  const verticals = resolveBlockVerticals(block, verticalMap);
  // PR E11: admin can override the implicit binding declared by
  // block.module via /admin/relay/data/[slug]'s toggle. When that
  // override flips false, treat the block as if it had no module
  // for analytics purposes — drift gets zero, consumer counts skip
  // it, etc. The original block.module value still exists on the
  // block; we just suppress its effect downstream.
  const overrideUnbound = unboundSet.has(block.id);
  const moduleSlug = overrideUnbound ? null : block.module ?? null;
  const binding: BlockModuleBinding = {
    blockId: block.id,
    blockLabel: block.label,
    blockFamily: block.family,
    blockStatus: block.status ?? 'active',
    verticals,
    moduleSlug,
    moduleConnected: false,
    isDark: false,
    isConfigured: configured.has(block.id),
    // PR B: copy schema-contract + engine metadata from the registry so
    // the UI can render reads/drift/engine chips without re-joining.
    reads: block.reads,
    engines: block.engines,
    noModuleReason: block.noModuleReason,
    bindsSchema: !overrideUnbound,
  };

  if (!moduleSlug) {
    // Block doesn't bind to a module at all — nothing to be "dark" about.
    return binding;
  }

  const module = modules.get(moduleSlug);
  if (module) {
    binding.moduleName = module.name;
    binding.moduleSchemaFields = module.schemaFields;
    // Drift is only meaningful when the block declares `reads`. When
    // unannotated, `driftFields` stays undefined so the UI can treat
    // the block as "pending annotation" distinct from "fields missing".
    const drift = getFieldDriftForBlock(block, module.schemaFields);
    if (!drift.unannotated) binding.driftFields = drift.missing;
  }

  const moduleCounts = counts.get(moduleSlug);
  binding.moduleItemCount = moduleCounts?.items ?? 0;
  binding.moduleConnected = (moduleCounts?.items ?? 0) > 0;
  binding.isDark = !binding.moduleConnected;
  return binding;
}

function buildModuleUsage(
  blocks: BlockModuleBinding[],
  modules: Map<string, ModuleInfo>,
  counts: Map<string, ModuleCounts>,
): ModuleBlockUsage[] {
  const out: ModuleBlockUsage[] = [];
  for (const [slug, module] of modules) {
    const connected = blocks
      .filter((b) => b.moduleSlug === slug)
      .map((b) => ({
        blockId: b.blockId,
        blockLabel: b.blockLabel,
        verticals: b.verticals,
      }));
    if (connected.length === 0) continue;
    const c = counts.get(slug);
    out.push({
      moduleId: module.id,
      moduleSlug: slug,
      moduleName: module.name,
      moduleColor: module.color,
      connectedBlocks: connected,
      itemCount: c?.items ?? 0,
      partnerCount: c?.partners.size ?? 0,
      // PR B: engine union across the blocks that bind this module
      // (derived pure from ALL_BLOCKS_DATA), plus schema fields for
      // side-by-side comparison in the UX rework (PR D).
      engines: getEnginesForModule(slug, ALL_BLOCKS_DATA),
      schemaFields: module.schemaFields,
    });
  }
  out.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
  return out;
}

export async function getRelayModuleAnalyticsAction(): Promise<GetRelayModuleAnalyticsResult> {
  try {
    const [modules, configured, counts, bindingsRes] = await Promise.all([
      loadRelaySchemas(),
      loadConfiguredBlockIds(),
      loadModuleItemCounts(),
      loadBlockSchemaBindingsAction(),
    ]);

    const verticalMap = buildBlockVerticalMap(
      ALL_SUB_VERTICALS_DATA,
      SHARED_BLOCK_IDS_DATA,
    );

    // PR E11: collect block ids the admin has explicitly unbound from
    // their family schema. Passed to bindBlock to suppress drift +
    // module-side analytics for those ids.
    const unboundSet = new Set(
      Object.entries(bindingsRes.bindings)
        .filter(([, bound]) => bound === false)
        .map(([id]) => id),
    );

    const bindings: BlockModuleBinding[] = ALL_BLOCKS_DATA.map((b) =>
      bindBlock(b, verticalMap, modules, counts, configured, unboundSet),
    );

    const connectedBlocks = bindings.filter((b) => !b.isDark);
    const darkBlocks = bindings.filter((b) => b.isDark);
    const moduleUsage = buildModuleUsage(bindings, modules, counts);

    // PR fix-9: pipeline gaps. Static checks for actionable issues
    // surfaced on the page so admin can spot problems without
    // hunting through tabs.
    const referencedSlugs = new Set<string>();
    for (const b of ALL_BLOCKS_DATA) {
      if (b.module) referencedSlugs.add(b.module);
    }
    const missingSchemas = Array.from(referencedSlugs)
      .filter((slug) => !modules.has(slug))
      .sort();
    const emptySchemas: string[] = [];
    const orphanSchemas: string[] = [];
    for (const [slug, info] of modules) {
      if (info.schemaFields.length === 0) emptySchemas.push(slug);
      if (!referencedSlugs.has(slug)) orphanSchemas.push(slug);
    }
    const driftBlocks = bindings.filter(
      (b) => (b.driftFields?.length ?? 0) > 0,
    ).length;
    const unboundBlocks = bindings.filter((b) => b.bindsSchema === false).length;

    const pipelineGaps: PipelineGaps = {
      missingSchemas,
      emptySchemas: emptySchemas.sort(),
      orphanSchemas: orphanSchemas.sort(),
      driftBlocks,
      unboundBlocks,
    };

    // PR fix-9: recent runs. Derive from each schema's provenance
    // timestamps — pick the most-recent event per schema, sort
    // overall, take top 10. No new collection needed.
    const recentRuns: RecentRun[] = [];
    for (const info of modules.values()) {
      // Pick the latest of the three provenance timestamps and tag
      // the run with the matching kind. lastEditedAt wins ties since
      // a manual edit is the most recent intentional touch.
      let at: string | undefined;
      let kind: RecentRun['kind'] = 'generated';
      if (info.generatedFromRegistryAt) {
        at = info.generatedFromRegistryAt;
        kind = 'generated';
      }
      if (info.lastEnrichedAt && (!at || info.lastEnrichedAt > at)) {
        at = info.lastEnrichedAt;
        kind = 'enriched';
      }
      if (info.lastEditedAt && (!at || info.lastEditedAt > at)) {
        at = info.lastEditedAt;
        kind = 'edited';
      }
      if (!at) continue;
      recentRuns.push({
        slug: info.slug,
        schemaName: info.name,
        at,
        kind,
        fieldCount: info.schemaFields.length,
        model: kind === 'enriched' ? info.lastEnrichedModel : undefined,
        enrichedFieldCount:
          kind === 'enriched' ? info.lastEnrichedFieldCount : undefined,
      });
    }
    recentRuns.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

    return {
      success: true,
      data: {
        connectedBlocks,
        darkBlocks,
        modules: moduleUsage,
        totalBlocks: bindings.length,
        blocksWithModules: bindings.filter((b) => !!b.moduleSlug).length,
        darkBlockCount: darkBlocks.length,
        totalModules: modules.size,
        pipelineGaps,
        recentRuns: recentRuns.slice(0, 10),
      },
    };
  } catch (e) {
    console.error('[relay-module-analytics] failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
