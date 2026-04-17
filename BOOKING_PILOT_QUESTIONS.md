# Booking Pilot — Open Questions

Questions, escalations, and ambiguities surfaced during Booking Pilot execution.
Format: one block per entry. Status transitions to `resolved` when closed.

---

## Q1 — No unit-test runner installed    (2026-04-17)

**Status:** noted; proceeding with type-level verification only

**Trigger:** M01 acceptance criteria say "Guards have unit coverage
(smoke-level is fine)". `package.json` has no `vitest` / `jest` / `node:test`
runner, and no `test` script. The operating principle "No dependency
additions without justification" applies.

**Disposition:** `isEngine` / `isBlockTag` are trivial guards whose
correctness is visible at the call site and enforced by the exhaustive
`ENGINES` / `BLOCK_TAGS` tuples. Verification is via `tsc --noEmit`.
If/when a runner is introduced in a later milestone (likely alongside
M06 health-checker tests), add a quick smoke spec for the guards.

Not blocking.

---

## Q2 — Shared-block id drift + analysis-doc drift    (resolved in M04)

**Status:** resolved

**Trigger (session resume, M04 start):** the session-resume prompt expected
continuity with `docs/booking-pilot-analysis.md`, but merging the foundation
PR fast-forwarded 28 previously-unseen commits onto main. This produced two
drifts:

1. **Shared-block id drift.** The registry generator
   `scripts/extract-block-registry-data.js` had hardcoded shared-block ids
   `ecom_greeting`, `shared_suggestions`, `shared_nudge`, `ecom_promo`,
   `ecom_cart`, `shared_contact`. But the committed
   `_registry-data.ts` used un-prefixed ids (`greeting`, `suggestions`,
   `nudge`, `promo`, `cart`, `contact`). Runtime consumers
   (`src/components/relay/blocks/BlockRenderer.tsx` switch cases) match
   the un-prefixed names, confirming those are authoritative. The
   generator had been modified without regenerating the output (or the
   output had been hand-edited). Regenerating verbatim would have
   broken the runtime switch.

2. **Analysis-doc drift (A1).** `docs/booking-pilot-analysis.md` A1 listed
   hospitality booking blocks with prefixed ids (`hosp_availability`,
   `hosp_check_in`). Actual repo ids are un-prefixed (`availability`,
   `check_in`). A1 also omitted two hospitality booking blocks that
   exist in the registry (`venue_space`, `camping_unit`). This was
   stale research from the prior session's snapshot.

**Resolution (M04 commit):**

- Reconciled the generator's hardcoded `SHARED_BLOCKS_DATA` to the
  un-prefixed, runtime-authoritative ids.
- Added `engines: ['shared']` to all six shared blocks in the generator.
- Added `engines?: BlockTag[]` to `ServerBlockData` (generator template)
  and `VerticalBlockDef` (`_types.ts`).
- Added `engines: ['booking']` to 31 booking blocks across 7 verticals,
  including the two A1 omissions (`venue_space`, `camping_unit`).
- Regenerated `_registry-data.ts`; tsc clean; acceptance probe passes
  (37 tagged blocks, 0 mistakes, `getAllowedBlocksForFunction('hotels_resorts')`
  returns 18 tagged blocks).

A1 in the analysis doc is now stale but not inaccurate at the level of
what's-a-booking-block (the 31-item list supersedes it). Not updating A1
retroactively — the analysis doc is a point-in-time artifact; M04's
actual tagging is the source of truth going forward.
