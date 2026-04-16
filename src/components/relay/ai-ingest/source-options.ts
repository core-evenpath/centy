// ── Source picker option catalogue ─────────────────────────────────────
//
// Keeps the static "which sources exist + how they describe themselves"
// list out of the modal component so it's easy to add / remove a
// source without touching the UI.

import {
  FileText,
  Globe,
  Sparkles,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import type { IngestSource } from '@/lib/relay/ai-ingest/types';

export type PickableSource = Exclude<IngestSource, 'core_memory'>;

export interface SourceOption {
  id: PickableSource;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bg: string;
}

export const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'website',
    icon: Globe,
    title: 'Import from website',
    description: 'Paste your website URL — AI extracts products / services',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'Upload PDF',
    description: 'Menu, catalog, brochure, or price list as a PDF',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    id: 'text',
    icon: Upload,
    title: 'Paste text',
    description: 'Paste any content — AI parses it',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    id: 'ai_generate',
    icon: Sparkles,
    title: 'Generate with AI',
    description: 'Describe what you want — AI creates starter items',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
];
