# Cutover Progress

Append-only log. One block per milestone or investigation session.

Baseline: tsc = 330 on `main` at `0ee6897` (Phase 2 close merge PR #173),
post-fix, as of 2026-04-19. Supersedes the claimed-but-unverified 401
figure in Phase 2 close docs — see `docs/baseline-investigation/outcome.md`.
No production partners requiring migration.

---

## Baseline investigation — 2026-04-19

**Branch:** `claude/baseline-investigation`
**Scope:** narrow investigation session, not a Phase 3 milestone. Triggered
by Q_P3_01 (tsc baseline drift discovered in Phase 3 pre-flight).

**Commits:**

- `f640318` — [baseline-investigation] registry-data diagnosis
- `0b53a9f` — [baseline-investigation] fix generator path + widen ServerSubVerticalData
- `efd6891` — [baseline-investigation] regenerate _registry-data.ts
- `8b6a4e0` — [baseline-investigation] outcome and recommendation
- `563c02f` — [baseline-investigation] Q1 supersession note
- (this file) — [baseline-investigation] initialize CUTOVER_PROGRESS.md

**Measurement:** 455 → 330 (net –125). All 125 registry-data TS2353
errors resolved by widening the emitted `ServerSubVerticalData` type
in `scripts/extract-block-registry-data.js` and regenerating.

**Outcome:** `docs/baseline-investigation/outcome.md`. Recommendation:
clean resumption of Phase 3 pre-flight against the new baseline of
**330**. The remaining 330 errors are distributed cleanup concerns, out
of scope for this session.

**Flags for reviewer (not acted on):**

- Phase 2 close docs reference an inaccurate 401 baseline; erratum
  recommended (separate commit).
- `src/actions/relay-module-analytics/analytics.ts:164` and `lookups.ts:40`
  can drop `as unknown as SubVerticalWithIndustry[]` casts now that the
  emitted type aligns with the consumer shape.

---
