# `BOOKING_PILOT_SUMMARY.md` — required template

Produce after Phase C passes and every DoD box in [dod.md](dod.md) is checked. A reviewer should be able to open this file and within 5 minutes answer:

- Did the engine model survive contact with real partners?
- Did the latency/accuracy bet pay off?
- Did anything break for non-Booking partners?
- What's the next concrete step?

---

## Required sections

```markdown
# Booking Pilot — Final Summary

## What shipped
- Brief paragraph
- Bulleted list of milestones delivered (M01–M15)

## What deferred to Phase 2
- List with rationale per item

## Performance results
- Median prompt-token reduction: <%>%
- Per-turn latency delta: <ms>
- Health adoption: <n> partners with computed Health docs

## Risk register
- Items observed during validation that may bite Phase 2
- Each with severity and proposed mitigation

## Open questions (carried forward)
- Reference to unresolved entries in BOOKING_PILOT_QUESTIONS.md

## Recommended next steps for Phase 2
- What should change in the playbook based on what we learned
```

---

## Writing notes

- Keep it **factual and terse**. Numbers, not adjectives.
- Link to the specific Phase C test outputs or dashboards for each performance result.
- For each risk-register item: `Severity: high | medium | low` — high = likely to break something in Phase 2 if not fixed first.
- "Recommended next steps" should be concrete (e.g., "tag commerce blocks next; recipe is ready") — not aspirational.
