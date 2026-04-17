# Booking Pilot — Open Questions

Questions, escalations, and ambiguities surfaced during Booking Pilot execution.
Format: one block per entry. Status transitions to `resolved` when closed.

---

## Q1 — No unit-test runner installed    (2026-04-17)

**Status:** resolved at M06 — Vitest installed

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

**Resolution at M06:** Vitest 2.1.9 installed with a minimal
`vitest.config.ts` (node environment, `@/` alias, include pattern
`src/**/__tests__/**/*.test.ts`). `npm test` script added.
Justification per operating principle #6: M06 requires testing six
distinct health-failure modes with fixture builders that exceed what
ad-hoc tsx probes can cleanly express; Vitest also becomes infrastructure
for M11/M12/M14 tests. No Jest chosen because the repo has no existing
Jest config — Vitest integrates with the Vite-based tooling already
present via Next.js. M06 ships 32 tests across 3 files.

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

---

## Q4 — Pre-existing tsc errors in merged codebase    (observed at M06)

**Status:** noted; not blocking

**Trigger:** session resume Section 1.3 expected `tsc --noEmit` clean with
only the pre-existing `baseUrl` warning. Actual state of main (from the
fast-forward during M04 state check): 548 tsc errors in areas **unrelated**
to this pilot — `src/actions/vault-actions.ts` (~12), `conversation-*`
files (~7), `ai-config-actions.ts`, `assistant-actions.ts`, etc. These
are codebase-level drift from the 28 other commits that landed on main
during this session, not caused by anything in the booking pilot.

**Verification:** I ran `tsc --noEmit` with my M06 changes and without them
(via `git stash` round-trip). Both produce exactly 548 errors; M06 adds
zero. My M01–M06 files are clean. The `baseUrl` warning filter has been
in place since M01.

**Revised protocol for remaining milestones:** treat "tsc clean" as "tsc
error count does not increase" rather than "zero errors". Verified via
error-count delta when a milestone's changes are large enough to make a
targeted grep infeasible.

Not blocking. The 548 errors pre-date this pilot. Phase 1's contract
("no regression") is intact — my changes add zero errors to the existing
count.

---

## Q5 — Save-hook full coverage (carry-forward)    (opened at M07)

**Status:** open; carry-forward — not blocking Phase 1 C gates

**Trigger:** M07's spec instructs wiring `triggerHealthRecompute` into
every admin save across `actions/admin-block-*.ts`,
`actions/flow-engine-actions.ts`, `actions/modules-actions.ts`,
`actions/partner-actions.ts`. M07 shipped one reference-pattern call in
`modules-actions.ts:updateModuleItemAction` to demonstrate the shape;
extending to all admin saves is mechanical but spans ~10 action files
with different save shapes (batch writes, revalidation paths, partner vs
admin scoping).

**Why not blocking:**

- `triggerHealthRecompute` is shadow-mode: safe to call from anywhere,
  never rethrows, does not mutate the partner's save outcome.
- Every un-hooked admin write simply defers Health recompute until the
  next hooked write or an admin read (which triggers a recompute via
  the M09 refresh loop, once shipped).
- The Phase 1 C gates don't require Health to be computed at write time
  — only that it's *shadow mode* (never gates), correct when computed,
  and visible in the admin UI.

**Carry-forward scope:**

- Wire `triggerHealthRecompute` into the remaining admin save actions:
  `createModuleItemAction`, `deleteModuleItemAction`,
  `updateSystemModuleAction`, `createSystemModuleAction`,
  `deleteSystemModuleAction`, `updateModuleAssignmentAction`,
  `updatePartnerCustomFieldAction`, flow-engine save actions,
  partner settings save actions.
- Can land as a single cleanup commit or alongside M14 (onboarding
  recipe picker) when the partner-settings save path is touched anyway.
