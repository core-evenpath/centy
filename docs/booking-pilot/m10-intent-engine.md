# M10 — Intent engine: engineHint + keyword lexicon

## Files

- `lib/types-flow-engine.ts` — extend `IntentSignal`
- `lib/relay/intent-engine.ts` — add hint logic
- `lib/relay/engine-keywords.ts` (new) — keyword lexicon

## Schema change (additive)

```ts
interface IntentSignal {
  // existing fields...
  engineHint?: Engine;
  engineConfidence?: 'strong' | 'weak' | null;
}
```

## Keyword lexicon

```ts
booking:    ['book', 'reserve', 'reservation', 'appointment', 'slot',
             'availability', 'schedule', 'check in', 'check out']
service:    ['track', 'status', 'cancel', 'modify', 'where is',
             'when will', 'update my']
// commerce / lead / engagement / info included but not wired in this task.
```

Only `booking` and `service` are wired to behaviour in this pilot. Other lexicons exist in the file but produce no downstream effect yet.

## Confidence rules

- **strong:** any keyword matches exactly (whole-word, case-insensitive).
- **weak:** fuzzy match (Levenshtein ≤ 1 on a single token).
- **null:** no match.

## Constraints

- Purely lexical. No AI. No context window.
- Deterministic — same input, same output.
- Do not touch existing intent-engine outputs beyond adding the two new fields.

## Acceptance

- Unit tests for every keyword set (valid exact match, valid fuzzy match, no match).
- Unit tests verify `commerce/lead/engagement/info` lexicons compile and export but produce no downstream effect (by inspection of call sites).
- Intent-engine output visible in orchestrator logs for a booking conversation.

## Commit

`[booking-pilot M10] intent engine: engineHint + keyword lexicon (booking/service wired)`
