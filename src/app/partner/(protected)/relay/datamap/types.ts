// ─── Content Studio types (datamap page) ────────────────────────
// Re-exports from the canonical project types plus the local
// `MappedFeature` shape used by the UI components in this folder.

import type {
  ContentStudioConfig as _ContentStudioConfig,
  ContentStudioBlockEntry as _Block,
  PartnerContentStudioState as _State,
  PartnerSubVerticalOption as _SubV,
} from '@/lib/types-content-studio';

export type ContentStudioConfig = _ContentStudioConfig;
export type ContentStudioState = _State;
export type BlockConfig = _Block;
export type BlockState = _State['blockStates'][string];
export type SubVerticalOption = _SubV;

/** A mapped/resolved feature ready for rendering */
export interface MappedFeature {
    id: string;
    icon: string;
    customer: string;
    you: string;
    priority: number;
    items: number;
    source: string | null;
    ready: boolean;
    auto: boolean;
    depends?: string;
    missReason?: string;
    backend?: boolean;
    templateCols?: string[];
}

// ── AI collection flow ──────────────────────────────────────────────────
//
// Used by the "needs your input" expandable card to walk the partner
// through the "Let AI collect for you" option.

export type AIFlowState =
    | 'idle'
    | 'checking'
    | 'found'
    | 'not_found';

export interface MatchedModule {
    moduleId: string;
    moduleSlug: string;
    moduleName: string;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
    fields: string[];
}

export interface GeneratedPrompt {
    id: string;
    question: string;
    editable: boolean;
}
