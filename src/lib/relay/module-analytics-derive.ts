// ── Pure block → vertical derivations ──────────────────────────────────
//
// The server-safe registry (`_registry-data.ts`) holds blocks as a flat
// list with no `vertical` field. Sub-verticals carry an `industryId`
// (the "vertical") plus the block IDs they use. This helper inverts
// that into `{ blockId → verticals[] }`.

import type { ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';

export interface SubVerticalWithIndustry {
  id: string;
  industryId?: string;
  blocks: string[];
}

const SHARED_VERTICAL = 'shared';

export function buildBlockVerticalMap(
  subVerticals: SubVerticalWithIndustry[],
  sharedBlockIds: string[],
): Map<string, string[]> {
  const map = new Map<string, Set<string>>();

  for (const sub of subVerticals) {
    const vertical = sub.industryId;
    if (!vertical) continue;
    for (const blockId of sub.blocks) {
      if (!map.has(blockId)) map.set(blockId, new Set());
      map.get(blockId)!.add(vertical);
    }
  }

  for (const id of sharedBlockIds) {
    if (!map.has(id)) map.set(id, new Set());
    map.get(id)!.add(SHARED_VERTICAL);
  }

  const out = new Map<string, string[]>();
  map.forEach((set, id) => out.set(id, Array.from(set).sort()));
  return out;
}

export function resolveBlockVerticals(
  block: ServerBlockData,
  verticalMap: Map<string, string[]>,
): string[] {
  return verticalMap.get(block.id) ?? [];
}
