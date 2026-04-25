'use server';

// ── Relay schema AI enrichment (PR E9) ──────────────────────────────
//
// Two server actions:
//
//   1. enrichRelaySchemaAction(slug)
//      Takes the deterministic seed (PR E7/E8 union-of-reads) plus
//      consumer block descriptions and asks Gemini for additional
//      industry-standard fields. Returns a diff — does NOT persist.
//      Admin reviews field-by-field on the schema viewer.
//
//   2. appendFieldsToRelaySchemaAction(slug, fields)
//      Persists accepted fields to relaySchemas/{slug}.schema.fields.
//      Append-only — full edit-side UX lands in PR E10.
//
// Why two actions: the diff review step is the whole UX win — admin
// chooses what to keep instead of accepting a blackbox AI write.

import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import { cleanAndParseJSON } from '@/lib/modules/utils';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { getBlocksForModule } from '@/lib/relay/block-module-graph';
import type { ModuleFieldDefinition, SystemModule } from '@/lib/modules/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL = 'gemini-2.5-flash';

// Field types we accept from the LLM. Anything outside this set is
// dropped during validation — Gemini occasionally hallucinates types
// that aren't in our ModuleFieldDefinition union.
const ALLOWED_TYPES: ReadonlyArray<ModuleFieldDefinition['type']> = [
  'text',
  'textarea',
  'number',
  'currency',
  'duration',
  'url',
  'select',
  'multi_select',
  'tags',
  'toggle',
];

// ── Prompt ─────────────────────────────────────────────────────────

interface PromptContext {
  slug: string;
  vertical: string;
  family: string;
  existingFields: Array<{ name: string; type: string }>;
  consumerBlocks: Array<{ id: string; label: string; desc: string; reads?: string[] }>;
}

function buildPrompt(ctx: PromptContext): string {
  return `You are designing a production-grade data schema for a vertical SaaS product. The schema below feeds a family of UI blocks ("Relay blocks") that customers see in chat-driven commerce flows.

VERTICAL: ${ctx.vertical}
FAMILY: ${ctx.family}
SCHEMA SLUG: ${ctx.slug}

EXISTING FIELDS (do NOT propose duplicates of these):
${ctx.existingFields.map((f) => `- ${f.name} (${f.type})`).join('\n')}

CONSUMER BLOCKS (UI components this schema feeds):
${ctx.consumerBlocks
  .map(
    (b) =>
      `- ${b.label}: ${b.desc}${b.reads && b.reads.length > 0 ? ` [reads: ${b.reads.join(', ')}]` : ''}`,
  )
  .join('\n')}

Your task: propose 8-15 additional fields that an industry-standard ${ctx.family} schema for ${ctx.vertical} would include. Think like a domain expert — what fields does Shopify / Toast / Carvana / Mindbody actually have for this kind of catalog/service/profile?

For each proposed field, return:
- name: snake_case identifier (no spaces, no camelCase)
- type: ONE of [text, textarea, number, currency, duration, url, select, multi_select, tags, toggle]
- isRequired: boolean — true only when the field is essential for the block to render meaningfully
- isSearchable: boolean — true for prose fields used in search/RAG
- showInList: boolean — true when the field is useful in a list view
- showInCard: boolean — true when the field belongs on a card preview
- description: one short line explaining what this field captures

Return ONLY a JSON object: { "proposed": [ ...fields ] }. No prose, no markdown, no explanation outside the JSON.`;
}

// ── Validation ─────────────────────────────────────────────────────

function isValidProposed(raw: unknown): raw is {
  name: string;
  type: ModuleFieldDefinition['type'];
  isRequired?: boolean;
  isSearchable?: boolean;
  showInList?: boolean;
  showInCard?: boolean;
  description?: string;
} {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string' || !r.name.trim()) return false;
  if (typeof r.type !== 'string') return false;
  if (!ALLOWED_TYPES.includes(r.type as ModuleFieldDefinition['type'])) return false;
  return true;
}

// ── Public API ─────────────────────────────────────────────────────

export interface EnrichSuggestion {
  name: string;
  type: ModuleFieldDefinition['type'];
  isRequired: boolean;
  isSearchable: boolean;
  showInList: boolean;
  showInCard: boolean;
  description: string;
}

export interface EnrichResult {
  success: boolean;
  suggestions: EnrichSuggestion[];
  /** Names of suggestions deduped against the live schema. */
  duplicatesDropped: string[];
  error?: string;
}

export async function enrichRelaySchemaAction(slug: string): Promise<EnrichResult> {
  try {
    // Load the live schema. Slug is the doc id (set by the deterministic
    // generator in PR E7/E8).
    const doc = await adminDb.collection('relaySchemas').doc(slug).get();
    if (!doc.exists) {
      return {
        success: false,
        suggestions: [],
        duplicatesDropped: [],
        error: `relaySchemas/${slug} not found. Generate from block registry first.`,
      };
    }
    const schema = doc.data() as SystemModule;

    // Derive vertical + family from the slug ("ecommerce_catalog" →
    // vertical=ecommerce, family=catalog). The slug structure is
    // {vertical}_{family} where vertical can contain underscores
    // (e.g. "events_entertainment") — so split on the LAST underscore
    // to get family, the rest is vertical.
    const lastUnderscore = slug.lastIndexOf('_');
    const vertical = lastUnderscore > 0 ? slug.slice(0, lastUnderscore) : slug;
    const family = lastUnderscore > 0 ? slug.slice(lastUnderscore + 1) : '';

    // Consumer blocks for prompt context.
    const consumers = getBlocksForModule(slug, ALL_BLOCKS_DATA);

    const existingFields = (schema.schema?.fields ?? []).map((f) => ({
      name: f.name,
      type: f.type,
    }));

    const prompt = buildPrompt({
      slug,
      vertical,
      family,
      existingFields,
      consumerBlocks: consumers.map((b) => ({
        id: b.id,
        label: b.label,
        desc: b.desc,
        reads: b.reads,
      })),
    });

    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });

    const text = result.text || '';
    const parsed = cleanAndParseJSON(text) as { proposed?: unknown[] };
    if (!parsed.proposed || !Array.isArray(parsed.proposed)) {
      return {
        success: false,
        suggestions: [],
        duplicatesDropped: [],
        error: 'AI response did not contain a "proposed" array.',
      };
    }

    const existingNameSet = new Set(existingFields.map((f) => f.name));
    const suggestions: EnrichSuggestion[] = [];
    const duplicatesDropped: string[] = [];
    const seenInProposed = new Set<string>();

    for (const raw of parsed.proposed) {
      if (!isValidProposed(raw)) continue;
      // Dedupe against existing schema + within the AI's own list.
      if (existingNameSet.has(raw.name)) {
        duplicatesDropped.push(raw.name);
        continue;
      }
      if (seenInProposed.has(raw.name)) continue;
      seenInProposed.add(raw.name);

      suggestions.push({
        name: raw.name,
        type: raw.type,
        isRequired: !!raw.isRequired,
        isSearchable: raw.isSearchable !== false,
        showInList: raw.showInList !== false,
        showInCard: raw.showInCard !== false,
        description: typeof raw.description === 'string' ? raw.description : '',
      });
    }

    return { success: true, suggestions, duplicatesDropped };
  } catch (err: any) {
    console.error('[relay-schema-enrich] failed:', err);
    return {
      success: false,
      suggestions: [],
      duplicatesDropped: [],
      error: err?.message ?? 'unknown',
    };
  }
}

// ── Persist accepted suggestions ───────────────────────────────────

export interface AppendFieldsResult {
  success: boolean;
  appended: number;
  error?: string;
}

export async function appendFieldsToRelaySchemaAction(
  slug: string,
  fields: EnrichSuggestion[],
): Promise<AppendFieldsResult> {
  try {
    if (fields.length === 0) {
      return { success: true, appended: 0 };
    }
    const ref = adminDb.collection('relaySchemas').doc(slug);
    const doc = await ref.get();
    if (!doc.exists) {
      return {
        success: false,
        appended: 0,
        error: `relaySchemas/${slug} not found.`,
      };
    }
    const data = doc.data() as SystemModule;
    const existing = data.schema?.fields ?? [];
    const existingNameSet = new Set(existing.map((f) => f.name));

    const nextFields: ModuleFieldDefinition[] = existing.slice();
    let order = existing.length;
    let appended = 0;
    for (const s of fields) {
      // Re-check duplicates server-side: the diff UI may be stale.
      if (existingNameSet.has(s.name)) continue;
      nextFields.push({
        id: `fld_${s.name}`,
        name: s.name,
        type: s.type,
        isRequired: s.isRequired,
        isSearchable: s.isSearchable,
        showInList: s.showInList,
        showInCard: s.showInCard,
        order: order++,
      });
      existingNameSet.add(s.name);
      appended++;
    }

    await ref.update({
      'schema.fields': nextFields,
      lastEnrichedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, appended };
  } catch (err: any) {
    console.error('[relay-schema-enrich] append failed:', err);
    return {
      success: false,
      appended: 0,
      error: err?.message ?? 'unknown',
    };
  }
}
