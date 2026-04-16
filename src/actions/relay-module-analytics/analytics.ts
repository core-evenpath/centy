'use server';

// ── /admin/relay/modules analytics action ───────────────────────────────
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
  type SubVerticalWithIndustry,
} from '@/lib/relay/module-analytics-derive';
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

async function loadSystemModules(): Promise<Map<string, ModuleInfo>> {
  const out = new Map<string, ModuleInfo>();
  const snap = await db.collection('systemModules').get();
  snap.docs.forEach((doc) => {
    const d = doc.data();
    const slug: string | undefined = d.slug;
    if (!slug) return;
    out.set(slug, {
      id: doc.id,
      name: d.name || slug,
      color: d.color || '#6366f1',
      slug,
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
  };

  if (!moduleSlug) {
    // Block doesn't bind to a module at all — nothing to be "dark" about.
    return binding;
  }

  const module = modules.get(moduleSlug);
  if (module) binding.moduleName = module.name;

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
    });
  }
  out.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
  return out;
}

export async function getRelayModuleAnalyticsAction(): Promise<GetRelayModuleAnalyticsResult> {
  try {
    const [modules, configured, counts] = await Promise.all([
      loadSystemModules(),
      loadConfiguredBlockIds(),
      loadModuleItemCounts(),
    ]);

    const verticalMap = buildBlockVerticalMap(
      ALL_SUB_VERTICALS_DATA as unknown as SubVerticalWithIndustry[],
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
