// ── Module analytics types ──────────────────────────────────────────────
//
// Shapes returned by `/admin/relay/modules`. Kept here (no
// `'use server'` / `server-only`) so the client view component can
// import the types without pulling the action module into the client
// bundle.

export interface BlockModuleBinding {
  blockId: string;
  blockLabel: string;
  blockFamily: string;
  blockStatus: 'active' | 'new' | 'planned';
  verticals: string[];

  moduleSlug: string | null;
  moduleConnected: boolean;
  moduleName?: string;
  moduleItemCount?: number;

  isDark: boolean;        // Needs a module but no partner data yet
  isConfigured: boolean;  // Has a relayBlockConfigs doc
}

export interface ModuleBlockUsage {
  moduleId: string;
  moduleSlug: string;
  moduleName: string;
  moduleColor: string;

  connectedBlocks: {
    blockId: string;
    blockLabel: string;
    verticals: string[];
  }[];

  itemCount: number;
  partnerCount: number;
}

export interface RelayModuleAnalytics {
  connectedBlocks: BlockModuleBinding[];
  darkBlocks: BlockModuleBinding[];
  modules: ModuleBlockUsage[];

  totalBlocks: number;
  blocksWithModules: number;
  darkBlockCount: number;
  totalModules: number;
}

export interface SimpleBlockRef {
  blockId: string;
  blockLabel: string;
  verticals: string[];
}
