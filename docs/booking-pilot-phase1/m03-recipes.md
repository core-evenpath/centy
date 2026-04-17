# M03 — `functionId → engines` recipe

**Files:** `lib/relay/engine-recipes.ts`, `__tests__/engine-recipes.test.ts`

**Goal:** Backward-compat shim — derive engines from `functionId` when `partner.engines` is unset.

## Implementation

```ts
export const FUNCTION_TO_ENGINES: Record<string, Engine[]> = {
  hotels_resorts: ['booking', 'service'],
  // ... full table from BUSINESS_FUNCTIONS — see appendices.md §C for booking starters
};

export function deriveEnginesFromFunctionId(functionId: string | null | undefined): Engine[] {
  if (!functionId) return [];
  return FUNCTION_TO_ENGINES[functionId] ?? [];
}

export function getPartnerEngines(partner: Partner): Engine[] {
  if (Array.isArray(partner.engines) && partner.engines.length > 0) return partner.engines;
  const fn = partner.businessPersona?.identity?.businessCategories?.[0]?.functionId;
  return deriveEnginesFromFunctionId(fn);
}
```

- Cover **every** `functionId` in `BUSINESS_FUNCTIONS`.
- Mark uncertain rows with `// REVIEW:` comments.
- Commit message lists total REVIEW count.
- **If REVIEW count > 20% of total, escalate** (rule #5).

## Acceptance

- [ ] One entry per `functionId` in `BUSINESS_FUNCTIONS`
- [ ] REVIEW-tagged rows ≤ 20% of total
- [ ] `getPartnerEngines` is pure
- [ ] Tests cover: explicit override, derivation, unknown function, missing functionId, empty array, null partner fields
- [ ] Stability: 1000 calls return identical results

## Escalation triggers

- `BUSINESS_FUNCTIONS` shape differs from expected
- > 20% uncertain mappings
- Partner persona path (`businessPersona.identity.businessCategories[0].functionId`) is wrong in this repo

## Commit

`[booking-pilot M03] engine recipes: functionId → engines table + getPartnerEngines`
