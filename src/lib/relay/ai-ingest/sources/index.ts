// Barrel for the AI-ingest source adapters.

export type { SourceExtractionResult } from './types';
export { extractFromWebsite } from './website';
export { extractFromPdf } from './pdf';
export { extractFromCoreMemory } from './core-memory';
export { extractFromText, extractFromAIPrompt } from './text';
