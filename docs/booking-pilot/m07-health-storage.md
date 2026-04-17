# M07 — Health storage + write hooks

## Files

- `actions/relay-health-actions.ts` (new)
- Hooks added into existing `admin-block-*` save paths, `flow-engine-actions`, `modules-actions`.

## What to do

On any admin save that affects a partner's engine state, compose the inputs and call `computeEngineHealth` from M06; write the result to:

```
relayEngineHealth/{partnerId}_{engine}
```

Log the computed status. **Never block the save.** This is shadow mode — red Health is visible but not enforced.

Add a read action:

```ts
getEngineHealth(partnerId: string, engine: Engine): Promise<EngineHealthDoc | null>
```

With 30-second in-memory cache keyed by `${partnerId}:${engine}`.

## Integration points (trace from A3 + A4)

- Block save path → recompute + write for every engine the block belongs to (for this pilot: usually just `booking`).
- Flow save path → recompute + write for the flow's `engine`.
- Module save path → recompute + write for every engine whose blocks bind the module.

## Do not

- Change any existing save path's return value shape.
- Add error-surfacing UI based on Health. Only log and write.

## Acceptance

- Saving a block/flow/module change triggers a Health write visible in Firestore emulator tests.
- Shadow mode verified: red Health does not prevent save (emulator test asserts save succeeded despite red status).
- 30s cache verified: two consecutive `getEngineHealth` calls within 30s produce one read.

## Commit

`[booking-pilot M07] shadow-mode health writes on admin saves + cached read`
