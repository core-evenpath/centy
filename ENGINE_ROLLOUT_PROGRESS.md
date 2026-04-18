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

---

## M0 — Snapshot loaders wire-up
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-m0-snapshots` (stacked on pre-flight)
- Files changed: 1 modified + 1 added
  - `src/actions/relay-health-actions.ts` — replaced stub `loadBlockSnapshots`, `loadModuleSnapshots`, `loadFlowSnapshot` with real-state readers
  - `src/actions/__tests__/m0-snapshot-loaders.test.ts` — 5 integration tests exercising the new paths through `recomputeEngineHealth`
- LOC: +225 src / +210 tests
- Tests: **143/143 pass** (138 prior + 5 new)
- tsc delta: 548 → 548 (zero new errors)
- Data path:
  - Blocks: `ALL_BLOCKS_DATA` (static, engine-tagged from M04) ∩ `relayBlockConfigs` (global `fields_req`/`fields_opt`) ∩ `partners/{pid}/relayConfig/{blockId}` (partner `isVisible` + `fieldBindings`)
  - Modules: `moduleAssignments` → `systemModules.schema` + `partners/{pid}/businessModules/{moduleId}/items` count
  - Flow: `partners/{pid}/relayConfig/flowDefinition` with `stages[].blockTypes[]`
- Approximations made explicit:
  - `resolvedNonEmpty` for a bound field is `true` when a binding record exists (no round-trip to the actual item). Rationale: cheap, and M06's empty-module detection already catches the "connected module has no items" case.
  - `type: 'string'` default on field bindings; actual type mapping from `ModuleFieldType` happens in the module catalog path.
- Phase 1 contract: verified via existing health-actions test suite still passing (12/12), and the broader Phase 1 Booking test suite untouched.
- Speculative-From: tuning.md#2 (Section 2 predicted ~1 day; shipped in ~1 hour of implementation + 30 minutes of testing).

---

## P2.commerce.M01 — recipe verification
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m01` (stacked on M0)
- Files changed: 1 added — `src/lib/relay/__tests__/engine-recipes-commerce.test.ts` (6 tests)
- Tests: **149/149 pass** (143 prior + 6 new)
- tsc delta: 548 → 548
- Audit result:
  - **36 commerce-primary functionIds** (engines[0] === 'commerce'): retail + ecommerce core (ecommerce_d2c, physical_retail, fashion_apparel, etc.), food_beverage quick-service (qsr, cafe, bakery, cloud-kitchen, street-food), food_supply (all 8), and extras (auto_parts, forex_remittance, online_learning, pharmacy_retail, translation_docs, printing_invitations)
  - **5 commerce-secondary functionIds**: bars_pubs, carpentry_furniture, full_service_restaurant, laundry_drycleaning, vision_care
  - **Zero drift**: every commerce functionId has `service` co-included (overlay rule from Phase 1 M03). No fixes needed.
- Booking-primary unchanged (backward-compat assertion): hotels_resorts, dental_care, hair_beauty, ticketing_booking, etc. all still booking[0]=booking.
- Speculative-From: tuning.md#7 (engine ordering — Commerce first was the correct choice; recipe already covers the commerce universe cleanly)
