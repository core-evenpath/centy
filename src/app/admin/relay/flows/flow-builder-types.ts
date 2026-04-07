import { FLOW_STAGE_STYLES } from '../blocks/previews/_types';
import { ALL_BLOCKS } from '../blocks/previews/registry';

// Re-export stage colors for use by FlowCanvas
export { FLOW_STAGE_STYLES };

// ── Theme (identical to AdminRelayBlocks.tsx) ────────────────────────

export const T = {
  pri: "#2d4a3e", priLt: "#3d6354", priBg: "rgba(45,74,62,0.06)", priBg2: "rgba(45,74,62,0.12)",
  acc: "#c4704b", accBg: "rgba(196,112,75,0.06)", accBg2: "rgba(196,112,75,0.12)",
  bg: "#f7f3ec", surface: "#ffffff", card: "#f2ede5",
  t1: "#1a1a18", t2: "#3d3d38", t3: "#7a7a70", t4: "#a8a89e",
  bdr: "#e8e4dc", bdrM: "#d4d0c8",
  green: "#2d6a4f", greenBg: "rgba(45,106,79,0.06)", greenBdr: "rgba(45,106,79,0.12)",
  red: "#b91c1c", redBg: "rgba(185,28,28,0.05)",
  amber: "#b45309", amberBg: "rgba(180,83,9,0.06)",
  blue: "#1d4ed8", blueBg: "rgba(29,78,216,0.06)",
  pink: "#be185d", pinkBg: "rgba(190,24,93,0.06)",
};

// ── Stage Layout Positions (fixed, horizontal flow) ──────────────────

export const STAGE_POSITIONS: Record<string, { x: number; y: number }> = {
  greeting:     { x: 60,   y: 180 },
  discovery:    { x: 260,  y: 100 },
  showcase:     { x: 460,  y: 180 },
  comparison:   { x: 660,  y: 100 },
  social_proof: { x: 660,  y: 260 },
  conversion:   { x: 860,  y: 180 },
  objection:    { x: 860,  y: 300 },
  handoff:      { x: 1060, y: 260 },
  followup:     { x: 1060, y: 100 },
};

export const DEFAULT_STAGE_POSITION = { x: 60, y: 180 };

// ── Interfaces ───────────────────────────────────────────────────────

export interface FlowBuilderStage {
  id: string;
  name: string;
  type: string;
  blockIds: string[];
  intentTriggers: string[];
  leadScoreImpact: number;
  isEntry?: boolean;
  isExit?: boolean;
}

export interface FlowBuilderTransition {
  from: string;
  to: string;
  trigger: string;
  priority?: number;
}

export interface FlowBuilderTemplate {
  id: string;
  name: string;
  status: string;
  functionId?: string;
  stages: FlowBuilderStage[];
  transitions: FlowBuilderTransition[];
}

// ── Sub-Vertical Flow Summary ───────────────────────────────────────

export interface SubVerticalFlowSummary {
  functionId: string;
  name: string;
  industryId: string;
  verticalName: string;
  blockCount: number;
  hasCustomTemplate: boolean;
  hasDbTemplate: boolean;
}

export interface VerticalGroup {
  id: string;
  industryId: string;
  name: string;
  iconName: string;
  accentColor: string;
  subVerticalIds: string[];
}

// ── Registry Helper ──────────────────────────────────────────────────

export interface RegistryBlockSummary {
  id: string;
  label: string;
  family: string;
  stage: string;
  module: string | null;
}

export function getRegistryBlocksForStage(stageId: string): RegistryBlockSummary[] {
  return ALL_BLOCKS
    .filter(b => b.stage === stageId)
    .map(b => ({
      id: b.id,
      label: b.label,
      family: b.family,
      stage: b.stage,
      module: b.module,
    }));
}
