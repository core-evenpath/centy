// ── AI extraction engine ───────────────────────────────────────────────
//
// Thin orchestrator around `ai.generate()`. Takes raw text content plus
// a `ModuleSchema`, builds the Zod output schema + prompt, calls
// Gemini, and shapes the result into `ExtractedItem[]`. Keeps all the
// Genkit / googleAI surface in one file so everyone else can stay
// framework-agnostic.

import 'server-only';
import { googleAI } from '@genkit-ai/google-genai';
import { ai } from '@/ai/genkit';
import type { ModuleSchema } from '@/lib/modules/types';
import type { ExtractedItem } from './types';
import { buildExtractionSchema } from './schema-builder';
import { buildExtractionPrompt } from './prompt-builder';

export interface ExtractOptions {
  maxItems?: number;
  industryContext?: string;
}

export interface ExtractResult {
  items: ExtractedItem[];
  warnings?: string[];
}

const EXTRACTION_MODEL = 'gemini-2.5-flash';
const DEFAULT_MAX_ITEMS = 50;

export async function extractItemsFromContent(
  content: string,
  schema: ModuleSchema,
  moduleLabel: string,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
  const outputSchema = buildExtractionSchema(schema, maxItems);
  const prompt = buildExtractionPrompt(schema, content, moduleLabel, {
    maxItems,
    industryContext: options.industryContext,
  });

  const result = await ai.generate({
    model: googleAI.model(EXTRACTION_MODEL),
    prompt,
    output: {
      format: 'json',
      schema: outputSchema,
    },
    config: { temperature: 0.3 },
  });

  // In the current Genkit `ai` type the `output` property is inferred
  // as unknown because we pass the schema at runtime via `output.schema`.
  // The value shape is guaranteed by Zod though, so cast narrowly.
  type RawItem = {
    name: string;
    description?: string;
    category?: string;
    price?: number;
    currency?: string;
    fields?: Record<string, unknown>;
    confidence?: number;
    preview?: string;
  };
  const output = result.output as
    | { items?: RawItem[]; warnings?: string[] }
    | null
    | undefined;
  if (!output) {
    return { items: [], warnings: ['AI returned no output'] };
  }

  const items: ExtractedItem[] = (output.items ?? []).map((raw) => ({
    name: raw.name,
    description: raw.description,
    category: raw.category,
    price: raw.price,
    currency: raw.currency ?? 'INR',
    fields: (raw.fields ?? {}) as Record<string, unknown>,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.7,
    preview: raw.preview,
  }));

  return { items, warnings: output.warnings };
}
