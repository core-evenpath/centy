// Generic module CSV import (M15).
//
// Validates rows against a module's field schema (ModuleFieldDefinition[]).
// Handles BOM, CRLF, quoted fields via papaparse (already in deps).
//
// Pure parser + validator — no Firestore writes. The caller (a server
// action) takes `importModuleItemsFromCSV`'s output and appends valid
// rows via `createModuleItemAction`.

import Papa from 'papaparse';
import type { ModuleFieldDefinition, ModuleFieldType } from '@/lib/modules/types';

export interface CsvImportRow {
  rowIndex: number;
  raw: Record<string, string>;
  fields: Record<string, unknown>;
  name?: string;
  description?: string;
  price?: number;
  errors: string[];
}

export interface CsvImportResult {
  /** Rows that passed validation. */
  valid: CsvImportRow[];
  /** Rows that failed schema validation. */
  invalid: CsvImportRow[];
  /** Total row count (including invalid). */
  total: number;
  /** Header columns detected in the CSV. */
  headers: string[];
  /** Mapping from CSV header → module field id (or the reserved
   *  name/description/price/category columns). */
  headerMap: Record<string, string>;
}

const RESERVED_COLUMNS = new Set(['name', 'description', 'category', 'price', 'currency']);

function normalizeHeader(h: string): string {
  return h.replace(/^\ufeff/, '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function coerceValue(raw: string, type: ModuleFieldType): unknown {
  const s = raw.trim();
  if (s === '') return undefined;

  switch (type) {
    case 'number':
    case 'currency':
    case 'duration': {
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    }
    case 'toggle':
      return /^(true|yes|1|y)$/i.test(s)
        ? true
        : /^(false|no|0|n)$/i.test(s)
          ? false
          : undefined;
    case 'multi_select':
    case 'tags':
      return s.split(/[,|;]/).map((x) => x.trim()).filter(Boolean);
    default:
      return s;
  }
}

function buildHeaderMap(
  headers: string[],
  fields: ModuleFieldDefinition[],
): Record<string, string> {
  const map: Record<string, string> = {};
  const fieldByNormalizedId = new Map<string, string>();
  const fieldByNormalizedName = new Map<string, string>();
  for (const f of fields) {
    fieldByNormalizedId.set(normalizeHeader(f.id), f.id);
    fieldByNormalizedName.set(normalizeHeader(f.name), f.id);
  }
  for (const h of headers) {
    const norm = normalizeHeader(h);
    if (RESERVED_COLUMNS.has(norm)) {
      map[h] = norm;
    } else if (fieldByNormalizedId.has(norm)) {
      map[h] = fieldByNormalizedId.get(norm)!;
    } else if (fieldByNormalizedName.has(norm)) {
      map[h] = fieldByNormalizedName.get(norm)!;
    }
    // Unmapped headers are dropped (logged via headers vs headerMap diff).
  }
  return map;
}

function validateRow(
  row: Record<string, unknown>,
  fields: ModuleFieldDefinition[],
): string[] {
  const errors: string[] = [];
  for (const f of fields) {
    const v = row[f.id];
    if (f.isRequired && (v === undefined || v === null || v === '')) {
      errors.push(`Missing required field: ${f.name}`);
      continue;
    }
    if (v === undefined || v === null || v === '') continue;
    if (f.type === 'number' || f.type === 'currency' || f.type === 'duration') {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        errors.push(`Invalid number for ${f.name}`);
      } else if (f.validation?.min !== undefined && v < f.validation.min) {
        errors.push(`${f.name} below minimum ${f.validation.min}`);
      } else if (f.validation?.max !== undefined && v > f.validation.max) {
        errors.push(`${f.name} above maximum ${f.validation.max}`);
      }
    }
    if (f.type === 'select' && f.options && typeof v === 'string') {
      if (!f.options.some((opt) => opt.toLowerCase() === v.toLowerCase())) {
        errors.push(
          `Invalid option for ${f.name}: "${v}" (allowed: ${f.options.join(', ')})`,
        );
      }
    }
  }
  return errors;
}

export function importModuleItemsFromCSV(
  csvText: string,
  schema: { fields: ModuleFieldDefinition[] },
): CsvImportResult {
  // papaparse handles BOM + quoted fields + CRLF natively.
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h: string) => h.replace(/^\ufeff/, '').trim(),
  });

  const headers = (parsed.meta?.fields ?? []).filter(Boolean);
  const headerMap = buildHeaderMap(headers, schema.fields);

  const valid: CsvImportRow[] = [];
  const invalid: CsvImportRow[] = [];

  const rows = (parsed.data ?? []) as Array<Record<string, string>>;
  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const fields: Record<string, unknown> = {};
    let name: string | undefined;
    let description: string | undefined;
    let category: string | undefined;
    let price: number | undefined;
    let currency: string | undefined;
    const errors: string[] = [];

    for (const header of headers) {
      const mappedTo = headerMap[header];
      const rawValue = raw[header] ?? '';
      if (!mappedTo) continue;

      if (mappedTo === 'name') {
        name = rawValue.trim() || undefined;
      } else if (mappedTo === 'description') {
        description = rawValue.trim() || undefined;
      } else if (mappedTo === 'category') {
        category = rawValue.trim() || undefined;
      } else if (mappedTo === 'price') {
        const n = Number(rawValue);
        if (rawValue.trim() !== '' && !Number.isFinite(n)) {
          errors.push(`Invalid number for price: "${rawValue}"`);
        } else if (rawValue.trim() !== '') {
          price = n;
        }
      } else if (mappedTo === 'currency') {
        currency = rawValue.trim().toUpperCase() || undefined;
      } else {
        const field = schema.fields.find((f) => f.id === mappedTo);
        if (!field) continue;
        const coerced = coerceValue(rawValue, field.type);
        if (coerced !== undefined) fields[mappedTo] = coerced;
      }
    }

    if (!name) errors.push('Missing required: name');
    errors.push(...validateRow(fields, schema.fields));

    const row: CsvImportRow = {
      rowIndex: i,
      raw,
      fields,
      name,
      description,
      price,
      errors,
    };
    if (category) (row as CsvImportRow & { category?: string }).category = category;
    if (currency) (row as CsvImportRow & { currency?: string }).currency = currency;
    if (errors.length > 0) invalid.push(row);
    else valid.push(row);
  }

  return {
    valid,
    invalid,
    total: rows.length,
    headers,
    headerMap,
  };
}
