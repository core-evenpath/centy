# Booking Pilot — Open Questions

Questions, escalations, and ambiguities surfaced during Booking Pilot execution.
Format: one block per entry. Status transitions to `resolved` when closed.

---

## Q1 — No unit-test runner installed    (2026-04-17)

**Status:** noted; proceeding with type-level verification only

**Trigger:** M01 acceptance criteria say "Guards have unit coverage
(smoke-level is fine)". `package.json` has no `vitest` / `jest` / `node:test`
runner, and no `test` script. The operating principle "No dependency
additions without justification" applies.

**Disposition:** `isEngine` / `isBlockTag` are trivial guards whose
correctness is visible at the call site and enforced by the exhaustive
`ENGINES` / `BLOCK_TAGS` tuples. Verification is via `tsc --noEmit`.
If/when a runner is introduced in a later milestone (likely alongside
M06 health-checker tests), add a quick smoke spec for the guards.

Not blocking.

---

## Q2 — Shared-block id drift + analysis-doc drift    (resolved in M04)

**Status:** resolved

**Trigger (session resume, M04 start):** the session-resume prompt expected
continuity with `docs/booking-pilot-analysis.md`, but merging the foundation
PR fast-forwarded 28 previously-unseen commits onto main. This produced two
drifts:

1. **Shared-block id drift.** The registry generator
   `scripts/extract-block-registry-data.js` had hardcoded shared-block ids
   `ecom_greeting`, `shared_suggestions`, `shared_nudge`, `ecom_promo`,
   `ecom_cart`, `shared_contact`. But the committed
   `_registry-data.ts` used un-prefixed ids (`greeting`, `suggestions`,
   `nudge`, `promo`, `cart`, `contact`). Runtime consumers
   (`src/components/relay/blocks/BlockRenderer.tsx` switch cases) match
   the un-prefixed names, confirming those are authoritative. The
   generator had been modified without regenerating the output (or the
   output had been hand-edited). Regenerating verbatim would have
   broken the runtime switch.

2. **Analysis-doc drift (A1).** `docs/booking-pilot-analysis.md` A1 listed
   hospitality booking blocks with prefixed ids (`hosp_availability`,
   `hosp_check_in`). Actual repo ids are un-prefixed (`availability`,
   `check_in`). A1 also omitted two hospitality booking blocks that
   exist in the registry (`venue_space`, `camping_unit`). This was
   stale research from the prior session's snapshot.

**Resolution (M04 commit):**

- Reconciled the generator's hardcoded `SHARED_BLOCKS_DATA` to the
  un-prefixed, runtime-authoritative ids.
- Added `engines: ['shared']` to all six shared blocks in the generator.
- Added `engines?: BlockTag[]` to `ServerBlockData` (generator template)
  and `VerticalBlockDef` (`_types.ts`).
- Added `engines: ['booking']` to 31 booking blocks across 7 verticals,
  including the two A1 omissions (`venue_space`, `camping_unit`).
- Regenerated `_registry-data.ts`; tsc clean; acceptance probe passes
  (37 tagged blocks, 0 mistakes, `getAllowedBlocksForFunction('hotels_resorts')`
  returns 18 tagged blocks).

A1 in the analysis doc is now stale but not inaccurate at the level of
what's-a-booking-block (the 31-item list supersedes it). Not updating A1
retroactively — the analysis doc is a point-in-time artifact; M04's
actual tagging is the source of truth going forward.

---

## Q3 — Block-tag coverage gap + preview-subvertical id drift    (partial at M05; carry forward)

**Status:** partially addressed at M05 via mapping; carry forward for
wider resolution in Phase 2

**Trigger (M05):** two related drifts surfaced when wiring
`BOOKING_FLOW_TEMPLATES`:

1. **Block-tag coverage gap.** M04 tagged booking blocks in 7 verticals
   (hospitality, healthcare, personal_wellness, travel_transport,
   events_entertainment, food_beverage, automotive). But the M03 recipe
   classifies ~15 additional functionIds as booking-primary whose source
   verticals are NOT in M04's scope — e.g., home-services
   (`plumbing_electrical`, `cleaning_housekeeping`, `pest_control`,
   `appliance_repair`, `laundry_drycleaning`), notary_compliance,
   full-service restaurants (`full_service_restaurant`, `bars_pubs`),
   automotive service (`vehicle_maintenance`, `car_wash`,
   `vehicle_rental`, `driving_education`), entertainment
   (`live_entertainment`, `luxury_adventure`), and
   `ev_infrastructure`. These have no booking-tagged blocks today.

2. **Preview sub-vertical id drift.** The admin preview's
   `_SUBVERTICALS` arrays use different ids than
   `src/lib/business-taxonomy/industries.ts`. Examples:
   - travel_transport: `ticketing_services` (preview) vs
     `ticketing_booking` (taxonomy); `airport_chauffeur` (preview) vs
     `airport_transfer` (taxonomy).
   - automotive: `new_vehicle_sales` (preview) vs `vehicle_sales_new`
     (taxonomy); `vehicle_service` (preview) vs `vehicle_maintenance`
     (taxonomy).
   - food_beverage: `beverage_cafe`, `bakery_desserts` in taxonomy vs
     different variants in the preview.
   - healthcare: mostly aligned but `general_practice` (preview) vs
     `primary_care` (taxonomy).
   This means `getAllowedBlocksForFunction(partner.functionId)` may
   return only shared blocks (no vertical match) for partners with
   taxonomy ids that don't match a preview sub-vertical id. This is
   pre-existing and not introduced by M04/M05.

**Resolution at M05:**

- Extended `BOOKING_FLOW_TEMPLATES` to map all 49 booking-primary
  functionIds (from the M03 recipe) to one of the 5 M05 templates by
  closest-fit (wellness-appointment for service-scheduling verticals,
  clinic-appointment for notary, ticketing for ev_infrastructure /
  luxury_adventure / live_entertainment).
- For partners whose vertical blocks are untagged (home services,
  restaurant reservations, automotive service, etc.), the flow
  template's stage-structure is still declared but the orchestrator
  (M12) will find zero matching vertical blocks and fall back to
  legacy behavior — graceful degradation.

**Carry-forward to Phase 2:**

- M04-equivalent pass for home_property, food_beverage (beyond
  table_reservation), full automotive, business_professional,
  public_nonprofit verticals — tag their booking blocks with
  `engines: ['booking']`.
- Reconcile preview sub-vertical ids to match business-taxonomy
  functionIds (or add an explicit alias map). This is a separate
  cleanup milestone, not Phase 1 scope.
- Revisit M05 template fit once those verticals have proper blocks.
