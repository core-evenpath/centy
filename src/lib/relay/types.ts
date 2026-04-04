import type React from 'react';

export type BlockFamily =
  | 'navigation'
  | 'catalog'
  | 'detail'
  | 'compare'
  | 'form'
  | 'promo'
  | 'cart'
  | 'confirmation'
  | 'tracking'
  | 'engagement'
  | 'support'
  | 'shared';

export interface FieldSpec {
  field: string;
  type: 'text' | 'number' | 'currency' | 'select' | 'tags' | 'toggle' | 'date' | 'url' | 'email' | 'phone' | 'textarea' | 'image' | 'images' | 'rating';
  label?: string;
  options?: string[];
}

export interface DataContract {
  required: FieldSpec[];
  optional: FieldSpec[];
}

export interface IntentTrigger {
  keywords: string[];
  queryPatterns: string[];
  dataConditions: string[];
}

export interface BlockDefinition {
  id: string;
  family: BlockFamily;
  label: string;
  description: string;
  applicableCategories: string[];
  intentTriggers: IntentTrigger;
  dataContract: DataContract;
  variants: string[];
  sampleData: Record<string, any>;
  preloadable: boolean;
  streamable: boolean;
  cacheDuration: number;
}

export interface BlockTheme {
  accent: string;
  accentBg: string;
  accentBg2: string;
  bg: string;
  surface: string;
  t1: string;
  t2: string;
  t3: string;
  t4: string;
  bdr: string;
  bdrM: string;
  green: string;
  greenBg: string;
  greenBdr: string;
  red: string;
  redBg: string;
  amber: string;
  amberBg: string;
}

export const DEFAULT_THEME: BlockTheme = {
  accent: '#c2410c',
  accentBg: 'rgba(194,65,12,0.06)',
  accentBg2: 'rgba(194,65,12,0.11)',
  bg: '#faf8f5',
  surface: '#ffffff',
  t1: '#1c1917',
  t2: '#44403c',
  t3: '#78716c',
  t4: '#a8a29e',
  bdr: '#e7e5e4',
  bdrM: '#d6d3d1',
  green: '#16a34a',
  greenBg: 'rgba(22,163,74,0.06)',
  greenBdr: 'rgba(22,163,74,0.14)',
  red: '#dc2626',
  redBg: 'rgba(220,38,38,0.05)',
  amber: '#d97706',
  amberBg: 'rgba(217,119,6,0.06)',
};

export interface BlockComponentProps {
  data: Record<string, any>;
  theme: BlockTheme;
  variant?: string;
  overrides?: {
    fieldPriority?: string[];
    labelOverrides?: Record<string, string>;
    customConfig?: Record<string, any>;
  };
}

export interface BlockRegistryEntry {
  definition: BlockDefinition;
  component: React.ComponentType<BlockComponentProps>;
}

export interface BlockMatch {
  blockId: string;
  confidence: number;
  matchedBy: 'keyword' | 'pattern' | 'condition';
}

// ── Session types ─────────────────────────────────────────────────────

export interface SessionModuleItem {
  id: string;
  moduleSlug: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  tags?: string[];
  status: string;
  raw: Record<string, any>;
}

export interface SessionBrand {
  name: string;
  tagline: string;
  emoji: string;
  accentColor: string;
  logoUrl?: string;
  welcomeMessage?: string;
}

export interface SessionContact {
  whatsapp?: string;
  phone?: string;
  email?: string;
}

export interface SessionFlowStage {
  id: string;
  type: string;
  label: string;
  blockIds: string[];
  transitions: { target: string; condition?: string }[];
}

export interface SessionFlowDefinition {
  id: string;
  vertical: string;
  stages: SessionFlowStage[];
  defaultStageId: string;
}

export interface SessionBlockOverride {
  blockId: string;
  isVisible: boolean;
  sortOrder: number;
  customLabel?: string;
  customConfig?: Record<string, any>;
}

export interface RelaySessionData {
  partnerId: string;
  category: string;
  brand: SessionBrand;
  contact: SessionContact;
  items: SessionModuleItem[];
  blocks: BlockDefinition[];
  flow?: SessionFlowDefinition;
  blockOverrides: SessionBlockOverride[];
  cachedAt: number;
}
