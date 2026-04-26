'use server';

// ── Relay schema field editor (PR E10) ──────────────────────────────
//
// Write-side counterpart to relay-schema-read + relay-schema-enrich.
// The viewer at /admin/relay/data/[slug] now has an editor mode; on
// "Save", the entire fields[] array is sent here and overwrites the
// stored schema. Wholesale replacement (not patches) keeps the
// editor's UX simple — one Save button at the end of the form.
//
// Categories editing is deferred — schema.categories can be added in
// a follow-up. This action only touches schema.fields.

import { db as adminDb } from '@/lib/firebase-admin';
import type { ModuleFieldDefinition, SystemModule } from '@/lib/modules/types';

// Allowed field types — the full ModuleFieldType union the rest of the
// system supports. Kept in sync with relay-schema-enrich's ALLOWED_TYPES
// and ItemEditor's render switch so a hand-edit can never produce a type
// the partner-side renderer can't display.
const ALLOWED_TYPES: ReadonlyArray<ModuleFieldDefinition['type']> = [
  'text',
  'textarea',
  'number',
  'currency',
  'duration',
  'url',
  'email',
  'phone',
  'date',
  'time',
  'image',
  'select',
  'multi_select',
  'tags',
  'toggle',
];

const FIELD_NAME_RE = /^[a-z][a-z0-9_]*$/;

export interface FieldDraftValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FieldDraftConditional {
  fieldId: string;
  value: any;
}

export interface FieldDraft {
  name: string;
  type: ModuleFieldDefinition['type'];
  isRequired: boolean;
  isSearchable: boolean;
  showInList: boolean;
  showInCard: boolean;
  /** Comma-separated string from the editor; only used when type is select/multi_select. */
  options?: string[];
  /** Optional human-readable description shown to admins + future tooltips. */
  description?: string;
  /** Optional placeholder shown in the partner-side ItemEditor input. */
  placeholder?: string;
  /** Optional default value applied when the partner creates a new item. */
  defaultValue?: any;
  /** Optional validation hints honoured by partner-side input renderers. */
  validation?: FieldDraftValidation;
  /** Optional conditional-visibility rule (depends on another field). */
  conditionalOn?: FieldDraftConditional;
}

export interface UpdateFieldsResult {
  success: boolean;
  fieldCount?: number;
  error?: string;
}

// Whitelisted validation keys to avoid persisting arbitrary admin input
// onto the schema doc. Only the keys ModuleFieldDefinition.validation
// declares survive the save; everything else is dropped silently.
function sanitizeValidation(
  raw: FieldDraftValidation | undefined,
): ModuleFieldDefinition['validation'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: NonNullable<ModuleFieldDefinition['validation']> = {};
  if (typeof raw.min === 'number' && Number.isFinite(raw.min)) out.min = raw.min;
  if (typeof raw.max === 'number' && Number.isFinite(raw.max)) out.max = raw.max;
  if (typeof raw.minLength === 'number' && Number.isFinite(raw.minLength)) {
    out.minLength = raw.minLength;
  }
  if (typeof raw.maxLength === 'number' && Number.isFinite(raw.maxLength)) {
    out.maxLength = raw.maxLength;
  }
  if (typeof raw.pattern === 'string' && raw.pattern.trim()) {
    out.pattern = raw.pattern.trim();
  }
  if (typeof raw.patternMessage === 'string' && raw.patternMessage.trim()) {
    out.patternMessage = raw.patternMessage.trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizeConditional(
  raw: FieldDraftConditional | undefined,
): ModuleFieldDefinition['conditionalOn'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  if (typeof raw.fieldId !== 'string' || !raw.fieldId.trim()) return undefined;
  return { fieldId: raw.fieldId.trim(), value: raw.value };
}

export async function updateRelaySchemaFieldsAction(
  slug: string,
  drafts: FieldDraft[],
): Promise<UpdateFieldsResult> {
  try {
    if (!Array.isArray(drafts)) {
      return { success: false, error: 'fields[] must be an array' };
    }

    // Validate each draft. Bad rows abort the whole save with an
    // explanation — no partial commits, since the editor sends the
    // full intended schema in one batch.
    const seenNames = new Set<string>();
    const validated: ModuleFieldDefinition[] = [];
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d || typeof d.name !== 'string') {
        return { success: false, error: `Row ${i + 1}: missing field name` };
      }
      const name = d.name.trim();
      if (!FIELD_NAME_RE.test(name)) {
        return {
          success: false,
          error: `Row ${i + 1}: "${name}" is not a valid field name (snake_case, lowercase, must start with a letter)`,
        };
      }
      if (seenNames.has(name)) {
        return { success: false, error: `Duplicate field name "${name}"` };
      }
      if (!ALLOWED_TYPES.includes(d.type)) {
        return {
          success: false,
          error: `Row ${i + 1}: "${d.type}" is not a supported field type`,
        };
      }
      seenNames.add(name);

      const field: ModuleFieldDefinition = {
        id: `fld_${name}`,
        name,
        type: d.type,
        isRequired: !!d.isRequired,
        isSearchable: !!d.isSearchable,
        showInList: !!d.showInList,
        showInCard: !!d.showInCard,
        order: i,
      };

      // Persist options only for the types that consume them. Editor
      // lets admin paste CSV; we trim + de-empty.
      if ((d.type === 'select' || d.type === 'multi_select') && d.options) {
        const cleaned = d.options
          .map((o) => o.trim())
          .filter(Boolean);
        if (cleaned.length > 0) {
          field.options = cleaned;
        }
      }

      // Optional metadata — round-trips through the editor so admins
      // can give partners proper descriptions, placeholders, defaults
      // and validation hints. Each is sanitized to its declared shape;
      // empty/whitespace strings are treated as "not set" and omitted
      // so the Firestore doc stays free of empty noise.
      if (typeof d.description === 'string' && d.description.trim()) {
        field.description = d.description.trim();
      }
      if (typeof d.placeholder === 'string' && d.placeholder.trim()) {
        field.placeholder = d.placeholder.trim();
      }
      if (d.defaultValue !== undefined && d.defaultValue !== '' && d.defaultValue !== null) {
        field.defaultValue = d.defaultValue;
      }
      const validation = sanitizeValidation(d.validation);
      if (validation) field.validation = validation;
      const conditionalOn = sanitizeConditional(d.conditionalOn);
      if (conditionalOn) field.conditionalOn = conditionalOn;

      validated.push(field);
    }

    const ref = adminDb.collection('relaySchemas').doc(slug);
    const doc = await ref.get();
    if (!doc.exists) {
      return { success: false, error: `relaySchemas/${slug} not found` };
    }
    // Touch updatedAt + lastEditedAt so the viewer's provenance line
    // can show "manually edited <relative>" later if we want it.
    const stamp = new Date().toISOString();
    await ref.update({
      'schema.fields': validated,
      lastEditedAt: stamp,
      updatedAt: stamp,
    });

    return { success: true, fieldCount: validated.length };
  } catch (err: any) {
    console.error('[relay-schema-edit] failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}

// Re-export the type so the client editor can import without
// pulling the action server bundle.
export type { ModuleFieldDefinition } from '@/lib/modules/types';
