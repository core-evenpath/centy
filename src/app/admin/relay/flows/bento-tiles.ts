import { getBlocksForFunction, getSubVertical } from '../blocks/previews/registry';
import { STAGE_ORDER } from './flow-helpers';
import type { VerticalBlockDef } from '../blocks/previews/_types';

export interface BentoTile {
  id: string;
  label: string;
  sub: string;
  iconName: string;
  size: 'large' | 'medium' | 'small';
  stage: string;
  familyColor?: string;
}

const STAGE_ICON: Record<string, string> = {
  greeting: 'MessageCircle',
  discovery: 'Search',
  showcase: 'Eye',
  comparison: 'BarChart3',
  social_proof: 'Star',
  conversion: 'ShoppingBag',
  objection: 'Shield',
  handoff: 'Phone',
  followup: 'Clock',
};

const STAGE_SUB: Record<string, string> = {
  greeting: 'Get started',
  discovery: 'Explore options',
  showcase: 'View details',
  comparison: 'Side by side',
  social_proof: 'What customers say',
  conversion: 'Take action',
  objection: 'Your questions answered',
  handoff: 'Talk to our team',
  followup: 'Track your order',
};

/** Pick the most representative block for a stage (prefer non-shared). */
function pickRepresentative(blocks: VerticalBlockDef[]): VerticalBlockDef {
  return blocks.find(b => b.family !== 'shared') || blocks[0];
}

export function buildBentoTiles(functionId: string): BentoTile[] {
  const result = getSubVertical(functionId);
  if (!result) return [];

  const { vertical } = result;
  const blocks = getBlocksForFunction(functionId);
  if (!blocks.length) return [];

  // Group blocks by stage
  const byStage: Record<string, VerticalBlockDef[]> = {};
  for (const b of blocks) {
    if (!byStage[b.stage]) byStage[b.stage] = [];
    byStage[b.stage].push(b);
  }

  // Build tiles in stage order
  const tiles: BentoTile[] = [];
  for (const stage of STAGE_ORDER) {
    const stageBlocks = byStage[stage];
    if (!stageBlocks?.length) continue;
    if (tiles.length >= 6) break;

    const rep = pickRepresentative(stageBlocks);
    const familyDef = vertical.families[rep.family];

    tiles.push({
      id: `${stage}_${rep.id}`,
      label: rep.label,
      sub: STAGE_SUB[stage] || stage.replace(/_/g, ' '),
      iconName: STAGE_ICON[stage] || 'Layers',
      stage,
      size: tiles.length === 0 ? 'large' : tiles.length < 3 ? 'medium' : 'small',
      familyColor: familyDef?.color,
    });
  }

  return tiles;
}
