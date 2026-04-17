# M03 — functionId → engines recipe

## Files

- `lib/relay/engine-recipes.ts` (new)
- `__tests__/engine-recipes.test.ts` (new)

## What to build

A deterministic recipe table: `FUNCTION_TO_ENGINES: Record<string, Engine[]>` keyed by every `functionId` in `lib/business-taxonomy/industries.ts`.

For booking-native functions (`hotels_resorts`, `boutique_bnb`, `vacation_rentals`, `corporate_housing`, `event_venues`, `ticketing_booking`, `airport_transfer`, `cinemas_theaters`, etc.), include at minimum `booking` + `service`.

For other functions, do a best-effort mapping and **flag uncertain mappings in the commit message** and in `BOOKING_PILOT_QUESTIONS.md` if >20% uncertain (this is an escalation trigger).

## Exports

```ts
export function deriveEnginesFromFunctionId(functionId: string): Engine[];
export function getPartnerEngines(partner: Partner): Engine[]; // explicit override else derived
```

## Rules

- No AI. No string similarity. Just a hard-coded table + lookup.
- Unknown function → `[]` (not an error; caller decides fallback).
- Return order is stable and deterministic (lock ordering by `ENGINES` array).

## Acceptance

- Unit tests cover:
  - Explicit `partner.engines` override wins
  - Function-based derivation when no override
  - Unknown function → `[]`
  - Stability: same input → identical output array (reference stability optional, value stability required)
- Test coverage ≥ 70% for the module (escalation trigger if not).

## Commit

`[booking-pilot M03] engine recipes: functionId → engines table + getPartnerEngines`
