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

---

## Admin Reset Page
- Status: done
- Branch: `claude/admin-reset-mr06` (stacked on MR01→MR02→MR03→MR04→MR05)
- Commits:
  - MR01 `c02d6568` — allow-list + per-collection semantics
  - MR02 `ea771983` — filter model + validation
  - MR03 `483fc79d` — dry-run preview action
  - MR04 `e2a3753f` — execute + per-verb + env gate
  - MR05 `637afb8f` — admin page UI
  - MR06 (this commit) — self-test + runbook
- Collections on allow-list: **5** (verb distribution: recompute 1, clear 3, delete 1)
  - relay-engine-health (recompute, per-partner)
  - relay-block-configs (clear, per-partner)
  - relay-sessions (clear, per-partner + per-session optional)
  - preview-sessions (clear, no required scope)
  - partner-module-items (delete, per-partner + per-module)
- Env-gated unscoped mode: `RESET_ALLOW_UNSCOPED=true` required; UI + action both gate
- Self-test: green (14 tests exercising full preview→execute→verify sequence for every allow-list collection + idempotence + rejection matrix + audit chain)
- Phase 3 readiness sequence: green (end-to-end flow asserted in self-test)
- Unexpected findings: mock helper needed two enhancements during build
  - `.batch()` support (MR04) — queued-ops batch with `.set`/`.delete`/`.update`/`.commit`
  - auto-id `.doc()` with no argument (MR06) — emulates admin SDK's fresh-id generation
- Ready for Phase 3 Session 1: **yes**
- Deliverables:
  - Source: src/lib/admin/reset/{resettable-collections.ts, filter-model.ts}; src/actions/admin-reset-actions.ts; src/app/admin/system/reset/{page.tsx, ResetShell.tsx}
  - Tests: src/lib/admin/reset/__tests__/*.test.ts + src/actions/__tests__/admin-reset-*.test.ts (63 new tests)
  - Runbook: docs/admin-reset-runbook.md
- Baseline: **276** (verified at every commit; never higher)
- Test count: 448 (Phase 2 close) → 523 (+75 across investigation + pre-flight + admin reset)

---

## Phase 3 Session 1 — M01 + M03 + M04
- Status: done
- Branches (stacked on main):
  - `claude/cutover-p3-m01`
  - `claude/cutover-p3-m03` (stacked on M01)
  - `claude/cutover-p3-m04` (stacked on M03)
- Commits:
  - `2740d489` — P3.M01 health gating feature-flag infrastructure (default off)
  - `fc740493` — P3.M03-audit: shim caller audit (discrepancy with pre-session expectation)
  - `d0829651` — P3.M03: remove derivation shim (22 fixtures migrated to deriveEnginesFromFunctionId)
  - `0dd20bf3` — P3.M04-audit: relay-block-taxonomy caller audit (1 caller, matches expectation)
  - `daa096d0` — P3.M04: migrate flow-engine + delete legacy taxonomy (-240 LOC)
- Baseline: **276** (held at every commit; zero drift)
- Tests: 523 → 531 (+8 from M01 gating tests; M03/M04 were semantic-no-op fixture migrations)
- Dormant infrastructure: `HEALTH_GATING_ENABLED = false`, `decideHealthGate` + `evaluateHealthGate` available but no save-path caller consumes yet (M05 Session 2 wires; M01-flip Session 2 flips default to true)
- Unexpected findings:
  - Pre-session audit expected 1 live shim caller; actual 4. Halt condition fired; extended audit (Option B) documented per-caller safety before removal.
  - All 4 callers had acceptable empty-engines fallback behavior — shim removal safe.
  - flow-engine.ts migration to registry-data used the same filter pattern as loadBlockSnapshots (production-proven).
- Ready for Session 2: **yes** — see `docs/engine-cutover-phase3/session-1-retro.md` §4 for concerns to carry into Session 2 kickoff
- Deliverables:
  - Source: src/lib/feature-flags.ts, src/lib/relay/health/gating.ts (new); engine-recipes.ts + flow-engine.ts + relay-health-actions.ts + relay/health/index.ts (modified); relay-block-taxonomy.ts (deleted)
  - Docs: m03-caller-audit.md (Option B extended audit); m04-caller-audit.md; session-1-retro.md
  - Tests: src/lib/relay/health/__tests__/gating.test.ts (new, 8 tests); 22 test-fixture migrations across 8 files

---

## Phase 3 Session 2 — tuning §4.5 + test helper + M05 + M01-flip + M06
- Status: done
- Branch: `claude/phase-2-engine-rollout-Hr3aW` (stacked on main at `365cea9c`)
- Commits:
  - `170703b7` — tuning §4.5 audit-mismatch halt rule (codifies Session 1 §3 recommendation)
  - `66fee970` — `withGatingEnabled` test helper + M01 gating test refactor
  - `41aefa2c` — P3.M05-audit (orchestrator permissive-fallback evidence doc)
  - `ad1ddefe` — P3.M05.1 blocks signal: remove engine-null permissive filter
  - `bb4eb80d` — P3.M05.2 Q10 service-break contact-fallback rule
  - `dc1e50ae` — P3.M05.3 wire `evaluateHealthGate` into two save paths
  - `023f8043` — P3.M01-flip `HEALTH_GATING_ENABLED: false → true`
  - `81a63900` — P3.M06 cross-engine validation (doc-only)
  - (this commit) — progress log update + Session 2 retro
- Baseline: **276** (verified at every commit; never higher)
- Test count: 531 (Session 1 close) → **556** (+25)
- Tuning revision landed: §4.5 audit-mismatch halt rule (new); old §4.5 bumped to §4.6
- M05 sub-commit shape: one audit + three focused commits (blocks-signal fail-closed, Q10 contact-fallback, save-path gating wire); no `@ts-ignore`, no new dependencies, no tsconfig changes
- M05 behaviors under test:
  - M05.1: 3 new tests in `blocks.test.ts` (null-engine → empty; filter active; no-prefs)
  - M05.2: 17 new tests in `service-break.test.ts` (pure function positive + negative)
  - M05.3: 5 new tests in `relay-health-actions.test.ts` §evaluatePartnerSaveGate
- M01-flip discipline: single-constant commit (`feature-flags.ts` one-line); 4 flag-off tests re-wrapped in `withGatingEnabled(false)`, 4 flag-on tests dropped their wrap (now default)
- Q10 contact-fallback rule placement: orchestrator selection layer (per Session 2 §0.3 decision). Pure helper `isServiceBreakFallback` in `src/lib/relay/orchestrator/service-break.ts`; short-circuits Gemini call + allow-list validation when active engine is 'service', catalog is empty, and intent ∈ `{returning, complaint, contact, urgent}`.
- Save-path gating scope: `updateModuleItemAction` + `applySeedTemplate`. CSV import and other lower-impact save paths stay unwired per audit §2.
- Telemetry additions: `serviceBreak: boolean` field on `[relay][turn]` log.
- Unexpected findings:
  - Canonical engine order is `[commerce, booking, ...]` not `[booking, ...]` — caught during M05.3 test pass 1.
  - `evaluatePartnerSaveGate` initially dropped the `reason` when all engines allowed; fixed to carry `lastReason` so callers distinguish "allowed due to flag off" from "allowed with no engines".
- Rollback: each commit independently revertable; combined revert via `git revert 81a63900..170703b7^` returns runtime to Session-1-close.
- Ready for Phase 3 Session 3: **yes** — see `docs/engine-cutover-phase3/session-2-retro.md` §4
- Deliverables:
  - Source: `src/lib/feature-flags.ts` (flipped); `src/lib/relay/orchestrator/service-break.ts` (new); `src/lib/relay/orchestrator/index.ts` (service-break wiring + telemetry); `src/lib/relay/orchestrator/signals/blocks.ts` (engine-null fail-closed); `src/actions/relay-health-actions.ts` (evaluatePartnerSaveGate added); `src/actions/modules-actions.ts` + `src/actions/relay-seed-actions.ts` (gate calls)
  - Docs: `tuning.md` (§4.5 added); `m05-fallback-audit.md`; `m06-validation.md`; `session-2-retro.md`; `CUTOVER_PROGRESS.md` (this block)
  - Tests: `src/__tests__/helpers/gating-flag.ts` (new helper); `src/lib/relay/orchestrator/signals/__tests__/blocks.test.ts` (new, 3 tests); `src/lib/relay/orchestrator/__tests__/service-break.test.ts` (new, 17 tests); `src/lib/relay/health/__tests__/gating.test.ts` (refactored); `src/actions/__tests__/relay-health-actions.test.ts` (+5 tests)
