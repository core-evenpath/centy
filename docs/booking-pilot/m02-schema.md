# M02 — Schema additions (additive only)

## Files

- `lib/relay/types.ts`
- `lib/relay/session-types.ts`
- Any partner type definitions (trace from A5)
- Firestore admin schema docs if present
- `firestore.rules`

## What to add

All fields **optional**. Old partners without them must continue working.

- `UnifiedBlockConfig.engines?: BlockTag[]`
- `FlowDefinition.engine?: Engine`
- `Partner.engines?: Engine[]`
- `Partner.engineRecipe?: 'auto' | 'custom'`
- `RelaySession.activeEngine?: Engine | null`

## New Firestore collection

- `relayEngineHealth/{partnerId}_{engine}` — shape fully defined in M06.
- Rules: admin SDK write only. No client reads/writes.

## Scope

- **Schema only.** No runtime reads yet. No UI yet.
- No existing field renamed or removed.

## Acceptance

- `tsc --noEmit` passes.
- Existing unit tests pass untouched.
- Firestore rules updated; emulator rules-test covers:
  - Admin SDK can write `relayEngineHealth/*`
  - Client cannot read or write `relayEngineHealth/*`

## Commit

`[booking-pilot M02] additive schema: engines, engineRecipe, activeEngine, health collection rules`
