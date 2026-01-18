// src/components/partner/settings/import-center/types.ts
// Types for Import Center v5

import type { LucideIcon } from 'lucide-react';

// Tab types
export type ImportCenterTab = 'import' | 'merge' | 'products' | 'testimonials' | 'ai' | 'final';

// Field source type
export type FieldSource = 'google' | 'website' | 'custom' | 'manual' | 'none';

// Imported field with source tracking
export interface ImportedField<T = any> {
  value: T;
  source: FieldSource;
  confidence?: number;
  importedAt?: string;
  verified?: boolean;
}

// Merge field for conflict resolution
export interface MergeField {
  key: string;              // e.g., "identity.tagline"
  label: string;
  icon?: LucideIcon;
  category: 'identity' | 'contact' | 'industry' | 'social';
  critical?: boolean;       // Key field flag
  multiline?: boolean;
  googleValue: any | null;
  websiteValue: any | null;
  finalValue: any | null;
  selectedSource: FieldSource;
  hasConflict: boolean;
}

// Product from imported data
export interface ImportedProduct {
  id: string;
  name: string;
  description: string;
  category?: string;
  pricing?: string;
  features?: string[];
  popular?: boolean;
  selected: boolean;
  source: FieldSource;
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
  category: 'core' | 'products' | 'testimonials';
  applied: boolean;
}

// Import stats
export interface ImportStats {
  fields: number;
  products: number;
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

  // Data
  mergeFields: MergeField[];
  products: ImportedProduct[];
  testimonials: EnrichedTestimonial[];
  suggestions: AISuggestion[];

  // UI state
  editingField: string | null;
  editValue: string;
  suggestionFilter: 'all' | 'core' | 'products' | 'testimonials';
  expandedSections: Record<string, boolean>;

  // Apply state
  isApplying: boolean;
  applied: boolean;
}

// Field definition for merge
export interface FieldDefinition {
  key: string;
  label: string;
  icon?: LucideIcon;
  category: 'identity' | 'contact' | 'industry' | 'social';
  critical?: boolean;
  multiline?: boolean;
}

// Category definition
export interface CategoryDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}
