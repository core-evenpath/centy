import type { ComponentType } from 'react';
import type { BlockPreviewProps } from './_preview-props';
import type { BlockTag } from '@/lib/relay/engine-types';
import type { BlockSchemaContract } from './_schema-contract';

export interface VerticalBlockDef extends BlockSchemaContract {
  id: string;
  family: string;
  label: string;
  stage: string;
  desc: string;
  preview: ComponentType<BlockPreviewProps>;
  intents: string[];
  module: string | null;
  status?: 'active' | 'new' | 'planned';
  // Engine taggings (M04). Optional; blocks without this field are
  // untagged and ignored by engine-scoped consumers (M12+). Valid values
  // are individual engines ('booking', 'commerce', ...) or 'shared' for
  // cross-engine blocks.
  engines?: BlockTag[];
}

export interface SubVerticalDef {
  id: string;
  name: string;
  industryId: string;
  blocks: string[];
  genericBlocks?: string[];
}

export interface VerticalFamilyDef {
  label: string;
  color: string;
}

export interface VerticalConfig {
  id: string;
  industryId: string;
  name: string;
  iconName: string;
  accentColor: string;
  blocks: VerticalBlockDef[];
  subVerticals: SubVerticalDef[];
  families: Record<string, VerticalFamilyDef>;
}

export interface BlockRegistryData {
  verticals: VerticalConfig[];
  sharedBlocks: VerticalBlockDef[];
  allBlocks: VerticalBlockDef[];
  getBlocksForFunction: (functionId: string) => VerticalBlockDef[];
  getVerticalForIndustry: (industryId: string) => VerticalConfig | null;
  getSubVertical: (functionId: string) => { vertical: VerticalConfig; subVertical: SubVerticalDef } | null;
}

export const FLOW_STAGE_STYLES: Record<string, { color: string; textColor: string }> = {
  greeting: { color: '#EEEDFE', textColor: '#534AB7' },
  discovery: { color: '#E6F1FB', textColor: '#185FA5' },
  showcase: { color: '#E1F5EE', textColor: '#0F6E56' },
  comparison: { color: '#FAEEDA', textColor: '#854F0B' },
  social_proof: { color: '#FBEAF0', textColor: '#993556' },
  conversion: { color: '#EAF3DE', textColor: '#3B6D11' },
  objection: { color: '#F1EFE8', textColor: '#5F5E5A' },
  handoff: { color: '#FCEBEB', textColor: '#A32D2D' },
  followup: { color: '#E8F0FE', textColor: '#1a56db' },
};