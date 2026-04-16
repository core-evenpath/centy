// ── Extraction prompt builder ───────────────────────────────────────────
//
// Produces the Gemini prompt text that, together with the matching Zod
// schema, steers structured item extraction. Pure — no AI call, no
// Firestore. All inputs are plain data.

import type { ModuleSchema } from '@/lib/modules/types';

export interface BuildPromptOptions {
  maxItems: number;
  industryContext?: string;
}

const MAX_CONTENT_CHARS = 30_000;

function describeFields(schema: ModuleSchema): string {
  if (schema.fields.length === 0) return '  (no custom fields)';
  return schema.fields
    .map((f) => {
      const required = f.isRequired ? ' (REQUIRED)' : ' (optional)';
      const help = f.description ? ` — ${f.description}` : '';
      const options =
        f.options && f.options.length > 0
          ? ` [options: ${f.options.join(', ')}]`
          : '';
      return `  - ${f.id} (${f.type})${required}${help}${options}`;
    })
    .join('\n');
}

function describeCategories(schema: ModuleSchema): string {
  if (!schema.categories || schema.categories.length === 0) return '';
  const list = schema.categories.map((c) => `  - ${c.name}`).join('\n');
  return `\n\nAvailable categories (use these names when you can):\n${list}`;
}

export function buildExtractionPrompt(
  schema: ModuleSchema,
  content: string,
  moduleLabel: string,
  opts: BuildPromptOptions,
): string {
  const fieldsDesc = describeFields(schema);
  const categoriesDesc = describeCategories(schema);
  const industryHint = opts.industryContext
    ? `\n\nBusiness context: ${opts.industryContext}`
    : '';

  const trimmedContent =
    content.length > MAX_CONTENT_CHARS
      ? content.slice(0, MAX_CONTENT_CHARS)
      : content;

  return `You are an expert at extracting structured data from unstructured content.

TASK: Extract up to ${opts.maxItems} "${moduleLabel}" items from the CONTENT block below.

Each item must follow this shape:

Standard fields:
  - name (string, REQUIRED) — Item name
  - description (string, optional) — Short description
  - category (string, optional) — Category
  - price (number, optional) — Numeric price (no currency symbol)
  - currency (string, optional) — Currency code (INR, USD, …)
  - confidence (number 0-1, REQUIRED) — Your extraction confidence
  - preview (string, optional) — 1–2 sentence preview

Dynamic fields (nest under "fields"):
${fieldsDesc}${categoriesDesc}${industryHint}

EXTRACTION RULES:
1. Only extract items that clearly represent "${moduleLabel}"
2. Skip marketing copy, testimonials, and navigation
3. Prices: extract the numeric value only (e.g. "₹2,499" → 2499)
4. Currency: detect from symbols (₹=INR, $=USD, €=EUR). Default INR.
5. If multiple prices are present, use the base / regular price
6. Confidence:
   • 0.9+ — name / description / price all clear
   • 0.7–0.9 — most fields present, some inferred
   • 0.5–0.7 — name clear, many fields inferred
   • <0.5 — add a warning entry explaining why you still returned it

CONTENT:
---
${trimmedContent}
---

Return the structured JSON result.`;
}
