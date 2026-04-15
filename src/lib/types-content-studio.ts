/**
 * Content Studio — shared types.
 *
 * These shapes are stored in Firestore and passed between server actions
 * and client components. Keep fields serializable (no functions, no React refs).
 */

export interface ContentStudioBlockEntry {
  blockId: string;
  registryId: string;
  family: string;
  label: string;
  stage: string;
  status: 'active' | 'new' | 'planned' | 'disabled';
  customerLabel: string;
  partnerAction: string;
  missReason: string | null;
  icon: string;
  dataContract: {
    required: Array<{ field: string; type: string; label: string }>;
    optional: Array<{ field: string; type: string; label: string }>;
  };
  templateColumns: string[] | null;
  priority: number;
  moduleDependent: boolean;
  backendRequired: boolean;
  autoConfigured: boolean;
  sourceType: 'profile' | 'module' | 'upload' | 'api' | 'manual' | 'auto';
  dependsOn: string | null;
  subVerticals: string[] | 'all';
}

export interface ContentStudioFamilyDef {
  id: string;
  label: string;
  color: string;
}

export interface ContentStudioConfig {
  verticalId: string;
  verticalName: string;
  industryId: string;
  iconName: string;
  accentColor: string;
  blocks: ContentStudioBlockEntry[];
  families: Record<string, ContentStudioFamilyDef>;
  subVerticals: Array<{ id: string; name: string; blockIds: string[] }>;
  generatedAt: string;
  generatedBy: 'ai' | 'manual';
  aiModel?: string;
  version: number;
}

export interface ApiIntegrationConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'ecommerce' | 'calendar' | 'payment' | 'shipping' | 'crm' | 'custom';
  applicableVerticals: string[] | 'all';
  requiredFields: string[];
  iconName: string;
  docsUrl?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PartnerContentStudioState {
  partnerId: string;
  verticalId: string;
  blockStates: Record<
    string,
    {
      dataProvided: boolean;
      sourceType: 'upload' | 'api' | 'core_memory' | 'manual' | 'profile' | 'module' | null;
      sourceRef: string | null;
      itemCount: number;
      lastUpdatedAt: string | null;
    }
  >;
  lastViewedAt: string;
}

export const DATA_SOURCE_OPTIONS = [
  {
    id: 'upload',
    label: 'Upload a document',
    description: 'PDF, CSV, Excel — AI reads and maps fields',
    icon: 'Upload',
  },
  {
    id: 'core_memory',
    label: 'Use Core Memory documents',
    description: 'Extract from files already in your knowledge base',
    icon: 'Database',
  },
  {
    id: 'api',
    label: 'Fetch from an API',
    description: 'REST endpoint or platform integration',
    icon: 'Plug',
  },
  {
    id: 'manual',
    label: 'Enter manually',
    description: 'Type it in yourself',
    icon: 'PenLine',
  },
] as const;
