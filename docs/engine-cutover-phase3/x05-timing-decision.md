# X05 timing decision

Session: Phase 3 pre-flight v3, Task 4.

## Context

X05 = Health gating cutover: flip Health from shadow-mode (writes happen, nothing blocks) to gating-mode (red Health blocks saves for at-risk partners, or equivalent policy).

Phase 2 tuning.md §6 deferred X05 to Phase 3 pending observation data. Task 2's observation-closure analysis concluded the window closes by evidence (Model B) as of Phase 2 close — X05 is no longer blocked on data.

Task 3 recommended Narrow X04 (admin seed-drafting tool, shadow to production). X04 and X05 are now loosely coupled rather than tightly sequential.

## Options

### X05 before X04

Flip gating first; harden Health precision against the existing partner surface (no partners today but the scripts + X03 test suite exercise the code). Ship X04 afterwards into a gated environment.

- **Pro:** gating is validated before any AI-drafted content enters. If X04 ships something that fails Health checks, gating catches it before it deploys to real partners.
- **Con:** Health iteration continues without production signal (same as shadow-mode today). Timing doesn't actually change the information available.
- **Sequencing risk:** low. X05 and X04 are on different code paths (orchestrator Health signal vs admin tooling).

### X05 after X04

X04 ships into shadow-mode Health first. Partners generated via X04 get observed for a week or two. Then X05 flips gating.

- **Pro:** if X04's AI drafts land badly (low quality, edge cases), shadow mode absorbs the discovery without user-visible breakage.
- **Con:** we've established observation-closure is evidence-based, not time-based. "Wait two weeks" doesn't add value unless actual partner traffic hits. Without partners, waiting post-X04 measures no more than waiting pre-X04.
- **Sequencing risk:** low.

### X05 parallel with X04

Both proceed simultaneously. Narrow X04 doesn't touch orchestrator code; X05 doesn't touch seed-drafting tooling. No merge conflicts; both can ship within a week of each other.

- **Pro:** fastest total elapsed time. Single Phase 3 session covers both if scoped tight.
- **Con:** two concerns shipping in close proximity makes post-ship attribution harder ("did this bug come from X04 or X05?"). Phase 2's isolation discipline would recommend against.
- **Sequencing risk:** low, but attribution risk medium.

## Recommendation

**X05 before X04.** Three reasons:

1. **X05 is a simpler cutover than X04.** Gating is mostly a policy flip with an allow-list. X04 is new code (CLI tool + prompt engineering + quality loop). Ship the less-risky cutover first.
2. **Observation was already closed.** Task 2 concluded no external data arrives by waiting. "X05 after X04" is just "X05 delayed for no information gain."
3. **Sequencing separability.** X05 lives in orchestrator Health path; X04 lives in admin build-tools. Neither depends on the other's state. Ship X05 in P3.M01 (earliest destructive milestone); ship X04 in P3.M08 as its own concern.

## Impact on observation-closure criteria

Task 2's Model B closure holds for X05 regardless of X04 timing. The 7 signals are satisfied today and remain satisfied whether X04 ships or not. **X05 unblocked immediately.**

## Impact on the admin reset page session

The admin reset page's collection allow-list is grounded on what X05 gates. With X05 shipping first (and gating on the red-Health policy to be defined in P3.M01), the reset page needs:

- **Allow-list includes `relayEngineHealth/*`** — resetting Health state is a plausible reset operation (re-trigger shadow recompute) but not a gating override
- **Allow-list does NOT include partner document state** — reset should not grant bypass of Health gating

This is consistent with the existing admin reset prompt design.

## Recommendation summary

| Decision | Choice |
|---|---|
| X05 timing | **Before X04** |
| X05 milestone | P3.M01 (first destructive milestone) |
| X04 milestone | P3.M08 (after cleanup milestones M03–M07 complete) |
| Parallelism | None — ship sequentially |
| Observation closure dependency | Already satisfied (Model B) |
| Admin reset page implication | Allow-list per X05 policy (Health docs in, partner state out) |

## Risk mitigation for X05 P3.M01

Since X05 ships into a zero-partner environment, the rollback mechanic needs care:

- **Feature-flag the gating behavior** — one constant in the orchestrator flips gating on/off
- **Ship the flag default = off** — first merge lands shadow behavior, same as today
- **Flip the flag default = on** in a subsequent small PR — makes X05 a two-step rollout where step 2 is atomic
- **Rollback = flip the flag back** — no state migration, no schema change

This staging pattern was suggested in Phase 2 tuning §6 and remains appropriate.
