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
