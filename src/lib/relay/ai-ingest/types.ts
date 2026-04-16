// ── AI ingest types ─────────────────────────────────────────────────────
//
// Pure types consumed by the engine, the server actions, the API route,
// and the client modals. No Firestore / no React / no Zod — kept
// dependency-free so it's cheap to pull into any edge.

export type IngestSource =
  | 'website'
  | 'pdf'
  | 'text'
  | 'core_memory'
  | 'ai_generate';

export type IngestStatus =
  | 'idle'
  | 'extracting'
  | 'analyzing'
  | 'ready'
  | 'saving'
  | 'complete'
  | 'error';

export interface IngestInput {
  partnerId: string;
  moduleId: string;
  moduleSlug: string;
  source: IngestSource;

  websiteUrl?: string;
  pdfBase64?: string;
  pdfFilename?: string;
  rawText?: string;
  coreMemoryDocIds?: string[];
  aiPrompt?: string;

  maxItems?: number;
}

export interface ExtractedItem {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  images?: string[];

  fields: Record<string, unknown>;

  sourceUrl?: string;
  confidence: number;
  preview?: string;
}

export interface IngestResult {
  success: boolean;
  status: IngestStatus;
  items: ExtractedItem[];
  source: IngestSource;
  sourceLabel: string;
  totalExtracted: number;
  processingTimeMs: number;
  warnings?: string[];
  error?: string;
}

export interface SaveIngestedResult {
  success: boolean;
  created?: number;
  failed?: number;
  error?: string;
}
