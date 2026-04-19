# Phase 3 Session 1 — Retrospective

Session: P3.M01 + P3.M03 + P3.M04.
Branch tip: `claude/cutover-p3-m04` (stacked M01 → M03-audit → M03 → M04-audit → M04).

## 1. Commits shipped

| SHA | Commit | tsc |
|---|---|---|
| `2740d489` | `[cutover P3.M01] health gating: feature-flag infrastructure, default off` | 276 |
| `fc740493` | `[cutover P3.M03-audit] derivation shim caller audit — discrepancy with pre-session expectation` | 276 |
| `d0829651` | `[cutover P3.M03] engine-recipes: remove derivation shim` | 276 |
| `0dd20bf3` | `[cutover P3.M04-audit] relay-block-taxonomy caller audit` | 276 |
| `daa096d0` | `[cutover P3.M04] remove legacy relay-block-taxonomy.ts` | 276 |

5 commits. tsc held at 276 throughout — zero drift.

Test count: 523 → 531 (+8 from M01 gating tests; M03 and M04 migrated fixtures were semantic no-ops, not new tests).

## 2. Confirm-by-test table

Each commit's `Speculative-From:` item with the test reference that confirmed it.

| Commit | Speculative-From | Confirmed by test? |
|---|---|---|
| M01 | `x05-timing-decision.md` (feature-flag staged rollout) | **Yes** — `src/lib/relay/health/__tests__/gating.test.ts`: 8 tests exercising flag-off / flag-on / missing-health behavior + a scope guard that fails if an M01-unsanctioned caller imports `decideHealthGate`. |
| M03-audit | `plan.md` (M03 safety reasoning) | **Revised** — pre-session expectation ("1 live caller passing typed Partner") was wrong; actual audit found 4 live callers passing loose Firestore shapes. Audit doc's Option B section re-established safety per caller. Not a test-confirmation; a reasoning-confirmation. |
| M03 | `plan.md` | **Yes** — existing 531 tests stayed green after fixture migration + shim removal. Fixtures migrated to `deriveEnginesFromFunctionId` directly (22 fixtures across 8 files). All pass. |
| M04-audit | `plan.md` | **Yes** — grep showed exactly 1 live caller, matching pre-session expectation. |
| M04 | `plan.md` | **Yes** — 531 tests stayed green after migration + deletion. The intent-only fallback code path in `flow-engine.ts` is exercised indirectly by orchestrator tests that pass partners without a current stage set. |

## 3. Tuning revisions

**Rule surfaced for codification:** when a pre-session audit expectation is wrong (M03 case), halt + write the deeper audit + surface for direction is the right move. The Option B path that was executed here should be the default for any milestone where `pre-session-expected caller count ≠ actual caller count`, not a fallback. Propose adding to `tuning.md`:

> **§4.5 (new): Audit-mismatch rule.** If a destructive milestone's pre-session expected caller count differs materially from actual on the first grep, pause before removal. Write an extended audit covering each caller's data path + empty-behavior. Surface to user with options (proceed / extend audit / defer). Removals skipping this step after a mismatch are drift-prone.

Not adding to tuning.md in this session (that's a scope widening). Flagging for Session 2 pre-flight review.

## 4. Session 2 gate — readiness check

Session 2 covers P3.M01-flip + P3.M05 + P3.M06 per `plan.md`.

### Session 2 prerequisites status

- [x] P3.M01 infrastructure shipped and dormant
- [x] `decideHealthGate` + `evaluateHealthGate` available; no caller consumes yet
- [x] `HEALTH_GATING_ENABLED = false` (P3.M01-flip target state: `true`)
- [x] Derivation shim removed; engine-recipes.ts public API tightened
- [x] `relay-block-taxonomy.ts` deleted; flow-engine.ts migrated to registry-data
- [x] 531/531 tests passing
- [x] tsc at 276 (matches tuning.md §2 anchor)

### Session 2 blockers

None identified. The three Session 2 milestones are:

- **P3.M01-flip** — single-constant PR flipping `HEALTH_GATING_ENABLED` to `true`. Requires M05 to have wired callers; doing the flip first would produce the same runtime as today (no callers consume the policy).
- **P3.M05** — orchestrator permissive-fallback removal + Q10 contact-fallback rule. Wires `evaluateHealthGate` into save-path actions.
- **P3.M06** — cross-engine validation using admin reset page.

Suggested Session 2 order: M05 → M01-flip → M06. Landing M05 first means the gate has callers when it flips on; M01-flip before M05 would be dormant and risk confusion if a bug appears ("is the flag actually on?").

### Session 2 specific concerns to surface at kickoff

1. **Q10 contact-fallback rule wording.** Session 1's pre-flight `q10-service-audit.md` recommended a single orchestrator rule: "service break with no eligible service-tagged block → route to `contact` with context." M05's implementation needs to decide exactly where this rule lives (orchestrator selection layer vs the engine-scoped catalog helper). Flag at Session 2 planning.

2. **Feature-flag test swap pattern.** M01's gating tests use `vi.resetModules + vi.doMock` to swap the flag for `flag=true` cases. This pattern works but is verbose. M05 will add more flag-dependent tests; consider extracting a test helper (`withGatingEnabled(() => { ... })`) if M05 hits the same boilerplate.

3. **Empty-engines fallback observation.** M03 removed the shim without wiring any telemetry — if any production partner without `engines` hits an orchestrator turn, it falls into the legacy engine-agnostic path silently. Per Q11 observation-closure (Model B), no production partners exist, so no telemetry is needed. But if Session 3's X04 or Phase 4 introduces partner-creation paths that bypass onboarding, re-visit this.

## 5. Rollback readiness

Each milestone has a clean rollback commit/command in case the Session 1 stack needs to revert before Session 2 starts.

| Milestone | Rollback |
|---|---|
| P3.M04 deletion | `git revert daa096d0` — restores `relay-block-taxonomy.ts` + reverts `flow-engine.ts` migration in one commit |
| P3.M04 audit | Doc-only; `git revert 0dd20bf3` if needed |
| P3.M03 removal | `git revert d0829651` — reinstates derivation shim + reverts 22 test fixtures. Tests will still pass; shim branch comes back |
| P3.M03 audit | Doc-only; `git revert fc740493` if needed |
| P3.M01 | `git revert 2740d489` — removes feature-flags.ts + gating.ts + evaluateHealthGate helper + index.ts re-exports. Runtime behavior identical before and after (flag was off); rollback is purely cleanup |

**Combined rollback:** `git revert daa096d0..HEAD` on the stacked branch reverts all 5 commits. Safe because no milestone has external-side-effect work (no schema migrations, no data touched). Alternatively, merge Session 1 PRs individually and revert whichever fails CI on its own merit.

## 6. What did NOT ship (scope discipline)

Per the session prompt's hard rules, the following were NOT done:

- [x] Did not flip `HEALTH_GATING_ENABLED` to `true` (that's M01-flip in Session 2)
- [x] Did not wire `decideHealthGate` into any save-path caller (that's M05 in Session 2)
- [x] Did not touch orchestrator permissive fallbacks (that's M05)
- [x] Did not start M05, M06, M07, M08, or M09 work
- [x] Did not write any tests for M01-flip or M05 behavior
- [x] Did not add dependencies
- [x] Did not modify tsconfig or TypeScript version
- [x] Did not add `@ts-ignore` or `@ts-expect-error` anywhere

## 7. Session close

All 5 commits pushed to `origin/claude/cutover-p3-m0X` branches (M01, M03, M04; each stacked on the previous).

**Session 2 can start when:**
1. Session 1's 5 commits (3 PRs: M01, M03 stack, M04 stack — or split finer) merge to main
2. Fresh `main` has `HEALTH_GATING_ENABLED = false` + no taxonomy file + no derivation shim
3. A Session 2 kickoff prompt is drafted (references this retrospective's §4 for concerns)

Session 2 target: ~2.5h covering M05 + M01-flip + M06.
