# M15 — Drafting: seed templates + generic CSV import

## Files

- `lib/relay/seed-templates/booking/` (new directory), one file per Booking module:
  - `module-rooms.ts`
  - `module-amenities.ts`
  - `module-house-rules.ts`
  - `module-services.ts` (if present for wellness/clinic)
  - `module-routes.ts` (for airport_transfer/ticketing)
  - … (complete the set from A4)
- `lib/module-import-service.ts` (new — replaces `lib/hotel-import-service.ts` as the generic path)

## Seed templates

- 3–5 realistic sample items per module.
- Plain data arrays — no AI generation, no placeholder fillers.
- Each item conforms to the module's schema documented in A4.
- Admin surface: a "Use sample data" button clones the seed into the partner's collection.

## Generic CSV import

Extract the CSV parsing pattern from `lib/hotel-import-service.ts` into:

```ts
importModuleItemsFromCSV(
  partnerId: string,
  moduleSlug: string,
  csv: string
): Promise<ImportResult>
```

- Looks up the module's schema by slug.
- Validates each row against the schema.
- Returns a structured `ImportResult` (`inserted`, `skipped`, `errors`).
- Keep the existing hotel-specific code path alive behind a thin adapter so existing callers still work. Do **not** delete `lib/hotel-import-service.ts` in this milestone — mark it deprecated and route its implementation through the generic function.

## Acceptance

- From an empty partner, clicking "Use sample rooms" populates `moduleRooms` with the template items.
- Health for that partner improves from red/amber to green (assert in an integration test).
- CSV import works for at least `moduleRooms` + one other Booking module (pick from A4 coverage).
- Existing hotel CSV import callers continue working unchanged.

## Commit

`[booking-pilot M15] seed templates + generic module CSV import; deprecate hotel-only path`
