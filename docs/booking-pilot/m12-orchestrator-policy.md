# M12 — Orchestrator: engine-scoped policy

## Files

- `lib/relay/orchestrator/policy.ts`
- `lib/relay/orchestrator/signals/flow.ts`
- `lib/relay/orchestrator/signals/blocks.ts`
- `lib/relay/orchestrator/index.ts`

## Changes

### `loadFlowSignal`
- Accept `activeEngine: Engine`.
- Return only flow suggestions whose `engine === activeEngine`.

### `loadBlocksSignal`
- Accept `activeEngine: Engine`.
- Filter `visibleBlockIds` to blocks whose `engines[]` includes `activeEngine` **or** `'shared'`.

### Policy intersection logic
- **Unchanged.** Just intersects over a tighter input set.

## Performance expectation

For a booking partner, Gemini's block-catalog prompt input should drop from ~100+ entries to ~15–25. Log catalog size per turn (new metric).

## Acceptance

- Catalog-size metric logged per turn (visible in orchestrator debug logs).
- Smoke test against a hotel partner with the 8 representative queries from the Preview Copilot scripts (M13) — zero orchestrator errors, zero missing-block fallbacks.
- Regression check: a partner without `engines` configured (backward compat path) still resolves blocks — `activeEngine` falls back via M11 rules and the catalog is unchanged in behaviour from pre-pilot.
- Measured token drop ≥ 40% (performance budget C5). If not, escalate before marking done.

## Commit

`[booking-pilot M12] orchestrator: engine-scoped flow + block catalog`
