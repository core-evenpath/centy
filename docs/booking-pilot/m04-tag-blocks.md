# M04 — Tag Booking blocks (and shared blocks only)

## Files

- `src/app/admin/relay/blocks/previews/*` for each block identified in A1 (booking + shared).
- The registry generator if present (re-run it; do not hand-edit `_registry-data.ts`).

## What to do

For each block identified in A1 as **Booking-native**, add:

```ts
engines: ['booking']
```

For each block identified in A1 as **shared / cross-cutting** (greeting, contact, suggestions, nudge, promo, testimonials, location, info, quick_actions), add:

```ts
engines: ['shared']
```

Regenerate `src/app/admin/relay/blocks/previews/_registry-data.ts` (or the equivalent build step documented in A2).

## Do not

- Tag any block that is not Booking-native or not clearly shared.
- Touch the other five engines' candidate blocks. Their tagging comes in a later phase.
- Edit `_registry-data.ts` by hand.

## Acceptance

- Booking tag present on every block from A1's booking list.
- Shared tag present on every block from A1's shared list.
- No other engine tag appears anywhere.
- `getAllowedBlocksForFunction('hotels_resorts')` returns a superset including all tagged booking + shared blocks.
- Existing tests pass.
- Snapshot/golden tests (if any) updated.

## Commit

`[booking-pilot M04] tag booking + shared blocks with engines[]`
