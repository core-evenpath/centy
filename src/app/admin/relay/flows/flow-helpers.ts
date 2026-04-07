import { getBlocksForFunction, getSubVertical, VERTICALS } from '../blocks/previews/registry';
import {
  getFlowTemplateForFunction,
  buildStandardTransitions,
  defaultSettings,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_INTENTS,
  STAGE_SCORES,
} from '@/lib/flow-templates';
import type { SystemFlowTemplate, FlowStage } from '@/lib/types-flow-engine';
import type { VerticalBlockDef } from '../blocks/previews/_types';

export const CURATED_IDS = new Set([
  'hotels_resorts',
  'full_service_restaurant',
  'fitness_gym',
  'dental_care',
  'real_estate',
  'ecommerce_d2c',
  'hair_beauty',
  'plumbing_electrical',
]);

export function buildFlowSync(functionId: string): SystemFlowTemplate | null {
  const existing = getFlowTemplateForFunction(functionId);
  if (existing) return existing;

  const result = getSubVertical(functionId);
  if (!result) return null;
  const { vertical, subVertical } = result;
  const blocks = getBlocksForFunction(functionId);

  const blocksByStage: Record<string, string[]> = {};
  for (const b of blocks) {
    if (!blocksByStage[b.stage]) blocksByStage[b.stage] = [];
    blocksByStage[b.stage].push(b.id);
  }

  const prefix = functionId.replace(/[^a-z0-9]/g, '_').substring(0, 10);

  const stages: FlowStage[] = STAGE_ORDER
    .filter(stageType => blocksByStage[stageType]?.length > 0)
    .map(stageType => ({
      id: `${prefix}_${stageType}`,
      type: stageType,
      label: STAGE_LABELS[stageType] || stageType,
      blockTypes: blocksByStage[stageType],
      intentTriggers: STAGE_INTENTS[stageType] || ['browsing'],
      leadScoreImpact: STAGE_SCORES[stageType] || 1,
      ...(stageType === 'greeting' ? { isEntry: true } : {}),
      ...(stageType === 'handoff' ? { isExit: true } : {}),
    }));

  if (stages.length === 0) return null;

  const transitions = buildStandardTransitions(stages);

  return {
    id: `tpl_${functionId}`,
    name: `${subVertical.name} Flow`,
    industryId: vertical.industryId,
    functionId,
    industryName: vertical.name,
    functionName: subVertical.name,
    description: `Auto-generated flow for ${subVertical.name}`,
    settings: defaultSettings(),
    stages,
    transitions,
  };
}

export function getBlockMap(functionId: string): Map<string, VerticalBlockDef> {
  const blocks = getBlocksForFunction(functionId);
  return new Map(blocks.map(b => [b.id, b]));
}

export const T = {
  bg: '#f8f8f6',
  surface: '#ffffff',
  accent: '#4f46e5',
  accentBg: 'rgba(79,70,229,0.06)',
  accentBg2: 'rgba(79,70,229,0.12)',
  t1: '#1c1917',
  t2: '#44403c',
  t3: '#78716c',
  t4: '#a8a29e',
  bdr: '#e7e5e4',
  green: '#16a34a',
  greenBg: 'rgba(22,163,74,0.08)',
} as const;

export { VERTICALS };
export type { SystemFlowTemplate, VerticalBlockDef };
