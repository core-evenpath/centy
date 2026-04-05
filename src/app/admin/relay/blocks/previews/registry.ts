import { SHARED_BLOCKS, SHARED_BLOCK_IDS } from './shared';
import { ECOM_CONFIG } from './ecommerce';
import type { VerticalBlockDef, VerticalConfig, SubVerticalDef, BlockRegistryData } from './_types';

// ── Data ────────────────────────────────────────────────────────────

const VERTICALS: VerticalConfig[] = [ECOM_CONFIG];

const ALL_BLOCKS: VerticalBlockDef[] = [
  ...SHARED_BLOCKS,
  ...VERTICALS.flatMap(v => v.blocks),
];

const ALL_SUB_VERTICALS: SubVerticalDef[] = VERTICALS.flatMap(v => v.subVerticals);

// ── Lookup Functions ────────────────────────────────────────────────

export function getBlocksForFunction(functionId: string): VerticalBlockDef[] {
  const sub = ALL_SUB_VERTICALS.find(s => s.id === functionId);
  if (!sub) return [];
  const blockIds = [...sub.blocks, ...(sub.genericBlocks || [])];
  return ALL_BLOCKS.filter(b => blockIds.includes(b.id));
}

export function getVerticalForIndustry(industryId: string): VerticalConfig | null {
  return VERTICALS.find(v => v.industryId === industryId) || null;
}

export function getSubVertical(functionId: string): { vertical: VerticalConfig; subVertical: SubVerticalDef } | null {
  for (const vertical of VERTICALS) {
    const subVertical = vertical.subVerticals.find(s => s.id === functionId);
    if (subVertical) return { vertical, subVertical };
  }
  return null;
}

export function getAllFamilies(): Record<string, { label: string; color: string }> {
  const families: Record<string, { label: string; color: string }> = {
    shared: { label: 'Shared', color: '#7a7a70' },
  };
  for (const v of VERTICALS) {
    Object.assign(families, v.families);
  }
  return families;
}

export function getBlockById(blockId: string): VerticalBlockDef | null {
  return ALL_BLOCKS.find(b => b.id === blockId) || null;
}

export function getBlocksByStage(stage: string): VerticalBlockDef[] {
  return ALL_BLOCKS.filter(b => b.stage === stage);
}

// ── Registry Object ─────────────────────────────────────────────────

export const BLOCK_REGISTRY: BlockRegistryData = {
  verticals: VERTICALS,
  sharedBlocks: SHARED_BLOCKS,
  allBlocks: ALL_BLOCKS,
  getBlocksForFunction,
  getVerticalForIndustry,
  getSubVertical,
};

// ── Re-exports ──────────────────────────────────────────────────────

export { SHARED_BLOCKS, SHARED_BLOCK_IDS, VERTICALS, ALL_BLOCKS, ALL_SUB_VERTICALS };
