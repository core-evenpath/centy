# M01 — Engine type system

**Files:** `lib/relay/types.ts` (or new `lib/relay/engine-types.ts`)

**Goal:** Land the Engine + BlockTag vocabulary with type guards. No consumers yet.

## Implementation

```ts
export const ENGINES = ['commerce', 'booking', 'lead', 'engagement', 'info', 'service'] as const;
export type Engine = typeof ENGINES[number];

export const BLOCK_TAGS = [...ENGINES, 'shared'] as const;
export type BlockTag = typeof BLOCK_TAGS[number];

export function isEngine(x: unknown): x is Engine {
  return typeof x === 'string' && (ENGINES as readonly string[]).includes(x);
}
export function isBlockTag(x: unknown): x is BlockTag {
  return typeof x === 'string' && (BLOCK_TAGS as readonly string[]).includes(x);
}
```

- `shared` is a `BlockTag`, never an `Engine`. Do not let it leak into engine-only positions.
- Types must be importable from anywhere (no server-only barrel).

## Acceptance

- [ ] `tsc --noEmit` passes
- [ ] Symbols exportable; no consumers yet
- [ ] Unit tests on guards: valid, invalid, non-string, nullish

## Escalation triggers

- Existing `Engine` / `BlockTag` symbols collide
- Type guards need server-only imports

## Commit

`[booking-pilot M01] engine type system`
