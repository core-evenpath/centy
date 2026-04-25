'use server';

// ── AI-driven sample item generation (PR fix-24) ─────────────────────
//
// Uses the same Gemini model that powers /admin/relay/data schema
// enrichment to generate realistic sample items per schema. The
// deterministic generator from PR fix-19b/22 only knew about ~10
// hand-coded field names; AI generation populates EVERY field in
// the schema with values appropriate to the partner's vertical,
// category, country, and currency.
//
// Flow:
//   1. Read schema fields from relaySchemas/{slug}
//   2. Build a Gemini prompt: business context + field list
//   3. Ask for 3 items with all fields populated as JSON
//   4. Validate the response shape against the field list
//   5. Return SampleItem[] (caller writes to businessModules)
//
// Cost: ~1 Gemini call per schema. 12 schemas × ~$0.005 = ~$0.06 per
// "Generate sample data" click. Cheap enough for the demo / setup
// pathway; partners only run this once or twice.

import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import { cleanAndParseJSON } from '@/lib/modules/utils';
import type { ModuleItem } from '@/lib/modules/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL = 'gemini-3.1-pro-preview';

export interface PartnerSeedContext {
  vertical?: string | null;
  category?: string | null;
  country?: string | null;
  currency?: string | null;
  brandName?: string | null;
}

interface SchemaField {
  name: string;
  type?: string;
  label?: string;
  isRequired?: boolean;
}

interface RawSchema {
  schema?: { fields?: SchemaField[] };
  fields?: SchemaField[];
  name?: string;
  description?: string;
  defaultCurrency?: string;
}

function buildPrompt(args: {
  slug: string;
  schemaName: string;
  fields: SchemaField[];
  ctx: PartnerSeedContext;
}): string {
  const { slug, schemaName, fields, ctx } = args;
  const businessLine = [
    ctx.brandName ? `Brand: "${ctx.brandName}"` : null,
    ctx.category ? `Category: ${ctx.category}` : null,
    ctx.vertical ? `Vertical: ${ctx.vertical}` : null,
    ctx.country ? `Country: ${ctx.country}` : null,
    ctx.currency ? `Currency: ${ctx.currency}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const fieldList = fields
    .map(
      (f, i) =>
        `${i + 1}. "${f.name}" (${f.type ?? 'text'})${
          f.isRequired ? ' [required]' : ''
        }${f.label ? ` — ${f.label}` : ''}`,
    )
    .join('\n');

  return `You are generating realistic SAMPLE DATA for a small business so they can preview their bot's responses before adding their real catalog.

Business context:
${businessLine || '(no specific business context — use sensible generic defaults)'}

Schema slug: ${slug}
Schema name: ${schemaName}

Generate exactly 3 items. Each item is a JSON object with the following fields. Populate EVERY field with a believable value appropriate to the business context above. If a field's purpose isn't obvious from its name, make a reasonable guess based on the schema slug + field type.

Fields to populate:
${fieldList}

Output rules:
- Strict JSON. No prose, no markdown, no code fences.
- Top-level shape: { "items": [ {...}, {...}, {...} ] }
- Each items[i] MUST contain ALL field names listed above as keys.
- For type='currency' or 'number' fields, use a number (not a string).
- For type='toggle', use boolean true/false.
- For type='tags' or 'multi_select', use an array of short strings.
- For type='select', pick one short string.
- For 'currency' field specifically (the field NAMED "currency"), use exactly ${
    ctx.currency ? `"${ctx.currency}"` : '"USD"'
  }.
- For 'image_url' fields, use a placeholder like "https://placehold.co/600x400?text=..." with a relevant short caption.
- Names should sound like real items the business would offer — diverse and not generic ("Sample 1" is bad, "Premium Espresso Blend" is good).

Return only the JSON.`;
}

// Validate + coerce one AI item against the schema fields.
function coerceItem(
  raw: Record<string, unknown>,
  fields: SchemaField[],
  ctx: PartnerSeedContext,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = raw[f.name];
    if (v === undefined || v === null) continue;
    out[f.name] = v;
  }
  // Stamp currency if AI omitted or hallucinated something else.
  if (
    !out.currency &&
    fields.some((f) => f.name === 'currency') &&
    ctx.currency
  ) {
    out.currency = ctx.currency;
  }
  return out;
}

// Convert AI's per-field record into a ModuleItem-ish shape: top-level
// slots for canonical names, everything else into `fields`.
function toSampleItem(
  rec: Record<string, unknown>,
): Partial<ModuleItem> {
  const item: Record<string, any> = { isActive: true };
  const customFieldValues: Record<string, any> = {};
  for (const [k, v] of Object.entries(rec)) {
    switch (k) {
      case 'name':
      case 'description':
      case 'category':
      case 'price':
      case 'currency':
        item[k] = v;
        break;
      case 'image_url':
      case 'imageUrl':
      case 'thumbnail':
        item.images = Array.isArray(item.images)
          ? [...item.images, v]
          : [v];
        break;
      default:
        customFieldValues[k] = v;
    }
  }
  if (Object.keys(customFieldValues).length > 0) {
    item.fields = customFieldValues;
  }
  return item as Partial<ModuleItem>;
}

export interface AIGenerateResult {
  success: boolean;
  items?: Partial<ModuleItem>[];
  source?: 'ai';
  error?: string;
}

/**
 * Generate 3 schema-conformant sample items via Gemini. Caller is
 * responsible for the Firestore write — this action only assembles
 * the items array.
 */
export async function generateSampleItemsViaAIAction(
  slug: string,
  ctx: PartnerSeedContext = {},
): Promise<AIGenerateResult> {
  try {
    if (
      !process.env.GEMINI_API_KEY &&
      !process.env.GOOGLE_GENAI_API_KEY
    ) {
      return { success: false, error: 'Gemini API key not configured' };
    }

    const doc = await adminDb.collection('relaySchemas').doc(slug).get();
    if (!doc.exists) {
      return { success: false, error: `Schema "${slug}" not found in relaySchemas` };
    }
    const data = doc.data() as RawSchema;
    const rawFields = data?.schema?.fields ?? data?.fields ?? [];
    const fields: SchemaField[] = (Array.isArray(rawFields) ? rawFields : [])
      .map((f) => ({
        name: f.name,
        type: f.type,
        label: f.label,
        isRequired: f.isRequired,
      }))
      .filter((f) => typeof f.name === 'string' && f.name.length > 0);

    if (fields.length === 0) {
      return { success: false, error: 'Schema has zero fields' };
    }

    const prompt = buildPrompt({
      slug,
      schemaName: data?.name || slug,
      fields,
      ctx: {
        ...ctx,
        currency: ctx.currency || data?.defaultCurrency || undefined,
      },
    });

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const text = result.text || '';
    const parsed = cleanAndParseJSON(text) as { items?: unknown[] };
    if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return {
        success: false,
        error: 'AI response did not contain a non-empty `items` array',
      };
    }

    const items: Partial<ModuleItem>[] = [];
    for (const raw of parsed.items) {
      if (!raw || typeof raw !== 'object') continue;
      const coerced = coerceItem(
        raw as Record<string, unknown>,
        fields,
        ctx,
      );
      if (Object.keys(coerced).length === 0) continue;
      items.push(toSampleItem(coerced));
    }
    if (items.length === 0) {
      return { success: false, error: 'No items survived validation' };
    }

    return { success: true, items, source: 'ai' };
  } catch (err: any) {
    console.error('[relay-sample-data-ai] failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}
