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
import type {
  BlockModuleBinding,
  ModuleBlockUsage,
  RelayModuleAnalytics,
} from '@/lib/relay/module-analytics-types';

interface ModuleInfo {
  id: string;
  name: string;
  color: string;
  slug: string;
  /** Field names from the live schema — used for drift comparison. */
  schemaFields: string[];
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
): BlockModuleBinding {
  const verticals = resolveBlockVerticals(block, verticalMap);
  const moduleSlug = block.module ?? null;
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
    const [modules, configured, counts] = await Promise.all([
      loadRelaySchemas(),
      loadConfiguredBlockIds(),
      loadModuleItemCounts(),
    ]);

    const verticalMap = buildBlockVerticalMap(
      ALL_SUB_VERTICALS_DATA,
      SHARED_BLOCK_IDS_DATA,
    );

    const bindings: BlockModuleBinding[] = ALL_BLOCKS_DATA.map((b) =>
      bindBlock(b, verticalMap, modules, counts, configured),
    );

    const connectedBlocks = bindings.filter((b) => !b.isDark);
    const darkBlocks = bindings.filter((b) => b.isDark);
    const moduleUsage = buildModuleUsage(bindings, modules, counts);

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
      },
    };
  } catch (e) {
    console.error('[relay-module-analytics] failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
