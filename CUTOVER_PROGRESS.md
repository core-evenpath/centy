# Cutover — Phase 3 Progress Log

One block per session/task. Format matches the Phase 1 pattern in
`BOOKING_PILOT_PROGRESS.md` and the Phase 2 pattern in
`ENGINE_ROLLOUT_PROGRESS.md`.

Phase 2 closed 2026-04-19 via PR #173. Phase 3 pre-flight attempted twice
and escalated both times (Q_P3_01, Q_P3_02 in `CUTOVER_QUESTIONS.md`).
This log starts with the baseline-investigation session that those
escalations required.

---

## Baseline Investigation
- Status: done
- Branch: `claude/baseline-investigation` (stacked on `main` at `244261a`)
- Commits:
  - `de7b8330` — diagnosis of top error cluster
  - `a2dfb85f` — widen ServerSubVerticalData in generator template
  - `026af78e` — regenerate _registry-data.ts
  - `6b69c688` — drop now-redundant casts in analytics.ts / lookups.ts
  - `b915982f` — outcome and recommendation
- Baseline before: **401**
- Baseline after: **276** (−125 errors, 31% reduction)
- Diagnosis: **A (generator staleness)** — `ServerSubVerticalData` interface in `scripts/extract-block-registry-data.js` template declared `{ id, blocks }` but the generator embedded literals carrying `{ id, name, industryId, blocks }`. 125 identical TS2353 errors resulted.
- Fix: surgical (~15 min active work). Widened interface template to include optional `name?` and `industryId?`; regenerated `_registry-data.ts`; dropped now-unnecessary `as unknown as SubVerticalWithIndustry[]` casts at two call sites.
- Recommendation: **CLEAN** — Phase 3 pre-flight can resume against 276 once this branch merges.
- See: `docs/baseline-investigation/{registry-data-diagnosis,outcome}.md`
- Phase 2 retrospective correction flagged (ENGINE_ROLLOUT_SUMMARY.md + docs/engine-rollout-phase2/tuning.md reference 401) — to be addressed via erratum notes in the next pre-flight session's Task 9.
