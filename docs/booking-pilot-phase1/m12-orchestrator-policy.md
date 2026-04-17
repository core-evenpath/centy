# M12 — Orchestrator: engine-scoped policy

**Files:**
- `lib/relay/orchestrator/{index,policy}.ts`
- `lib/relay/orchestrator/signals/{flow,blocks}.ts`
- `lib/relay/orchestrator/types.ts`
- `lib/relay/admin-block-registry.ts`

**Goal:** Wire `activeEngine` through the orchestrator. Existing intersection logic unchanged — just narrower inputs.

## Top-level wiring

```ts
const partnerEngines = getPartnerEngines(partner.partnerData ?? {});
const sel = selectActiveEngine({
  currentActive: session.session?.activeEngine ?? null,
  ...intentSignal,
  partnerEngines,
});
const activeEngine = sel.engine;
if (sel.engine !== session.session?.activeEngine) {
  await persistActiveEngine(conversationId, sel.engine);
}
```

## Signal changes

- **`loadFlowSignal`** — scope by `activeEngine` (filter to flows where `flow.engine === activeEngine`). Permissive when `null`.
- **`loadBlocksSignal`** — filter `visibleBlockIds` to blocks tagged with `activeEngine` or `'shared'`. Permissive when `null`.
- **`getAllowedBlocksForFunctionAndEngine`** — new helper used by the Gemini-prompt catalog builder.

Policy intersection is **unchanged**. Boost lists (`CART_BOOSTS`, `BOOKING_BOOSTS`, `ORDER_BOOSTS`) keep working — boosts not in the engine-scoped list get skipped naturally.

## Degraded mode

If `getEngineHealth(partnerId, activeEngine).status === 'red'`:

- Narrow catalog to shared blocks only
- Prefer plain-text response
- Never throw

## Telemetry (required, structured log per turn)

```
{
  partnerId,
  conversationId,
  activeEngine,
  switchedFrom,
  selectionReason,
  catalogSize,
  catalogSizeBeforeEngineFilter,
  healthStatus,
  geminiPromptTokens?,
}
```

## Acceptance

- [ ] `selectActiveEngine` called once per turn; persisted on change
- [ ] Flow + Blocks signals scoped when engine is set
- [ ] Catalog for a `hotels_resorts` partner ≤ 25 blocks
- [ ] Null `activeEngine` behavior matches pre-pilot
- [ ] Degraded mode produces plain text without crashing
- [ ] Telemetry log emitted per turn
- [ ] Existing orchestrator tests pass

## Escalation triggers

- Intent engine doesn't expose new fields at the call site
- Persisting `activeEngine` causes write contention
- Catalog size is unmeasurable

## Commit

`[booking-pilot M12] orchestrator: engine-scoped flow + block catalog + telemetry`
