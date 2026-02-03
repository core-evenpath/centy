// src/components/partner/settings/import-center/types.ts
// Types for Import Center v6 - Using Field Registry

import type { LucideIcon } from 'lucide-react';
import type {
  FieldDefinition,
  ImportSource,
  FieldCategory,
  ImportMetadata,
} from '@/lib/field-registry';

// Re-export types from field registry for convenience
export type { FieldDefinition, ImportSource, FieldCategory, ImportMetadata };

// Tab types
export type ImportCenterTab = 'import' | 'merge' | 'testimonials' | 'ai' | 'final';

// Legacy field source type (for backward compatibility during transition)
export type FieldSource = ImportSource | 'custom' | 'none';

// Merge field for conflict resolution UI
export interface MergeField {
  definition: FieldDefinition;
  values: Partial<Record<ImportSource, any>>;
  selectedSource: ImportSource | 'custom' | 'none';
  finalValue: any;
  customValue?: any;
  hasConflict: boolean;
}

// Enriched testimonial
export interface EnrichedTestimonial {
  id: string;
  quote: string;
  author?: string;
  rating?: number;
  date?: string;
  source: FieldSource;
  verified?: boolean;
  outcome?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
  selected: boolean;
  highlighted: boolean;
}

// AI Suggestion
export interface AISuggestion {
  id: string;
  type: 'improvement' | 'gap' | 'missing' | 'highlight';
  priority: 'high' | 'medium' | 'low';
  title: string;
  field?: string;
  current?: string;
  suggested: string;
  reason: string;
  category: 'core' | 'testimonials';
  applied: boolean;
}

// Import stats
export interface ImportStats {
  fields: number;
  testimonials: number;
}

// Import source card props
export interface ImportSourceCardProps {
  source: 'google' | 'website';
  imported: boolean;
  importing: boolean;
  onImport: () => void;
  onClear: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  urlValue?: string;
  onUrlChange?: (value: string) => void;
  stats: ImportStats;
  googleResults?: any[];
  selectedPlace?: any;
  onSelectPlace?: (place: any) => void;
}

// Review accordion section props
export interface ReviewAccordionSectionProps {
  title: string;
  icon: LucideIcon;
  count: string;
  status: 'complete' | 'warning' | 'default';
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  previewContent?: string;
  children: React.ReactNode;
}

// Import center state
export interface ImportCenterState {
  // Tab
  activeTab: ImportCenterTab;

  // Import sources
  googleImported: boolean;
  websiteImported: boolean;
  googleSearch: string;
  websiteUrl: string;
  importing: 'google' | 'website' | null;

  // Raw data
  googleRawData: any | null;
  websiteRawData: any | null;

  // Data
  mergeFields: MergeField[];
  testimonials: EnrichedTestimonial[];
  suggestions: AISuggestion[];

  // UI state
  editingField: string | null;
  editValue: string;
  suggestionFilter: 'all' | 'core' | 'testimonials';
  expandedSections: Record<string, boolean>;

  // Apply state
  isApplying: boolean;
  applied: boolean;
}

// Category definition for UI display
export interface CategoryDefinition {
  id: FieldCategory;
  label: string;
  icon: LucideIcon;
  iconName: string;
  color: string;
  description?: string;
}

// Taxonomy for field filtering
export interface TaxonomyConfig {
  industry?: string;
  country?: string;
  subCategory?: string;
}

// Import result from sources
export interface ImportResult {
  success: boolean;
  data?: any;
  error?: string;
  source: ImportSource;
  timestamp: string;
}

// Field update record
export interface FieldUpdate {
  path: string;
  oldValue: any;
  newValue: any;
  source: ImportSource | 'custom';
  timestamp: string;
}
