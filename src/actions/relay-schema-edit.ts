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

// Allowed field types — the union the rest of the system supports.
// Keeping this in sync with relay-schema-enrich's ALLOWED_TYPES so a
// hand-edit can never produce a type the AI generator wouldn't.
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

const FIELD_NAME_RE = /^[a-z][a-z0-9_]*$/;

export interface FieldDraft {
  name: string;
  type: ModuleFieldDefinition['type'];
  isRequired: boolean;
  isSearchable: boolean;
  showInList: boolean;
  showInCard: boolean;
  /** Comma-separated string from the editor; only used when type is select/multi_select. */
  options?: string[];
}

export interface UpdateFieldsResult {
  success: boolean;
  fieldCount?: number;
  error?: string;
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
