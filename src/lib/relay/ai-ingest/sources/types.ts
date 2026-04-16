// Shared source-adapter result shape. Each adapter turns a source
// (website / pdf / text / doc ids / ai prompt) into raw text content
// that the extraction engine can consume. Dependency-free.

export interface SourceExtractionResult {
  success: boolean;
  content: string;
  sourceLabel: string;
  pagesScraped?: string[];
  error?: string;
}
