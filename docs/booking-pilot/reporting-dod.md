# Reporting, Definition of Done, and Escalation

## Progress log format

After each milestone, append this block to `BOOKING_PILOT_PROGRESS.md` at the repo root:

```
## M## — <name>
- Status: done | blocked | deferred
- Commit: <sha>
- Files changed: <count>, LOC: +<added>/-<removed>
- Tests: <passed>/<total>
- Notes: <anything surprising, risky, or deferred>
- Deviations from prompt: <any, with rationale>
```

At task completion, produce `BOOKING_PILOT_SUMMARY.md` containing:

- What shipped
- What was deferred to Phase 2
- Performance deltas measured (C3/C5)
- Unresolved questions copied from `BOOKING_PILOT_QUESTIONS.md`

---

## Definition of Done (all required)

1. Fifteen milestone commits merged, each with passing tests.
2. `docs/booking-pilot-analysis.md` and `BOOKING_PILOT_PROGRESS.md` complete and committed.
3. Phase C validation all green (see `phase-c-validation.md`).
4. Three booking pilot partners successfully configured via the onboarding recipe picker (M14) and running live through Preview Copilot scripts (M13).
5. Zero regression reports from non-booking partners (checked via log review + three manual partner traces in C4).
6. Shadow-mode Health running and writing to Firestore without gating anything.

---

## Escalation triggers — stop and write to `BOOKING_PILOT_QUESTIONS.md`

Pause and wait for guidance if **any** of these happen:

- An existing file's purpose conflicts with a planned change and the correct resolution isn't obvious.
- A milestone's acceptance criteria cannot be met without violating a non-negotiable constraint (see `00-context.md`).
- Test coverage falls below 70% for any new module in `lib/relay/health/` or `lib/relay/engine-recipes.ts`.
- Performance budget (C5) is not met after reasonable investigation.
- A partner-visible regression appears in smoke tests (C3) or regression check (C4).
- The `functionId → engines` recipe has more than 20% uncertain mappings.
- A seemingly-simple change starts cascading into more than 5 unrelated files.

Do not work around these. Wait.

---

## Commit hygiene

- One milestone per commit. Commit message format:
  `[booking-pilot Mxx] <short summary>`
- Phase-A commit: `[booking-pilot A] analysis doc: ...`
- Phase-C commit: `[booking-pilot C] validation gates: ...`
- Never skip pre-commit hooks (`--no-verify`) unless the user explicitly asks.
- Never bundle unrelated milestones into a single commit.
- If a new dependency is added, include a line in the progress doc explaining why existing code cannot do the job.
