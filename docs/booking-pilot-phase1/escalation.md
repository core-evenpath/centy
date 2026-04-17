# Global escalation triggers — stop and ask

Append to `BOOKING_PILOT_QUESTIONS.md` and pause if **any** of these fires. Do not work around them. Stopping is the correct answer.

1. **Spec ambiguity** — design decision not in the spec and not derivable from code with high confidence.
2. **Conflict with existing code** — established file or pattern conflicts with the plan and resolution is unclear.
3. **Constraint violation required** — milestone acceptance cannot be met without violating a hard rule (see [`00-context.md`](00-context.md) §3).
4. **Coverage shortfall** — < 70% coverage on new modules in `lib/relay/health/` or `lib/relay/engine-recipes.ts`.
5. **Recipe uncertainty** — M03 has > 20% mappings flagged for review.
6. **Partner-visible regression** — Phase C C3 or C4 shows unintended behavior change.
7. **Performance miss** — C5 budget unmet after one round of investigation.
8. **Cascading scope** — a seemingly-simple change cascades into > 5 unrelated files.
9. **Sandbox side effects** — Preview Copilot (M13) cannot be sandboxed without affecting production.
10. **Dependency addition** — new package is required; needs justification per operating principle (see [`00-context.md`](00-context.md) §4).

## When a trigger fires

1. Stop the in-flight milestone immediately. Commit any half-done work on a branch but **do not open a PR** for it.
2. Add an entry to `BOOKING_PILOT_QUESTIONS.md` using the format in [`00-context.md`](00-context.md) §5.
3. Mark the blocked milestone as `blocked` in `BOOKING_PILOT_PROGRESS.md`.
4. Wait for resolution. Do not resume the milestone until the question entry has a `Resolution` block appended.
5. After resolution, start a fresh milestone commit that references the question by `Q##`.
