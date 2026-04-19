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

---

## Phase 3 Pre-Flight (v3)
- Status: done
- Branch: `claude/cutover-preflight-v3` (stacked on `claude/baseline-investigation-fresh`)
- Commits:
  - `63616e03` — Q10 service audit
  - `e3b797a7` — observation closure criteria (Model B)
  - `bf054a84` — X04 scope decision (Narrow)
  - `e16b8921` — X05 timing decision (before X04)
  - `8632715e` — tuning.md
  - `5ce1c24b` — execution plan
  - (this commit) — progress log update
  - (next commit) — Phase 2 erratum notes
- Baseline: **276** (verified clean-tree tsc at every commit; never higher)
- Deliverables under `docs/engine-cutover-phase3/`:
  - `q10-service-audit.md`
  - `observation-closure.md`
  - `x04-scope-decision.md`
  - `x05-timing-decision.md`
  - `tuning.md`
  - `plan.md`
- Ready for admin reset page session: **yes**

### Key decisions

- **Q10 service tagging**: 16 service-tagged blocks (not 4); per-engine gaps 3-6 blocks total; below escalation threshold. Recommendation: contact-fallback rule in P3.M05 rather than per-intent blocks.
- **Observation closure**: Model B (evidence-based). 7 signals verified today. Q2 and Q11 transition to resolved at Phase 3 close.
- **X04 scope**: Narrow (admin seed-drafting CLI tool only). No runtime AI. Adjustment 5 preserved.
- **X05 timing**: Before X04, via feature flag. Two-step rollout (flag default-off, then flip to on atomically).
- **Milestone count**: 8 milestones (M01-M09, M02 removed for no-migration). 3 Phase 3 sessions estimated.

### Next session: admin reset page

Pre-flight outputs ground the reset page design:
- `q10-service-audit.md` informs collection allow-list
- `x05-timing-decision.md` informs Health reset semantics
- `plan.md`'s P3.M06 final-validation depends on reset being available
