# M07 — Health storage + shadow writes

**Files:**
- `actions/relay-health-actions.ts`
- Hooks in `actions/admin-block-*.ts`, `actions/flow-engine-actions.ts`, `actions/modules-actions.ts`, `actions/partner-actions.ts`

**Goal:** Persist Health and write on every relevant admin save. **Shadow mode: never block a save or runtime response based on Health status.**

## Interface

```ts
const CACHE_TTL_MS = 30_000;

export async function recomputeEngineHealth(partnerId: string, engine: Engine): Promise<EngineHealthDoc> {
  // Load inputs → call computeEngineHealth → write to relayEngineHealth/{partnerId}_{engine}
  // → invalidate cache → log status → return doc
  // Shadow mode: never throw on red
}

export async function getEngineHealth(partnerId: string, engine: Engine): Promise<EngineHealthDoc | null>;
export async function getAllPartnerEngineHealth(partnerId: string): Promise<EngineHealthDoc[]>;
export function invalidateHealthCache(partnerId: string, engine?: Engine): void;
```

## Save-hook pattern

Apply at every existing admin save that can change block, flow, module, or partner engine state:

```ts
await saveBlockConfig(...);
try {
  for (const engine of getPartnerEngines(partner)) {
    await recomputeEngineHealth(partnerId, engine);
  }
} catch (err) {
  console.error('[health] shadow write failed', { partnerId, err });
  // never rethrow — shadow mode
}
```

## Acceptance

- [ ] Action module exists with all four functions
- [ ] Every save hook is in a try/catch that never rethrows
- [ ] Health docs appear in the Firestore emulator on test saves
- [ ] Red Health does **not** prevent save (emulator test asserts save succeeded despite red status)
- [ ] 30s cache verified (read within 30s = cache hit, asserted via spy)
- [ ] No live-Firestore calls in tests

## Escalation triggers

- Existing save action lacks a clean hookable boundary
- Firestore emulator is not configured for this repo

## Commit

`[booking-pilot M07] shadow-mode health writes on admin saves + cached read`
