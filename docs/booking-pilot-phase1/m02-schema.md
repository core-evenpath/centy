# M02 — Additive schema fields

**Files:** `lib/relay/types.ts`, `lib/types-flow-engine.ts`, `lib/types-platform.ts` (or wherever `Partner` lives), `lib/relay/session-types.ts`, Firestore rules if in repo.

**Goal:** Add optional fields needed for engine-scoping. No reads added in this milestone.

## Implementation

```ts
interface UnifiedBlockConfig { /* ... */ engines?: BlockTag[]; }
interface FlowDefinition { /* ... */ engine?: Engine; }
interface Partner { /* ... */ engines?: Engine[]; engineRecipe?: 'auto' | 'custom'; }
interface RelaySession { /* ... */ activeEngine?: Engine | null; }
```

New Firestore collection: `relayEngineHealth/{partnerId}_{engine}`. Document shape is defined in M06.

## Acceptance

- [ ] `tsc --noEmit` passes
- [ ] Every field optional; no required fields introduced
- [ ] No runtime reads added
- [ ] Round-trip test: instances constructible without the new fields
- [ ] Firestore rules updated (or a note logged in the progress doc if rules live elsewhere)

## Escalation triggers

- `Partner.engines` collides with an existing field of different shape
- `UnifiedBlockConfig` is generated from an out-of-repo source

## Commit

`[booking-pilot M02] additive schema: engines, engineRecipe, activeEngine, health collection rules`
