# Engine Rollout — Phase 2 Progress Log

One block per milestone. Format matches the Phase 1 pattern in `BOOKING_PILOT_PROGRESS.md`.

Phase 1 closed 2026-04-18 via PR #142 + close-out PR. Phase 2 pre-flight started the same day under a **waived observation window** (see `ENGINE_ROLLOUT_QUESTIONS.md` Q2). Evidence-based decisions ship; observation-dependent decisions are marked speculative in `docs/engine-rollout-phase2/tuning.md` and revisited at mid-cycle.

---

## Phase 2 — Pre-flight

- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-phase2-preflight`
- Deliverable: `docs/engine-rollout-phase2/tuning.md`
- Notes:
  - Waived-observation caveat: phase-c merged 2026-04-18; observation window just started, earliest completion 2026-04-25. User requested Phase 2 start now. Tuning doc distinguishes evidence-based from speculative recommendations.
  - **Surfaced a load-bearing debt:** M07 snapshot loaders are stubbed (`loadBlockSnapshots`, `loadModuleSnapshots`, `loadFlowSnapshot` in `relay-health-actions.ts` all return empty data). Every partner's Health shadow-writes "red-with-no-data." Every new Phase 2 engine would ship into the same broken state. **Fix as Phase 2 M0 before Commerce M01.** Estimated ~1 day.
  - Drafting AI (X04): **defer to Phase 3** — zero onboarding-friction data; 5 hand-authored booking seeds are sufficient for pilot scale; adding AI mid-expansion compounds risk.
  - Gating cutover (X05): **defer to Phase 3** — depends on snapshot loader wire-up + ≥ 2 engines in production + ≥ 2 weeks of false-positive data.
  - Engine ordering confirmed: Commerce (primary) → Lead → Engagement → Info. X01 Service overlay alongside Commerce. X02 Lineage after all 4 engines. X03 Multi-engine refinement after X02.
  - Carry-forward from Phase 1: 7 open questions (Q3 drift, Q4 pre-existing tsc, Q5 save-hook, Q6 UI verification, Q7 M09→M15 wiring), all non-blocking.
- Hard-gate status:
  - `BOOKING_PILOT_SUMMARY.md` exists ✓
  - `BOOKING_PILOT_PROGRESS.md` closed ✓
  - `docs/booking-pilot-analysis.md` ✓
  - `ENGINE_ROLLOUT_QUESTIONS.md` initialized ✓ (Q1 resolved, Q2 open waived-observation)
  - `ENGINE_ROLLOUT_PROGRESS.md` initialized ✓ (this doc)
  - Observation window: **waived, revisit mid-cycle**
