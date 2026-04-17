# Next — Booking Engine Pilot (Phase 0 + Phase 1, expanded)

Execution roadmap for Phase 0 + Phase 1 of the Relay Engine Architecture. Deterministic code only — **no new AI calls anywhere**. Full backward compatibility for non-booking partners.

This is the second, more detailed pass of the Booking Engine Pilot plan. It has been split into modular task files under [`docs/booking-pilot-phase1/`](docs/booking-pilot-phase1/) so each section can be read, edited, and reviewed independently without writing a single massive document.

Pair this with the earlier, shorter plan at [`next.md`](next.md) if needed — this version supersedes it where they disagree.

---

## Start here

1. **Read the context first.** [`00-context.md`](docs/booking-pilot-phase1/00-context.md) — mission, hard rules, operating principles, reporting protocol. Non-negotiable before touching any code.
2. **Scan the appendices.** [`appendices.md`](docs/booking-pilot-phase1/appendices.md) — engine enum, booking block candidates, functionId→engines starter, key file map.
3. **Do Phase A before any production code.** [`phase-a-analysis.md`](docs/booking-pilot-phase1/phase-a-analysis.md). Commit `docs/booking-pilot-analysis.md` with A1–A6 fully answered. No M01+ work begins until Phase A is merged.
4. **Work M01 → M15 in order.** One commit per milestone. Format: `[booking-pilot Mxx] <summary>`. Update `BOOKING_PILOT_PROGRESS.md` after each milestone.
5. **Run Phase C after M15.** [`phase-c-validation.md`](docs/booking-pilot-phase1/phase-c-validation.md). All five gates must pass.
6. **Close out.** [`dod.md`](docs/booking-pilot-phase1/dod.md) for Definition of Done; [`final-summary.md`](docs/booking-pilot-phase1/final-summary.md) for the `BOOKING_PILOT_SUMMARY.md` template.
7. **Know when to stop.** [`escalation.md`](docs/booking-pilot-phase1/escalation.md) lists the 10 global escalation triggers. Pause and log to `BOOKING_PILOT_QUESTIONS.md` whenever one fires.

---

## Milestone map

| #    | File                                                                                           | Topic                                            |
| ---- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| —    | [00-context.md](docs/booking-pilot-phase1/00-context.md)                                       | Mission, hard rules, operating principles, reporting |
| —    | [appendices.md](docs/booking-pilot-phase1/appendices.md)                                       | Engine enum, block candidates, recipes, file map |
| A    | [phase-a-analysis.md](docs/booking-pilot-phase1/phase-a-analysis.md)                           | A1–A6 inventory + gap table                      |
| M01  | [m01-engine-types.md](docs/booking-pilot-phase1/m01-engine-types.md)                           | Engine + BlockTag type system                    |
| M02  | [m02-schema.md](docs/booking-pilot-phase1/m02-schema.md)                                       | Additive schema fields + Health collection      |
| M03  | [m03-recipes.md](docs/booking-pilot-phase1/m03-recipes.md)                                     | `functionId → engines` recipe table              |
| M04  | [m04-tag-blocks.md](docs/booking-pilot-phase1/m04-tag-blocks.md)                               | Tag Booking + shared blocks only                 |
| M05  | [m05-flow-templates.md](docs/booking-pilot-phase1/m05-flow-templates.md)                       | Booking flow templates (5 sub-verticals)         |
| M06  | [m06-health-checker.md](docs/booking-pilot-phase1/m06-health-checker.md)                       | Pure Health functions + rule-based fix proposals |
| M07  | [m07-health-storage.md](docs/booking-pilot-phase1/m07-health-storage.md)                       | Shadow-mode Health writes + cached reads         |
| M08  | [m08-admin-blocks-ui.md](docs/booking-pilot-phase1/m08-admin-blocks-ui.md)                     | Engine tabs in `/admin/relay/blocks`             |
| M09  | [m09-admin-health-ui.md](docs/booking-pilot-phase1/m09-admin-health-ui.md)                     | `/admin/relay/health` matrix + fix proposals     |
| M10  | [m10-intent-engine.md](docs/booking-pilot-phase1/m10-intent-engine.md)                         | `engineHint` + word-boundary keyword lexicon     |
| M11  | [m11-session-active-engine.md](docs/booking-pilot-phase1/m11-session-active-engine.md)         | Sticky `activeEngine` selection                  |
| M12  | [m12-orchestrator-policy.md](docs/booking-pilot-phase1/m12-orchestrator-policy.md)             | Engine-scoped catalog + telemetry                |
| M13  | [m13-preview-copilot.md](docs/booking-pilot-phase1/m13-preview-copilot.md)                     | Sandboxed scripted Preview Copilot               |
| M14  | [m14-onboarding.md](docs/booking-pilot-phase1/m14-onboarding.md)                               | 3-question deterministic recipe picker           |
| M15  | [m15-drafting.md](docs/booking-pilot-phase1/m15-drafting.md)                                   | Seed templates + generic CSV import              |
| C    | [phase-c-validation.md](docs/booking-pilot-phase1/phase-c-validation.md)                       | Unit / integration / smoke / regression / perf   |
| ✓    | [dod.md](docs/booking-pilot-phase1/dod.md)                                                     | Definition of Done checklist                     |
| 📄   | [final-summary.md](docs/booking-pilot-phase1/final-summary.md)                                 | `BOOKING_PILOT_SUMMARY.md` template              |
| ⚠️   | [escalation.md](docs/booking-pilot-phase1/escalation.md)                                       | Global escalation triggers (10 rules)            |

---

## Hard rules (full detail in [`00-context.md`](docs/booking-pilot-phase1/00-context.md))

1. **No new AI calls.** Deterministic code only. Seed content is authored data, not prompts.
2. **Backward compatibility.** All new fields optional with deterministic fallbacks.
3. **Additive schema only.** `tsc --noEmit` passes at every commit.
4. **Shadow-mode Health.** Computes and writes; never gates publish or runtime.
5. **Booking-only tagging.** No `engines: [...]` on non-Booking blocks this task.
6. **Do not delete `lib/relay-block-taxonomy.ts`.** Mark deprecated, leave in place.

---

## Reporting artifacts (create at repo root)

| File                              | Created    | Updated through     | Purpose                             |
| --------------------------------- | ---------- | ------------------- | ----------------------------------- |
| `docs/booking-pilot-analysis.md`  | Phase A    | Phase A only        | One-time analysis deliverable        |
| `BOOKING_PILOT_PROGRESS.md`       | Phase A    | Every milestone     | Append-only log, one block per milestone |
| `BOOKING_PILOT_QUESTIONS.md`      | First escalation | Every escalation | Append-only with resolution notes   |
| `BOOKING_PILOT_SUMMARY.md`        | After Phase C | Once, at end     | Final report                        |

Formats defined in [`00-context.md`](docs/booking-pilot-phase1/00-context.md) and [`final-summary.md`](docs/booking-pilot-phase1/final-summary.md).

---

**Begin with Phase A. Do not start M01 until `docs/booking-pilot-analysis.md` is committed.**
