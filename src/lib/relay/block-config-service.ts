import { db as adminDb } from '@/lib/firebase-admin';
import type { UnifiedBlockConfig } from './types';

const MINIMAL_FALLBACK_SCHEMA =
  'RESPOND ONLY IN JSON of shape { "type": "text", "text": "...", "suggestions": ["...", "..."] }';

// ── In-process cache ─────────────────────────────────────────────────

const GLOBAL_CACHE_TTL_MS = 60_000; // 60 seconds
const PARTNER_CACHE_TTL_MS = 30_000; // 30 seconds

let globalCache: UnifiedBlockConfig[] | null = null;
let globalCacheFetchedAt = 0;

const partnerCache = new Map<string, { blocks: Array<{ id: string; isVisible: boolean }>; fetchedAt: number }>();

// ── Cache invalidation ───────────────────────────────────────────────

export function invalidateBlockConfigCache(): void {
  globalCache = null;
  globalCacheFetchedAt = 0;
}

export function invalidatePartnerBlockCache(partnerId: string): void {
  partnerCache.delete(partnerId);
}

// ── Global block configs ─────────────────────────────────────────────

export async function getGlobalBlockConfigs(): Promise<UnifiedBlockConfig[]> {
  const now = Date.now();
  if (globalCache && now - globalCacheFetchedAt < GLOBAL_CACHE_TTL_MS) {
    return globalCache;
  }

  try {
    const snap = await adminDb.collection('relayBlockConfigs').get();
    const configs: UnifiedBlockConfig[] = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        verticalId: d.verticalId ?? 'shared',
        family: d.family ?? '',
        label: d.label ?? doc.id,
        description: d.description ?? '',
        stage: d.stage ?? '',
        status: d.status ?? 'active',
        intents: d.intents ?? [],
        fields_req: d.fields_req ?? [],
        fields_opt: d.fields_opt ?? [],
        module: d.module ?? null,
        moduleBinding: d.moduleBinding ?? null,
        sampleData: d.sampleData ?? {},
        promptSchema: d.promptSchema ?? '',
        preloadable: d.preloadable ?? false,
        streamable: d.streamable ?? false,
        cacheDuration: d.cacheDuration ?? 0,
        variants: d.variants ?? [],
        applicableCategories: d.applicableCategories ?? [],
        createdAt: d.createdAt ?? '',
        updatedAt: d.updatedAt ?? '',
      } as UnifiedBlockConfig;
    });

    globalCache = configs;
    globalCacheFetchedAt = now;
    return configs;
  } catch (err) {
    console.error('Failed to fetch block configs from Firestore:', err);
    if (globalCache) return globalCache; // stale cache better than nothing
    return [];
  }
}

export async function getBlockConfig(blockId: string): Promise<UnifiedBlockConfig | undefined> {
  const configs = await getGlobalBlockConfigs();
  return configs.find(c => c.id === blockId);
}

// ── Per-tenant overlay ───────────────────────────────────────────────

async function getPartnerBlockOverrides(partnerId: string): Promise<Array<{ id: string; isVisible: boolean }>> {
  const now = Date.now();
  const cached = partnerCache.get(partnerId);
  if (cached && now - cached.fetchedAt < PARTNER_CACHE_TTL_MS) {
    return cached.blocks;
  }

  const merged = new Map<string, boolean>();

  // Legacy path: partners/{id}/relayConfig/blocks subcollection
  try {
    const snap = await adminDb
      .collection(`partners/${partnerId}/relayConfig/blocks`)
      .select('isVisible')
      .get();
    for (const doc of snap.docs) {
      merged.set(doc.id, doc.data().isVisible !== false);
    }
  } catch {
    // Ignore — will still try the doc path
  }

  // Current path: partners/{id}/relayConfig/blockOverrides doc with map
  try {
    const doc = await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .get();
    if (doc.exists) {
      const data = doc.data() || {};
      const blockOverrides = (data.blockOverrides || {}) as Record<string, { enabled?: boolean }>;
      for (const [id, v] of Object.entries(blockOverrides)) {
        // Doc path wins over legacy subcollection (newer source)
        merged.set(id, v?.enabled !== false);
      }
    }
  } catch {
    // Ignore — return whatever we got from the legacy path
  }

  const overrides = Array.from(merged, ([id, isVisible]) => ({ id, isVisible }));
  partnerCache.set(partnerId, { blocks: overrides, fetchedAt: now });
  return overrides;
}

async function getPartnerCategory(partnerId: string): Promise<string | null> {
  try {
    const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) return null;
    const data = partnerDoc.data() as Record<string, any> | undefined;
    return data?.businessPersona?.identity?.businessCategories?.[0]?.functionId ?? null;
  } catch {
    return null;
  }
}

export async function getActiveBlocksForPartner(partnerId: string): Promise<UnifiedBlockConfig[]> {
  const [allConfigs, overrides, category] = await Promise.all([
    getGlobalBlockConfigs(),
    getPartnerBlockOverrides(partnerId),
    getPartnerCategory(partnerId),
  ]);

  const overrideMap = new Map(overrides.map(o => [o.id, o.isVisible]));

  return allConfigs.filter(config => {
    // Must be globally active
    if (config.status !== 'active') return false;
    // Filter by partner's sub-category: empty applicableCategories = shared/universal
    if (category && config.applicableCategories?.length
      && !config.applicableCategories.includes(category)) {
      return false;
    }
    // If tenant has an override, respect it; otherwise visible by default
    const tenantVisible = overrideMap.get(config.id);
    return tenantVisible !== false;
  });
}

// ── Data contract helpers ────────────────────────────────────────────

export function computeFieldsFromConfigs(blockIds: string[], configs: UnifiedBlockConfig[]): { required: string[]; optional: string[] } {
  const requiredSet = new Set<string>();
  const optionalSet = new Set<string>();

  for (const id of blockIds) {
    const config = configs.find(c => c.id === id);
    if (!config) continue;
    for (const f of config.fields_req) requiredSet.add(f);
    for (const f of config.fields_opt) {
      if (!requiredSet.has(f)) optionalSet.add(f);
    }
  }

  return { required: Array.from(requiredSet), optional: Array.from(optionalSet) };
}

// ── AI prompt generation ─────────────────────────────────────────────

export function buildBlockSchemasFromConfigs(
  blocks: UnifiedBlockConfig[],
  opts: { globalEmpty?: boolean } = {}
): string {
  const blocksWithSchemas = blocks.filter(b => b.promptSchema);
  if (blocksWithSchemas.length === 0) {
    // No hardcoded fallback any more — Firestore is the source of truth.
    // If the global registry is empty (not yet seeded) or the partner filter
    // narrows to zero, serve the same minimal text-only schema either way.
    if (opts.globalEmpty !== false) {
      console.warn('No block promptSchemas found in Firestore');
    }
    return MINIMAL_FALLBACK_SCHEMA;
  }

  const lines: string[] = ['RESPOND ONLY IN JSON. Choose the most appropriate block type:'];
  for (const block of blocksWithSchemas) {
    lines.push('');
    lines.push(block.promptSchema);
    if (block.description) {
      const intentHint = block.intents.length > 0
        ? `. Intent keywords: ${block.intents.slice(0, 5).join(', ')}`
        : '';
      lines.push(`— ${block.label}: ${block.description}${intentHint}`);
    }
  }
  return lines.join('\n');
}
