// ── Client-side import validator (PR E5) ────────────────────────────
//
// The ImportDialog coerces CSV/XLSX rows into `Partial<ModuleItem>`
// before sending to `bulkCreateModuleItemsAction`. That action doesn't
// schema-validate; historically any malformed row would get stored as
// 'Untitled' with silent data loss.
//
// This helper runs the same rules as the server-side `validateRow`
// helper in `lib/import/module-csv-import.ts`, but operates on the
// already-coerced item shape. Pure functions + no server imports, so
// safe to call from the Dialog and surface errors inline before the
// network call.
//
// Responsibilities:
//   - required-field presence (core + schema.fields)
//   - number/currency/duration range + shape
//   - select / multi_select option enforcement
//
// Returns an error list per row. Empty list = valid row.

import type { ModuleFieldDefinition, ModuleItem } from '@/lib/modules/types';

export interface ImportRowError {
  rowIndex: number;
  errors: string[];
}

export interface ImportValidationResult<T> {
  valid: T[];
  invalid: Array<{ row: T; rowIndex: number; errors: string[] }>;
}

function validateCoreFields(item: Partial<ModuleItem>): string[] {
  const errors: string[] = [];
  if (!item.name || (typeof item.name === 'string' && item.name.trim() === '')) {
    errors.push('Missing required field: name');
  }
  return errors;
}

function validateSchemaField(
  value: unknown,
  field: ModuleFieldDefinition,
): string[] {
  const errors: string[] = [];

  const isEmpty =
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);

  if (field.isRequired && isEmpty) {
    errors.push(`Missing required field: ${field.name}`);
    return errors;
  }
  if (isEmpty) return errors;

  if (field.type === 'number' || field.type === 'currency' || field.type === 'duration') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`Invalid number for ${field.name}`);
      return errors;
    }
    if (field.validation?.min !== undefined && value < field.validation.min) {
      errors.push(`${field.name} below minimum ${field.validation.min}`);
    }
    if (field.validation?.max !== undefined && value > field.validation.max) {
      errors.push(`${field.name} above maximum ${field.validation.max}`);
    }
  }

  if (field.type === 'select' && field.options && typeof value === 'string') {
    if (!field.options.some((opt) => opt.toLowerCase() === value.toLowerCase())) {
      errors.push(
        `Invalid option for ${field.name}: "${value}" (allowed: ${field.options.join(', ')})`,
      );
    }
  }

  if (field.type === 'multi_select' && field.options && Array.isArray(value)) {
    for (const v of value) {
      if (typeof v !== 'string') continue;
      if (!field.options.some((opt) => opt.toLowerCase() === v.toLowerCase())) {
        errors.push(
          `Invalid option for ${field.name}: "${v}" (allowed: ${field.options.join(', ')})`,
        );
      }
    }
  }

  return errors;
}

/**
 * Validate every coerced row against the module schema. Returns
 * {valid, invalid} so the caller can partial-import + surface errors.
 */
export function validateImportRows(
  items: Array<Partial<ModuleItem>>,
  schemaFields: ModuleFieldDefinition[],
): ImportValidationResult<Partial<ModuleItem>> {
  const valid: Array<Partial<ModuleItem>> = [];
  const invalid: Array<{ row: Partial<ModuleItem>; rowIndex: number; errors: string[] }> = [];

  items.forEach((item, rowIndex) => {
    const errors: string[] = [];
    errors.push(...validateCoreFields(item));

    for (const field of schemaFields) {
      const raw = item.fields?.[field.name] ?? item.fields?.[field.id];
      errors.push(...validateSchemaField(raw, field));
    }

    if (errors.length > 0) {
      invalid.push({ row: item, rowIndex, errors });
    } else {
      valid.push(item);
    }
  });

  return { valid, invalid };
}

// ── Error report CSV ────────────────────────────────────────────────
//
// For large imports the dialog caps the inline error list; partners
// download this CSV to debug the full failure set in a spreadsheet.
// Columns: row (1-based, matches the source file), name, errors
// (pipe-joined).

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function buildImportErrorCSV(
  invalid: ImportValidationResult<Partial<ModuleItem>>['invalid'],
): string {
  const headers = ['row', 'name', 'errors'];
  const lines = [headers.join(',')];
  for (const { rowIndex, row, errors } of invalid) {
    lines.push(
      [
        escapeCSV(String(rowIndex + 1)),
        escapeCSV(typeof row.name === 'string' ? row.name : ''),
        escapeCSV(errors.join(' | ')),
      ].join(','),
    );
  }
  return lines.join('\n');
}
