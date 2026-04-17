# M11 — Session: sticky `activeEngine` selection

**Files:**
- `lib/relay/session-store.ts`
- `lib/relay/session-cache.ts`
- `lib/relay/engine-selection.ts` (new)
- Tests

**Goal:** Sticky engine selection per session. Switch only on a **strong** hint to a different available engine.

## Interface

```ts
export function selectActiveEngine(input: {
  currentActive: Engine | null | undefined;
  engineHint?: Engine;
  engineConfidence: 'strong' | 'weak' | null;
  partnerEngines: Engine[];
}): {
  engine: Engine | null;
  reason: 'sticky' | 'switch-strong-hint' | 'fallback-first' | 'fallback-none';
} {
  // 1. Strong hint, available, differs from current → switch-strong-hint
  // 2. Current still in partnerEngines → sticky
  // 3. partnerEngines non-empty → fallback-first
  // 4. otherwise → fallback-none
}
```

## Rules

- Weak hints **never** switch.
- Strong hints only switch when the target is in `partnerEngines` (even service overlay).
- Persist `activeEngine` on session whenever it changes.
- Service overlay is a normal switch target (no special-case code path).

## Acceptance

- [ ] `selectActiveEngine` is pure
- [ ] All four `reason` outcomes tested
- [ ] Edge: strong hint not in `partnerEngines` → sticky
- [ ] Edge: current engine removed from partner → `fallback-first`
- [ ] Edge: empty `partnerEngines` → `fallback-none`
- [ ] Multi-turn integration test: 5 messages with mixed hints produces the expected engine sequence

## Escalation triggers

- Session write contention observed under test
- `session-store` lacks a single-field update path

## Commit

`[booking-pilot M11] session store: sticky activeEngine selection + persist`
