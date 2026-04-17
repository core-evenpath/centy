# M11 — Session: sticky `activeEngine` selection

## Files

- `lib/relay/session-store.ts`
- `lib/relay/session-types.ts` (schema extension already landed in M02; wire it here)
- `lib/relay/orchestrator/signals/session.ts`

## New function

```ts
function selectActiveEngine(params: {
  session: RelaySession;
  engineHint?: Engine;
  engineConfidence?: 'strong' | 'weak' | null;
  partnerEngines: Engine[];
}): Engine;
```

## Decision rules (in this order)

1. If `engineConfidence === 'strong'` **and** `engineHint ∈ partnerEngines` **and** `engineHint !== session.activeEngine`:
   → switch, write back.
2. Else if `session.activeEngine` is set **and** `session.activeEngine ∈ partnerEngines`:
   → stay.
3. Else:
   → `partnerEngines[0]` (sticky fallback; deterministic by `ENGINES` ordering).

Persist the resulting `activeEngine` to the session at the end of every turn (whether or not it changed).

## Do not

- Switch on a `weak` hint. Stickiness beats fuzzy signal.
- Switch to an engine the partner does not have enabled (even on `strong` hint).

## Acceptance

- Unit tests cover:
  - First turn, no active engine, partner has `[booking, service]` → `booking`.
  - Strong hint `service`, partner has `[booking, service]`, active was `booking` → `service`.
  - Weak hint `service`, partner has `[booking, service]`, active was `booking` → stays `booking`.
  - Partner engines change and previous `activeEngine` is removed → falls back to `partnerEngines[0]`.
  - Partner has `[]` → returns a safe default (document choice; likely throw or return `'info'` — decide in M03 planning and codify here).
- Integration test: multi-turn booking conversation stays `activeEngine === 'booking'` except on an explicit "cancel my reservation" turn.

## Commit

`[booking-pilot M11] session store: sticky activeEngine selection + persist`
