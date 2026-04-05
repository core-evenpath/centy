import { SHARED_BLOCKS, SHARED_BLOCK_IDS } from './shared';
import { ECOM_CONFIG } from './ecommerce';
import { EDU_CONFIG } from './education';
import type { BlockRegistryData, VerticalConfig, VerticalBlockDef, SubVerticalDef } from './_types';

const VERTICALS: VerticalConfig[] = [
  ECOM_CONFIG,
  EDU_CONFIG,
];

const ALL_BLOCKS: VerticalBlockDef[] = [
  ...SHARED_BLOCKS,
  ...VERTICALS.flatMap(v => v.blocks),
];

const ALL_SUB_VERTICALS: SubVerticalDef[] = VERTICALS.flatMap(v => v.subVerticals);

export function getBlocksForFunction(functionId: string): VerticalBlockDef[] {
  for (const v of VERTICALS) {
    const sub = v.subVerticals.find(s => s.id === functionId);
    if (sub) {
      const verticalBlocks = sub.blocks
        .map(id => v.blocks.find(b => b.id === id))
        .filter(Boolean) as VerticalBlockDef[];
      return [...SHARED_BLOCKS, ...verticalBlocks];
    }
  }
  return SHARED_BLOCKS;
}

export function getVerticalForIndustry(industryId: string): VerticalConfig | null {
  return VERTICALS.find(v => v.industryId === industryId) || null;
}

export function getSubVertical(functionId: string): { vertical: VerticalConfig; subVertical: SubVerticalDef } | null {
  for (const v of VERTICALS) {
    const sub = v.subVerticals.find(s => s.id === functionId);
    if (sub) return { vertical: v, subVertical: sub };
  }
  return null;
}

export function getAllFamilies(): Record<string, { label: string; color: string }> {
  const families: Record<string, { label: string; color: string }> = {
    shared: { label: 'Shared / Universal', color: '#7a7a70' },
  };
  for (const v of VERTICALS) {
    Object.assign(families, v.families);
  }
  return families;
}

export function getBlockById(blockId: string): VerticalBlockDef | undefined {
  return ALL_BLOCKS.find(b => b.id === blockId);
}

export function getBlocksByStage(stage: string): VerticalBlockDef[] {
  return ALL_BLOCKS.filter(b => b.stage === stage);
}

export const BLOCK_REGISTRY: BlockRegistryData = {
  verticals: VERTICALS,
  sharedBlocks: SHARED_BLOCKS,
  allBlocks: ALL_BLOCKS,
  getBlocksForFunction,
  getVerticalForIndustry,
  getSubVertical,
};

export { SHARED_BLOCKS, SHARED_BLOCK_IDS, VERTICALS, ALL_BLOCKS, ALL_SUB_VERTICALS };