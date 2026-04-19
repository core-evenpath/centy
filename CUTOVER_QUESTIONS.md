# Cutover — Phase 3 Open Questions

Questions, escalations, and ambiguities surfaced during Phase 3 execution.
Format: one entry per block. Status transitions to `resolved` when closed,
or `carried forward` when deferred to a later phase.

---

## Q1 — Phase 2 and Phase 1 evidence files missing; pre-flight blocked    (2026-04-17)

**Status:** open — BLOCKING

**Trigger:** Section 2.1 (Pre-flight / Read Phase 1 + Phase 2 outputs). The
playbook instructs:

> Absorb every conclusion from:
> - `BOOKING_PILOT_SUMMARY.md` — Phase 1 final report
> - `ENGINE_ROLLOUT_SUMMARY.md` — Phase 2 final report
> - `BOOKING_PILOT_QUESTIONS.md` and `ENGINE_ROLLOUT_QUESTIONS.md` — carried-forward items
> - `docs/engine-rollout-phase2/tuning.md` — decisions about X04 and X05
>
> If `ENGINE_ROLLOUT_SUMMARY.md` is missing, **stop**. Phase 3 cannot proceed
> without Phase 2 evidence. Log to `CUTOVER_QUESTIONS.md` and escalate.

**Observed state of the repo (branch `claude/phase-2-engine-rollout-Hr3aW`,
working tree currently clean on the escalation commit from Phase 2):**

| Expected file                                   | Present? |
|-------------------------------------------------|----------|
| `BOOKING_PILOT_SUMMARY.md` (root)               | No       |
| `ENGINE_ROLLOUT_SUMMARY.md` (root)              | No       |
| `BOOKING_PILOT_QUESTIONS.md` (root)             | No       |
| `ENGINE_ROLLOUT_QUESTIONS.md` (root)            | Yes — created by me in the Phase 2 escalation; contains only Q1 "Phase 1 artifacts missing." No Phase 2 content has been produced. |
| `docs/engine-rollout-phase2/tuning.md`          | No — directory does not exist |
| `docs/engine-cutover-phase3/`                   | No — directory does not exist |

**Context.** Phase 2's pre-flight was halted earlier this session because the
four Phase 1 evidence files did not exist (see `ENGINE_ROLLOUT_QUESTIONS.md`
Q1 and PR #132). No Phase 2 milestones ran. Therefore no Phase 2 outputs
(`ENGINE_ROLLOUT_SUMMARY.md`, `tuning.md`, per-engine progress entries) can
exist. Phase 3's pre-flight depends on those outputs plus the Phase 1 outputs
that were already missing.

**Impact.** Phase 3 cannot produce `docs/engine-cutover-phase3/plan.md` with
integrity. Every section of that plan requires specific inputs that do not
exist:

- **X05 status** — needs `tuning.md` and Phase 2 milestone records to know
  whether gating was flipped.
- **Partner migration scope** — needs post-Phase-2 partner state; no Phase 2
  migrations have run, so the "count of partners with empty `engines`" is
  whatever Phase 1 left behind, not a Phase 2 end-state.
- **`relay-block-taxonomy.ts` caller audit** — the playbook says this file is
  "unused but undeleted" because of Phase 1 hard rule #6. That premise is
  only true after Phase 1 and Phase 2 completed — which did not happen. The
  caller set today is not the Phase-2-end-state caller set.
- **Permissive-fallback audit** — the "fallback for partner with no engines"
  branches the playbook wants to remove only become unreachable after
  P3.M02 + P3.M03 migrate every partner. Those fallbacks are still live.
- **Carried-forward risks** — depends on Phase 1 and Phase 2 risk registers,
  none of which exist.

Executing Phase 3 today would be destructive against an unverified codebase
state. Phase 3 is explicitly a destructive phase (deletes
`relay-block-taxonomy.ts`, removes orchestrator fallback branches, migrates
every partner's schema shape, flips Health gating). Its hard rule #1:

> Evidence precedes removal. No code is deleted until a written record in
> `docs/engine-cutover-phase3/plan.md` proves zero live callers. No partner
> is migrated until dry-run results are reviewed.

Without the Phase 1 and Phase 2 evidence artifacts, that precondition cannot
be satisfied.

**Per Escalation Trigger #1** ("Phase 2 summary missing — pre-flight cannot
proceed"), I am stopping.

**Possible resolutions — need human decision:**

1. **Complete Phase 1 and Phase 2 first.** Phase 3 is a cleanup/cutover pass
   that assumes the prior phases have shipped. Running it today risks
   deleting code that real runtime paths still depend on.
2. **Locate or provide the evidence files.** If `BOOKING_PILOT_SUMMARY.md`,
   `ENGINE_ROLLOUT_SUMMARY.md`, and `tuning.md` exist elsewhere (another
   branch, another repo, an artifact store), point me at them.
3. **Authorize a reduced-scope Phase 3.** For example: only the
   documentation consolidation (P3.M07) can be attempted without the
   evidence artifacts — but even that requires understanding what the
   Phase 1/2 docs *said* so the canonical doc doesn't contradict them. I
   recommend against this path.
4. **Defer Phase 3** entirely until Phases 1 and 2 close out cleanly.

**Action taken so far in this session:**

- Re-verified every expected Phase 1 + Phase 2 file is absent.
- Confirmed `docs/engine-rollout-phase2/` and `docs/engine-cutover-phase3/`
  do not exist.
- Created this `CUTOVER_QUESTIONS.md`.
- No `docs/engine-cutover-phase3/plan.md` written.
- No Phase 3 milestones started. No code changes.

**Awaiting:** human guidance. The most likely correct next step is completing
Phase 1 + Phase 2 first, not forcing Phase 3 on top of an unverified
foundation.

---

## Q_P3_01 — tsc baseline drift: claimed 401, actual 455 (+54)    (2026-04-19)

**Status:** OPEN — BLOCKING Phase 3 pre-flight Tasks 1–7.

**Trigger:** Section 3.1 / Section 7.1 of the Phase 3 pre-flight prompt —
"If tsc ≠ 401: stop, log Q_P3_01, escalate." Also note: Q1 above (from
2026-04-17) is now historically obsolete — Phase 1 and Phase 2 artifacts
are present in the repo today (Phase 2 closed 2026-04-19). The concern
tracked by Q1 no longer applies; this Q_P3_01 supersedes it as the active
blocker.

**Exact state at pre-flight session start (2026-04-19):**

- HEAD: `0ee68973c98e5011e28d6b78837923f56a670631` (= `origin/main`, Phase 2
  close merge — PR #173).
- Node: v23.8.0
- TypeScript: 5.9.3
- Command run (twice): `rm -rf .next tsconfig.tsbuildinfo && npx tsc
  --noEmit --incremental false` and `rm -rf .next && npx tsc --noEmit`.
- Both runs report **455** errors.
- Working tree: only `DONE.md` modified (markdown — cannot affect tsc).
  DONE.md change belongs to an unrelated workstream; not introduced by
  this pre-flight session.

**Contradiction with Phase 2 close artifacts:**

- `ENGINE_ROLLOUT_SUMMARY.md:50` — "**tsc baseline**: 401 throughout
  Phase 2 (zero new errors)."
- `ENGINE_ROLLOUT_SUMMARY.md:157` — "Current baseline: 401."
- `docs/engine-rollout-phase2/tuning.md:268` — "Gate-session re-measurement
  at HEAD showed **401** without any working-tree state."
- Measured today on the exact commit that produced the summary: **455**.

**Error-distribution snapshot (top contributors):**

| Errors | File / area |
|---|---|
| 125 | `src/app/admin/relay/blocks/previews/_registry-data.ts` (single file) |
| 38  | `src/lib/relay/` (top-level dir; unique files) |
| 28  | `src/lib/business-autofill-service.ts` |
| 19  | `src/components/partner/` (top-level dir; unique files) |
| 15  | `src/actions/vault-actions.ts` |
| 13  | `src/lib/mockData.ts` |
| 13  | `src/app/api/` (top-level dir; unique files) |

The single-file contribution from `_registry-data.ts` (125) exceeds the
total delta (54), which means that file already carried errors at the
claimed-401 baseline AND the count has grown somewhere. The distinction
between "new drift post-claim" and "miscount at close" cannot be made
without a prior tsc-output log to diff against.

**Possible causes (no decision made — evidence-neutral list):**

1. The Phase 2 close re-measurement of 401 was performed against a
   different local state (uncommitted changes, stale `node_modules`,
   partial `.next` cleanup) than what was actually pushed.
2. A post-close commit added errors. But HEAD = `origin/main` and no
   commits exist after `0ee6897`, so this is unlikely unless something
   slipped in pre-merge.
3. Environment difference at the Phase-2-close measurement vs now — TS
   5.9.3 and Node 23.x are stable for tsc determinism, so low likelihood.
4. The 401 figure was copied forward from an earlier session without
   actual re-measurement at close, despite the stated discipline in
   `tuning.md` §Gate-session meta note.

**Why this blocks Phase 3 pre-flight:**

Hard rule 4 ("verify claims against code") is violated at the baseline
level. Phase 3 is the destructive phase; its rollback checks and
milestone gates reference the tsc baseline. Proceeding with an incorrect
baseline means every subsequent "no regression" check is measuring drift
against an unverified anchor.

Hard rule 7 ("one task per commit") also implies each commit should be
evaluated against a known tsc number; if the anchor is wrong,
per-milestone evaluation is wrong.

**Proposed resolutions (human review required):**

A. **Accept 455 as the Phase 3 entry baseline.** Re-annotate Phase 2
   close docs with the true number; update `tuning.md` with a note that
   401 was a misreport and 455 is the accurate baseline for Phase 3.
   Low-cost; preserves forward motion. Does not investigate root cause.

B. **Triage and reduce before Phase 3.** Spend a pre-Phase-3 cleanup
   session on the top contributors (`_registry-data.ts` alone is 125
   errors; tackling that file likely drops the count meaningfully).
   Re-anchor at a lower, verified number. Defers this pre-flight by one
   session.

C. **Investigate then decide.** A short investigation session: diff
   `_registry-data.ts` against recent commits to identify when errors
   were introduced; decide A or B based on findings. Minimal cost, best
   information.

**Recommendation:** option C — investigate before accepting or cleaning.
The investigation is bounded (one file contributes the bulk; git log on
that file will localize the drift).

**Action taken so far in this session:**

- Ran state assessment per Section 3.1.
- Reproduced tsc = 455 across two clean measurements.
- Characterized error distribution (top contributors above).
- Confirmed DONE.md modification is unrelated to this session.
- Did NOT proceed to context absorption (Section 3.3).
- Did NOT start Task 1 or any subsequent task.
- Did NOT write any production code; did NOT modify schema; did NOT
  touch partner fixtures.
- Did NOT overwrite the existing `CUTOVER_QUESTIONS.md` — appended this
  entry instead to respect the "never edit prior entries" append-only
  discipline.
- Did NOT initialize `CUTOVER_PROGRESS.md` yet (Task 7 not reached).

**Awaiting:** human guidance on resolution A / B / C before resuming the
pre-flight.

---

## Q_P3_02 — Pre-flight prerequisites missing; PR #175 baseline-investigation never executed    (2026-04-19)

**Status:** open — BLOCKING

**Trigger:** Phase 3 pre-flight (revised) playbook Section 4.1 prerequisites and Section 4.2 baseline check.

**Playbook premise:**
> The baseline investigation (commit `efd6891`, PR #175) found and fixed a generator bug in `scripts/extract-block-registry-data.js` that had been producing 125 identical TS2353 errors since commit `7c36f26`. Post-fix, the verified baseline on `main` at Phase 2 close is **330**.
> Phase 3 baseline is 330, not 401. Every subsequent session measures against 330.

**Verified state of repo (HEAD = `76b16b7a` on `main`):**

| Section 4.1 / 4.3 expected artifact                                          | Present? |
|------------------------------------------------------------------------------|----------|
| `CUTOVER_PROGRESS.md` with baseline-investigation entry                      | NO       |
| `CUTOVER_QUESTIONS.md` with Q1 + Q_P3_01                                     | YES — but only Q1 + Q_P3_01; no Q_P3_## supersession marker for Q1 |
| `docs/baseline-investigation/outcome.md`                                     | NO — directory does not exist |
| `docs/baseline-investigation/registry-data-diagnosis.md`                     | NO — directory does not exist |
| Commit `efd6891` (claimed baseline-investigation commit) in `git log`        | NO       |
| PR #175 in `git log --oneline` (latest merge is PR #173 / commit `0ee68973`) | NO       |

**Section 4.2 baseline measurement (clean tree, prescribed command):**
```
git checkout main && git pull origin main      # already at 76b16b7a
rm -rf .next && rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo
npx tsc --noEmit 2>&1 | grep -c "error TS"
```
Result: **401** (expected 330 ±5; > 335 ceiling triggers escalation).

**Top contributor (matches Q_P3_01 diagnosis):**
- `src/app/admin/relay/blocks/previews/_registry-data.ts` — 125 errors

The 125-error generator-bug pattern that Q_P3_01 flagged and that PR #175 was supposed to fix is still present.

**Why this blocks the entire pre-flight:**

The playbook is internally consistent only if the baseline-investigation has executed. Specifically:
- **Tasks 1–7 (decision documents)** reference 330 as the baseline; writing decisions against 401 would propagate the same kind of incorrect-reference issue Phase 2 had.
- **Task 8 (cast removals)** depends on the generator fix making the casts unnecessary. Removing them while the generator bug still produces incompatible types would break tsc.
- **Task 9 (erratum notes)** would document a 401 → 330 transition that hasn't actually occurred.
- **Section 4.2** explicitly says "If > 335: ... Stop; log Q_P3_03; do not proceed." Current measurement is 401 — well above that ceiling, with the same root cause as Q_P3_01.

Calling this Q_P3_02 because Q_P3_01 already exists; the playbook says "log Q_P3_03" but the next actual unused number is Q_P3_02 (Q_P3_01 is the prior session's escalation; nothing was Q_P3_02).

**Possible resolutions (human review required):**

A. **Execute the baseline investigation first.** Write `docs/baseline-investigation/{registry-data-diagnosis,outcome}.md`, fix the generator bug in `scripts/extract-block-registry-data.js`, regenerate `_registry-data.ts`, verify the new baseline (predicted 330 ±5), open PR #175, merge. Then this pre-flight session can run as written.

B. **Re-spec the pre-flight against the actual 401 baseline.** Drop the playbook's "330" reference; treat 401 as the authoritative Phase 3 entry baseline; skip Task 8 (casts may still be needed) and adjust Task 9 to document the actual 401 → 401 (no transition). Less work, but loses the generator-bug fix value.

C. **Combine A + this session.** Same session does the investigation + fix + pre-flight. ~3 hours total — over the 2.5h ceiling but inside Phase 3 risk envelope. Higher coupling risk (pre-flight decisions made while production-code-touching work is in progress).

**Recommendation:** **Option A.** The baseline-investigation deserves its own focused commit boundary so the generator fix and the pre-flight decisions are separable artifacts. The playbook's separation between "PR #175 fix" and "this pre-flight" exists for that reason; folding them together loses the audit trail the playbook implicitly relies on.

**Action taken so far in this session:**

- Confirmed git HEAD = `76b16b7a [cutover pre-flight] Q_P3_01 escalation`.
- Ran prescribed `rm -rf .next && rm -rf node_modules/.cache && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit 2>&1 | grep -c "error TS"`. Result: **401**.
- Confirmed top contributor is `_registry-data.ts` with 125 errors (same root cause as Q_P3_01).
- Verified absence of `CUTOVER_PROGRESS.md`, `docs/baseline-investigation/`, commit `efd6891`, PR #175.
- Did NOT proceed to Tasks 1–9 per Section 8 escalation triggers #1 + #5 + Section 5 hard rule #7.
- Did NOT modify `scripts/extract-block-registry-data.js` or `_registry-data.ts` (would constitute production-code work that this pre-flight prohibits).
- Did NOT remove the type casts in `analytics.ts:164` / `lookups.ts:40` (Task 8 prereq unmet).
- Did NOT add erratum notes (Task 9 prereq unmet).
- Did NOT initialize `CUTOVER_PROGRESS.md` (Task 7 reaches that, blocked behind 1–6).
- Appended this entry rather than overwriting prior entries (append-only discipline).

**Awaiting:** human guidance on resolution A / B / C before resuming.
