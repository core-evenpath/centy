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
