'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { registerAllBlocks } from '@/lib/relay/blocks/index';
import { computeDataContract, listBlocks, getBlock } from '@/lib/relay/registry';
import type { FieldSpec, DataContract } from '@/lib/relay/types';

let registryReady = false;

function ensureRegistry(): void {
  if (!registryReady) {
    registerAllBlocks();
    registryReady = true;
  }
}

export interface DerivedField {
  id: string;
  name: string;
  type: string;
  description: string;
  isRequired: boolean;
  isSearchable: boolean;
  showInList: boolean;
  showInCard: boolean;
  order: number;
  options?: string[];
  sourceBlocks: string[];
}

export interface DerivedSchema {
  fields: DerivedField[];
  totalRequired: number;
  totalOptional: number;
  sourceBlockIds: string[];
  derivedAt: string;
}

export interface SchemaDiff {
  added: DerivedField[];
  removed: { id: string; name: string; type: string }[];
  unchanged: { id: string; name: string; type: string }[];
  modified: { id: string; field: string; oldType: string; newType: string }[];
}

export interface DerivationResult {
  success: boolean;
  schema?: DerivedSchema;
  error?: string;
}

export interface ComparisonResult {
  success: boolean;
  diff?: SchemaDiff;
  currentFieldCount: number;
  derivedFieldCount: number;
  error?: string;
}

const FIELD_TYPE_MAP: Record<string, string> = {
  text: 'text',
  number: 'number',
  currency: 'currency',
  select: 'select',
  tags: 'tags',
  toggle: 'toggle',
  date: 'date',
  url: 'url',
  email: 'email',
  phone: 'phone',
  textarea: 'textarea',
  image: 'image',
  images: 'tags',
  rating: 'number',
};

const SEARCHABLE_TYPES = new Set(['text', 'textarea', 'tags', 'select', 'email', 'phone']);
const LIST_TYPES = new Set(['text', 'currency', 'number', 'select', 'toggle', 'image']);
const CARD_TYPES = new Set(['text', 'textarea', 'currency', 'image', 'tags', 'rating']);

function fieldLabel(fieldId: string): string {
  return fieldId
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function fieldToModuleField(
  spec: FieldSpec,
  isRequired: boolean,
  order: number,
  sourceBlocks: string[]
): DerivedField {
  const moduleType = FIELD_TYPE_MAP[spec.type] || 'text';

  return {
    id: spec.field,
    name: spec.label || fieldLabel(spec.field),
    type: moduleType,
    description: `${isRequired ? 'Required' : 'Optional'} by: ${sourceBlocks.join(', ')}`,
    isRequired,
    isSearchable: SEARCHABLE_TYPES.has(spec.type),
    showInList: LIST_TYPES.has(spec.type) && order <= 8,
    showInCard: CARD_TYPES.has(spec.type) && order <= 5,
    order,
    options: spec.options,
    sourceBlocks,
  };
}

function trackFieldProvenance(
  blockIds: string[]
): Map<string, { spec: FieldSpec; isRequired: boolean; blocks: string[] }> {
  ensureRegistry();

  const fieldMap = new Map<string, { spec: FieldSpec; isRequired: boolean; blocks: string[] }>();

  for (const blockId of blockIds) {
    const entry = getBlock(blockId);
    if (!entry) continue;

    const contract = entry.definition.dataContract;

    for (const field of contract.required) {
      const existing = fieldMap.get(field.field);
      if (existing) {
        existing.blocks.push(blockId);
        existing.isRequired = true;
      } else {
        fieldMap.set(field.field, {
          spec: field,
          isRequired: true,
          blocks: [blockId],
        });
      }
    }

    for (const field of contract.optional) {
      const existing = fieldMap.get(field.field);
      if (existing) {
        existing.blocks.push(blockId);
      } else {
        fieldMap.set(field.field, {
          spec: field,
          isRequired: false,
          blocks: [blockId],
        });
      }
    }
  }

  return fieldMap;
}

export async function deriveModuleSchemaAction(
  blockIds: string[]
): Promise<DerivationResult> {
  try {
    if (!blockIds || blockIds.length === 0) {
      return { success: false, error: 'No block IDs provided' };
    }

    const fieldMap = trackFieldProvenance(blockIds);

    const requiredFields: DerivedField[] = [];
    const optionalFields: DerivedField[] = [];
    let order = 1;

    fieldMap.forEach((entry) => {
      const derived = fieldToModuleField(
        entry.spec,
        entry.isRequired,
        order,
        entry.blocks
      );
      if (entry.isRequired) {
        requiredFields.push(derived);
      } else {
        optionalFields.push(derived);
      }
      order++;
    });

    requiredFields.sort((a, b) => a.id.localeCompare(b.id));
    optionalFields.sort((a, b) => a.id.localeCompare(b.id));

    const fields: DerivedField[] = [];
    let finalOrder = 1;
    for (const f of requiredFields) {
      f.order = finalOrder++;
      fields.push(f);
    }
    for (const f of optionalFields) {
      f.order = finalOrder++;
      fields.push(f);
    }

    return {
      success: true,
      schema: {
        fields,
        totalRequired: requiredFields.length,
        totalOptional: optionalFields.length,
        sourceBlockIds: blockIds,
        derivedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('[ModuleDerivation] Schema derivation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function deriveSchemaForVerticalAction(
  verticalId: string
): Promise<DerivationResult> {
  try {
    ensureRegistry();

    const allBlocks = listBlocks();
    const verticalBlocks = allBlocks.filter(
      (b) =>
        b.applicableCategories.includes(verticalId) ||
        b.family === 'shared'
    );

    if (verticalBlocks.length === 0) {
      return { success: false, error: `No blocks found for vertical "${verticalId}"` };
    }

    const blockIds = verticalBlocks.map((b) => b.id);
    return deriveModuleSchemaAction(blockIds);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function compareWithExistingModuleAction(
  moduleId: string,
  blockIds: string[]
): Promise<ComparisonResult> {
  try {
    if (!adminDb) {
      return { success: false, diff: undefined, currentFieldCount: 0, derivedFieldCount: 0, error: 'Database not available' };
    }

    const moduleDoc = await adminDb.collection('systemModules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      return { success: false, diff: undefined, currentFieldCount: 0, derivedFieldCount: 0, error: 'Module not found' };
    }

    const moduleData = moduleDoc.data();
    const currentSchema = moduleData?.schema;
    const currentFields: Array<{ id: string; name: string; type: string }> = (currentSchema?.fields || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
    }));

    const derivedResult = await deriveModuleSchemaAction(blockIds);
    if (!derivedResult.success || !derivedResult.schema) {
      return { success: false, diff: undefined, currentFieldCount: currentFields.length, derivedFieldCount: 0, error: derivedResult.error };
    }

    const derivedFields = derivedResult.schema.fields;
    const currentFieldIds = new Set(currentFields.map((f) => f.id));
    const derivedFieldIds = new Set(derivedFields.map((f) => f.id));

    const added: DerivedField[] = [];
    const removed: { id: string; name: string; type: string }[] = [];
    const unchanged: { id: string; name: string; type: string }[] = [];
    const modified: { id: string; field: string; oldType: string; newType: string }[] = [];

    for (const field of derivedFields) {
      if (!currentFieldIds.has(field.id)) {
        added.push(field);
      } else {
        const current = currentFields.find((f) => f.id === field.id);
        if (current && current.type !== field.type) {
          modified.push({
            id: field.id,
            field: field.name,
            oldType: current.type,
            newType: field.type,
          });
        } else {
          unchanged.push({ id: field.id, name: field.name, type: field.type });
        }
      }
    }

    for (const field of currentFields) {
      if (!derivedFieldIds.has(field.id)) {
        removed.push(field);
      }
    }

    return {
      success: true,
      diff: { added, removed, unchanged, modified },
      currentFieldCount: currentFields.length,
      derivedFieldCount: derivedFields.length,
    };
  } catch (error: any) {
    console.error('[ModuleDerivation] Comparison failed:', error);
    return { success: false, diff: undefined, currentFieldCount: 0, derivedFieldCount: 0, error: error.message };
  }
}

export async function applyDerivedSchemaAction(
  moduleId: string,
  derivedFields: DerivedField[],
  options?: {
    keepOrphanedFields?: boolean;
    mergeMode?: 'add_only' | 'full_replace';
  }
): Promise<{
  success: boolean;
  fieldsAdded: number;
  fieldsRemoved: number;
  error?: string;
}> {
  try {
    if (!adminDb) {
      return { success: false, fieldsAdded: 0, fieldsRemoved: 0, error: 'Database not available' };
    }

    const moduleRef = adminDb.collection('systemModules').doc(moduleId);
    const moduleDoc = await moduleRef.get();

    if (!moduleDoc.exists) {
      return { success: false, fieldsAdded: 0, fieldsRemoved: 0, error: 'Module not found' };
    }

    const moduleData = moduleDoc.data()!;
    const currentFields: any[] = moduleData.schema?.fields || [];
    const currentFieldIds = new Set(currentFields.map((f: any) => f.id));
    const mergeMode = options?.mergeMode || 'add_only';
    const keepOrphaned = options?.keepOrphanedFields !== false;

    const moduleFields: any[] = [];
    let fieldsAdded = 0;
    let fieldsRemoved = 0;

    if (mergeMode === 'full_replace') {
      for (const df of derivedFields) {
        moduleFields.push({
          id: df.id,
          name: df.name,
          type: df.type,
          description: df.description,
          isRequired: df.isRequired,
          isSearchable: df.isSearchable,
          showInList: df.showInList,
          showInCard: df.showInCard,
          order: df.order,
          options: df.options,
        });
        if (!currentFieldIds.has(df.id)) {
          fieldsAdded++;
        }
      }

      if (keepOrphaned) {
        const derivedIds = new Set(derivedFields.map((f) => f.id));
        for (const f of currentFields) {
          if (!derivedIds.has(f.id)) {
            moduleFields.push(f);
          }
        }
      } else {
        fieldsRemoved = currentFields.filter(
          (f: any) => !new Set(derivedFields.map((d) => d.id)).has(f.id)
        ).length;
      }
    } else {
      for (const f of currentFields) {
        moduleFields.push(f);
      }

      for (const df of derivedFields) {
        if (!currentFieldIds.has(df.id)) {
          moduleFields.push({
            id: df.id,
            name: df.name,
            type: df.type,
            description: df.description,
            isRequired: df.isRequired,
            isSearchable: df.isSearchable,
            showInList: df.showInList,
            showInCard: df.showInCard,
            order: moduleFields.length + 1,
            options: df.options,
          });
          fieldsAdded++;
        }
      }
    }

    moduleFields.forEach((f: any, i: number) => {
      f.order = i + 1;
    });

    const now = new Date().toISOString();

    await moduleRef.update({
      'schema.fields': moduleFields,
      updatedAt: now,
    });

    revalidatePath('/admin/modules');
    revalidatePath(`/admin/modules/${moduleId}`);

    return { success: true, fieldsAdded, fieldsRemoved };
  } catch (error: any) {
    console.error('[ModuleDerivation] Apply failed:', error);
    return { success: false, fieldsAdded: 0, fieldsRemoved: 0, error: error.message };
  }
}

export async function getFieldProvenanceAction(
  blockIds: string[]
): Promise<{
  success: boolean;
  provenance: Record<string, { type: string; isRequired: boolean; blocks: string[] }>;
  error?: string;
}> {
  try {
    const fieldMap = trackFieldProvenance(blockIds);

    const provenance: Record<string, { type: string; isRequired: boolean; blocks: string[] }> = {};
    fieldMap.forEach((entry, fieldId) => {
      provenance[fieldId] = {
        type: entry.spec.type,
        isRequired: entry.isRequired,
        blocks: entry.blocks,
      };
    });

    return { success: true, provenance };
  } catch (error: any) {
    return { success: false, provenance: {}, error: error.message };
  }
}
