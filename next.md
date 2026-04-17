# Next — Booking Engine Pilot (Phase 0 + Phase 1)

Execution roadmap for shipping the Booking engine end-to-end with shadow-mode Health, zero new AI calls, and full backward compatibility for non-booking partners.

The original plan has been split into modular task files under [`docs/booking-pilot/`](docs/booking-pilot/). Each milestone is self-contained so it can be read, worked, and reviewed independently.

---

## Start here

1. **Read the context first.** [`00-context.md`](docs/booking-pilot/00-context.md) contains the mission, non-negotiable constraints, file map, and appendices. Do not skip.
2. **Do Phase A before touching production code.** Follow [`01-phase-a-analysis.md`](docs/booking-pilot/01-phase-a-analysis.md) and commit `docs/booking-pilot-analysis.md` before any milestone.
3. **Work M01 → M15 in order.** One commit per milestone. Format: `[booking-pilot Mxx] <summary>`. Update `BOOKING_PILOT_PROGRESS.md` at the end of each milestone.
4. **Run Phase C after M15.** See [`phase-c-validation.md`](docs/booking-pilot/phase-c-validation.md).
5. **Close out.** Follow [`reporting-dod.md`](docs/booking-pilot/reporting-dod.md) for progress log, escalation rules, Definition of Done, and final summary.

---

## Milestone map

| #   | File                                                                                         | Topic                                         |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| —   | [00-context.md](docs/booking-pilot/00-context.md)                                            | Mission, constraints, appendices, file map    |
| A   | [01-phase-a-analysis.md](docs/booking-pilot/01-phase-a-analysis.md)                          | A1–A6 inventory + gap analysis                |
| M01 | [m01-engine-types.md](docs/booking-pilot/m01-engine-types.md)                                | Engine + BlockTag type system                 |
| M02 | [m02-schema.md](docs/booking-pilot/m02-schema.md)                                            | Additive schema fields                        |
| M03 | [m03-recipes.md](docs/booking-pilot/m03-recipes.md)                                          | functionId → engines recipe                   |
| M04 | [m04-tag-blocks.md](docs/booking-pilot/m04-tag-blocks.md)                                    | Tag Booking blocks only                       |
| M05 | [m05-flow-templates.md](docs/booking-pilot/m05-flow-templates.md)                            | Booking flow templates                        |
| M06 | [m06-health-checker.md](docs/booking-pilot/m06-health-checker.md)                            | Pure Health functions                         |
| M07 | [m07-health-storage.md](docs/booking-pilot/m07-health-storage.md)                            | Shadow-mode writes + read action              |
| M08 | [m08-admin-blocks-ui.md](docs/booking-pilot/m08-admin-blocks-ui.md)                          | Engine tabs in `/admin/relay/blocks`          |
| M09 | [m09-admin-health-ui.md](docs/booking-pilot/m09-admin-health-ui.md)                          | `/admin/relay/health` page                    |
| M10 | [m10-intent-engine.md](docs/booking-pilot/m10-intent-engine.md)                              | engineHint + keyword lexicon                  |
| M11 | [m11-session-active-engine.md](docs/booking-pilot/m11-session-active-engine.md)              | Sticky `activeEngine` selection               |
| M12 | [m12-orchestrator-policy.md](docs/booking-pilot/m12-orchestrator-policy.md)                  | Engine-scoped catalog                         |
| M13 | [m13-preview-copilot.md](docs/booking-pilot/m13-preview-copilot.md)                          | Scripted Preview Copilot                      |
| M14 | [m14-onboarding.md](docs/booking-pilot/m14-onboarding.md)                                    | Deterministic recipe picker                   |
| M15 | [m15-drafting.md](docs/booking-pilot/m15-drafting.md)                                        | Seed templates + generic CSV import           |
| C   | [phase-c-validation.md](docs/booking-pilot/phase-c-validation.md)                            | Unit / integration / smoke / regression / perf |
| ✓   | [reporting-dod.md](docs/booking-pilot/reporting-dod.md)                                      | Progress log, DoD, escalation                 |

---

## Hard rules (full detail in [`00-context.md`](docs/booking-pilot/00-context.md))

- **No new AI calls.** Deterministic code only. Seed content is data, not prompts.
- **Additive schema only.** No destructive migrations. Non-booking partners keep running untouched.
- **Shadow-mode Health.** Health computes and writes but never gates publishing or runtime.
- **Booking-only tagging.** Do not add `engines: [...]` to non-Booking blocks in this task.
- **Stop on ambiguity.** Log unanswered design questions to `BOOKING_PILOT_QUESTIONS.md` and wait for guidance.
- **One milestone per commit.** Never bundle unrelated milestones together.

---

## Reporting artifacts (create at repo root as you go)

- `BOOKING_PILOT_PROGRESS.md` — append one block per milestone ([format](docs/booking-pilot/reporting-dod.md)).
- `BOOKING_PILOT_QUESTIONS.md` — any escalation triggers, unresolved design calls.
- `BOOKING_PILOT_SUMMARY.md` — final summary at end of task.
- `docs/booking-pilot-analysis.md` — Phase A deliverable, committed before M01.

---

**Begin with Phase A. Do not proceed to Phase B until the analysis document is committed.**
