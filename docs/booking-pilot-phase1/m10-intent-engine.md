# M10 — Intent engine: `engineHint` + keyword lexicon

**Files:**
- `lib/types-flow-engine.ts` — extend `IntentSignal`
- `lib/relay/intent-engine.ts` — add hint logic
- `lib/relay/engine-keywords.ts` (new) — keyword lexicon

**Goal:** Extend intent engine with `engineHint` + `engineConfidence`. Lexical phrase matching only — no AI.

## Schema extension

```ts
interface IntentSignal {
  // existing fields...
  engineHint?: Engine;
  engineConfidence?: 'strong' | 'weak' | null;
}
```

## Lexicon

```ts
export const ENGINE_KEYWORDS: Record<Engine, { strong: string[]; weak: string[] }> = {
  booking: {
    strong: ['book', 'reserve', 'reservation', 'appointment', 'slot', 'availability', 'check in', 'check out'],
    weak: ['schedule', 'when can i', 'free time', 'open'],
  },
  service: {
    strong: ['track', 'tracking', 'status', 'cancel', 'modify', 'where is', 'when will', 'reschedule'],
    weak: ['update my', 'change my', 'my order', 'my booking'],
  },
  // commerce, lead, engagement, info — ship lexicons but not consumed by M11 yet
};

export function classifyEngineHint(message: string): {
  engineHint?: Engine;
  engineConfidence: 'strong' | 'weak' | null;
};
```

## Matching rules

- **Word-boundary** regex (`\b`), not raw substring.
  - `"book"` matches "book a room"
  - `"book"` does **not** match "facebook" or "abooking"
- Strong matches win over weak.
- Multi-engine ties broken by lexical order in `ENGINES` (`commerce` < `booking` < `lead` < ...).

## Integration

- Wire into the intent engine where `IntentSignal` is built.
- Additive — no behavior change for messages without keywords.

## Acceptance

- [ ] All six engines have lexicons in `ENGINE_KEYWORDS`
- [ ] `classifyEngineHint` is pure and word-bounded
- [ ] Tests per engine: strong match, weak match, ambiguous, no-match, tie-breaking
- [ ] Word-boundary tests: `"facebook"` ≠ `book`; `"abooking"` ≠ `booking`
- [ ] No-keyword messages: existing intent output unchanged

## Escalation triggers

- `IntentSignal` codegen rejects the new fields
- > 10% of test corpus produces ambiguous matches

## Commit

`[booking-pilot M10] intent engine: engineHint + keyword lexicon (word-bounded)`
