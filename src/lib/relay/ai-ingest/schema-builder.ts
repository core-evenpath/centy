// ── Zod schema builder from a ModuleSchema ─────────────────────────────
//
// Converts a partner's `ModuleSchema` into a dynamic Zod schema that
// the Genkit `ai.generate({ output: { schema } })` call uses to coerce
// the LLM output. Pure — no network / no fs / no React.
//
// Only the `ModuleFieldType`s that actually exist in the codebase are
// handled (see `src/lib/modules/types.ts`). Unknown types fall back to
// `string` so future schema additions don't crash the builder.

import { z } from 'zod';
import type { ModuleSchema } from '@/lib/modules/types';

function zodForFieldType(
  type: string,
  options: string[] | undefined,
): z.ZodTypeAny {
  switch (type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'url':
    case 'phone':
    case 'image':
    case 'time':
    case 'duration':
      return z.string();
    case 'date':
      return z.string().describe('ISO 8601 date string');
    case 'number':
    case 'currency':
      return z.number();
    case 'toggle':
      return z.boolean();
    case 'select':
      if (options && options.length > 0) {
        return z.enum(options as [string, ...string[]]);
      }
      return z.string();
    case 'multi_select':
    case 'tags':
      return z.array(z.string());
    default:
      return z.string();
  }
}

export interface ItemShape {
  name: z.ZodString;
  description: z.ZodOptional<z.ZodString>;
  category: z.ZodOptional<z.ZodString>;
  price: z.ZodOptional<z.ZodNumber>;
  currency: z.ZodOptional<z.ZodString>;
  fields: z.ZodObject<Record<string, z.ZodTypeAny>>;
  confidence: z.ZodNumber;
  preview: z.ZodOptional<z.ZodString>;
}

/**
 * Build the extraction output schema. `maxItems` caps the array length
 * so the LLM can't dump thousands of items.
 */
export function buildExtractionSchema(schema: ModuleSchema, maxItems = 50) {
  const fieldShape: Record<string, z.ZodTypeAny> = {};
  for (const f of schema.fields) {
    let z0 = zodForFieldType(f.type, f.options);
    if (!f.isRequired) z0 = z0.optional();
    if (f.description) z0 = z0.describe(f.description);
    else if (f.placeholder) z0 = z0.describe(f.placeholder);
    fieldShape[f.id] = z0;
  }

  const ItemSchema = z.object({
    name: z.string().describe('Item name / title'),
    description: z.string().optional().describe('Short description'),
    category: z.string().optional().describe('Category this item belongs to'),
    price: z.number().optional().describe('Price as a number, no symbol'),
    currency: z
      .string()
      .optional()
      .describe('Currency code (INR, USD, EUR, …)'),
    fields: z
      .object(fieldShape)
      .describe('Additional structured fields from the module schema'),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe('Extraction confidence between 0 and 1'),
    preview: z
      .string()
      .optional()
      .describe('One or two sentence preview of the item'),
  });

  return z.object({
    items: z
      .array(ItemSchema)
      .max(maxItems)
      .describe(`Extracted items, up to ${maxItems}`),
    warnings: z
      .array(z.string())
      .optional()
      .describe('Optional warnings about extraction quality'),
  });
}

export type ExtractionSchema = ReturnType<typeof buildExtractionSchema>;
