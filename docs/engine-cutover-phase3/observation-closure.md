# Observation window closure criteria

Session: Phase 3 pre-flight v3, Task 2.

## Context

Phase 2 pre-flight (Session 1 playbook) set observation-window gating for X05 (Health gating cutover):

> "≥ 1 week of production observation showing Health precision and no regressions on real partner traffic"

Q2 flagged this window as waived at Phase 2 start ("observation not available; pilot was shadow mode only"). Q11 carried it forward as "long-running" through every Phase 2 session.

Phase 3 pre-flight needs to decide what "observation closure" actually means now, given:
- **No production partners today** (confirmed in Phase 3 pre-flight context)
- Phase 2 shipped shadow-mode Health + engine scoping across all 5 primary engines
- Partner Preview Copilot scripts (104 total across engines) + X03 multi-engine tests exercise the runtime without production traffic

## Three closure models

### Model A — Time-based (N days since Phase 2 close)

"Observation closed when X days pass after Phase 2 merged to main."

**Assessment:** Fails the sanity check. Time without traffic measures nothing. A week of no production traffic is zero information. **Not defensible** given the "no production partners" context.

### Model B — Evidence-based (defined signals)

"Observation closed when a fixed set of signals all verify."

Candidate signals:

| Signal | Current status |
|---|---|
| M0 Health snapshot loaders return expected shapes across all 5 engines | ✓ verified by Session 1 M0 wiring + engine-specific Phase C tests |
| `relayEngineHealth/{partnerId}_{engine}` documents populate correctly when `recomputeEngineHealth` runs | ✓ verified via `relay-health-actions.test.ts` (12 tests) + M0 integration tests |
| X03 multi-engine sticky tests pass cleanly across 3+ engine partners | ✓ verified (13 integration tests, all passing at Phase 2 close) |
| Preview Copilot scripts (104 across all engines) run without orchestrator error | ✓ pattern-verified (every engine's M08 tests assert script shape + no template interpolation) |
| Health shadow-mode writes don't block saves in any engine | ✓ Phase 1 M07 contract explicitly tested; preserved through all Phase 2 milestones |
| Orchestrator's `recomputeEngineHealth` is idempotent and non-blocking | ✓ verified by `triggerHealthRecompute` test suite |
| Cross-engine routing doesn't mis-attribute Health writes | ✓ implicit — X03 confirms sticky + classifier scale; engines get their own health docs keyed by engine |

**Assessment:** Every signal already verifies green as of Phase 2 close. **The window is closed today by Model B criteria.** The "observation" function was served by the test suite + Phase C gates per engine, not by production traffic.

### Model C — Hybrid (evidence + time buffer)

"Observation closed when Model B signals verify AND N days pass as sanity buffer for drift catch."

Candidate buffer: 2 weeks between Phase 2 close (merged 2026-04-19) and Phase 3 Session 1 start. By the time Session 1 executes this's likely to be the case regardless — pre-flight + admin reset page sessions take days of elapsed time.

**Assessment:** Defensible but the time component adds no information beyond Model B. Time-boxes a natural process (the gap between pre-flight and Session 1) as if it were a measurement. If the user wants a belt-and-braces discipline, this adds very low cost; if they want efficiency, Model B alone is enough.

## Recommendation

**Model B.** The test suite + Phase C gates are the observation surface. Production observation was waived at Phase 2 start (Q2) and no production partners have appeared since. A time buffer (Model C) adds belt-and-braces rigor but no new information. A pure time gate (Model A) doesn't measure anything real.

## Closure verification today

Running through the Model B signals against current main (HEAD `244261a`, tsc baseline 276 after baseline-investigation merges):

- [x] M0 snapshot loaders — verified by `m0-snapshot-loaders.test.ts` (5 tests green)
- [x] Health doc writes — verified by `relay-health-actions.test.ts` (12 tests green)
- [x] X03 multi-engine — verified by `multi-engine-refinement.test.ts` (13 tests green)
- [x] Preview Copilot scripts — 4 engines × 24 scripts + booking's 40 = 136 scripts, all static-verified
- [x] Health shadow-mode non-blocking — verified by swallows-all-errors tests
- [x] recomputeEngineHealth idempotent — verified by repeated-call tests
- [x] Cross-engine Health key isolation — verified by cache-scoped tests

**All 7 signals green. Observation closed by Model B criteria.**

## Consequence for X05 timing

X05 gating cutover no longer blocks on observation. Whether X05 ships before/after/parallel with X04 is now purely a sequencing decision, not a data-collection decision. Covered in `x05-timing-decision.md`.

## Recommendation summary

- **Adopt Model B** for Phase 3.
- **Record observation window closed** in `CUTOVER_PROGRESS.md` with the 7 signals listed above.
- **Q11 transitions to "resolved"** in the next session's questions-log update.
- **Q2 (waived observation) transitions to "resolved — superseded by Model B closure"**.
