# M01 — Engine type system

## Files

- `lib/relay/types.ts` — or create `lib/relay/engine-types.ts` and re-export from `lib/relay/types.ts`.

## What to add

```ts
export const ENGINES = ['commerce', 'booking', 'lead', 'engagement', 'info', 'service'] as const;
export type Engine = typeof ENGINES[number];

export const BLOCK_TAGS = [...ENGINES, 'shared'] as const;
export type BlockTag = typeof BLOCK_TAGS[number];
```

Export type guards:

- `isEngine(x: unknown): x is Engine`
- `isBlockTag(x: unknown): x is BlockTag`

## Scope

- **Types only.** Do not wire any consumer yet.
- No runtime reads. No config changes.

## Acceptance

- `tsc --noEmit` passes.
- `Engine` and `BlockTag` are importable from `@/lib/relay/types`.
- Guards have unit coverage (smoke-level is fine — valid input, invalid input, nullish input).

## Commit

`[booking-pilot M01] engine type system`
