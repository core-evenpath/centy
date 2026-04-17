# M15 — Drafting: seed templates + generic CSV import

**Files:**
- `lib/relay/seed-templates/booking/*.ts` + `index.ts` (new)
- `lib/import/module-csv-import.ts` (new)
- Refactor `lib/hotel-import-service.ts` into a thin wrapper
- `actions/relay-{seed,import}-actions.ts`
- UI hooks in `/admin/modules` and `/admin/relay/health`

**Goal:** Two paths to populate Booking modules without manual entry: seed templates and CSV import. **No AI generation.**

## Seed templates

- 3–5 plausible items per Booking module (rooms, amenities, house-rules, local-experiences, meal-plan minimum).
- Items must validate against the module's Zod schema.
- **No real names or addresses.** Empty image arrays. INR currency.

```ts
export async function applySeedTemplate(
  partnerId: string,
  moduleSlug: string,
): Promise<{ ok: boolean; itemsCreated: number }> {
  // Append (never overwrite). Trigger Health recompute.
}
```

## Generic CSV import

```ts
export async function importModuleItemsFromCSV(
  partnerId: string,
  moduleSlug: string,
  csvText: string,
): Promise<CsvImportResult> {
  // 1. Look up module schema
  // 2. Parse CSV (handle quoted fields, BOM, CRLF)
  // 3. Map header columns to schema fields (case-insensitive, trimmed)
  // 4. Per row: validate against schema; record errors, skip invalid
  // 5. Bulk write valid rows; trigger Health recompute
}
```

`hotel-import-service.ts` becomes a thin wrapper around the generic importer. **Keep the wrapper** — existing callers depend on it.

## UI

- "Use sample X" + "Import CSV" buttons in the `/admin/relay/health` empty-modules drill-down.
- Same buttons at the top of each module's `/admin/modules` view.
- CSV flow: file picker → preview first 5 rows mapped → confirm → result modal `{ rowsImported, rowsSkipped, errors }`.

## Acceptance

- [ ] Seed templates for ≥ 5 Booking modules
- [ ] Each seed item validates against its schema (test enforces)
- [ ] `applySeedTemplate` appends + recomputes Health
- [ ] CSV import works for `moduleRooms` + ≥ 1 other Booking module
- [ ] `hotel-import-service.ts` regression-free (existing import tests pass)
- [ ] CSV handles quoted / BOM / CRLF + row-level errors
- [ ] Hotel partner with seeds applied → Health green or amber-with-only-field-issues
- [ ] Existing import tests pass

## Escalation triggers

- Module schema rejects sensible seeds
- New dependency required (must justify per operating principle)

## Commit

`[booking-pilot M15] seed templates + generic module CSV import; deprecate hotel-only path`
