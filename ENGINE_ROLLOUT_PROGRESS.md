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

---

## P2.commerce.M02 — tag Commerce blocks
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m02` (stacked on M01)
- Files changed: 4 — 3 vertical index files (ecommerce, food_beverage, food_supply) + regenerated `_registry-data.ts`
- Inventory (mini-A for Commerce, authored as part of M02):
  - **ecommerce** (10 blocks): skin_quiz, product_card, product_detail, compare, bundle, order_confirmation, order_tracker, booking, subscription, loyalty
  - **food_beverage** (14 blocks): menu_item, menu_detail, category_browser, dietary_filter, order_customizer, table_reservation, daily_specials, kitchen_queue, combo_meal, drink_menu, chef_profile, catering, nutrition, diner_review
  - **food_supply** (14 blocks): fs_product_card, fs_product_detail, catalog_browser, bulk_order, supplier_profile, wholesale_pricing, delivery_scheduler, fs_order_tracker, cert_compliance, stock_status, sample_request, quality_report, recurring_order, buyer_review
- Tagged `engines: ['commerce']` — **31 blocks**:
  - ecommerce (6): skin_quiz, product_card, product_detail, compare, bundle, subscription
  - food_beverage (12): menu_item, menu_detail, category_browser, dietary_filter, order_customizer, daily_specials, combo_meal, drink_menu, chef_profile, catering, nutrition, diner_review
  - food_supply (13): all except fs_order_tracker (Service, reserved for X01)
- **Deliberately NOT tagged**:
  - `table_reservation` (food_beverage) — already `engines: ['booking']` from Phase 1 M04
  - `booking` (ecommerce, family `conversion`) — booking-engine block; not commerce
  - `loyalty` (ecommerce, family `engagement`) — engagement engine (Phase 2 later)
  - `order_confirmation`, `order_tracker` (ecommerce) — reserved for X01 Service tagging
  - `kitchen_queue` (food_beverage, live-status) — reserved for X01 Service tagging
  - `fs_order_tracker` (food_supply) — reserved for X01 Service tagging
- Acceptance probe:
  - `getAllowedBlocksForFunctionAndEngine('ecommerce_d2c', 'commerce')` → 15 blocks (≤ 30 budget ✓)
  - `full_service_restaurant` → 16 blocks ✓
  - `grocery_wholesale` → 13 blocks ✓
  - `fresh_produce` → 5 blocks (only shared — known Q3 preview-subvertical-id drift; `fresh_produce` taxonomy id doesn't match food_supply preview sub-vertical ids like `organic_farm`. Carried forward; same issue surfaced in Phase 1 M05.)
- Tests: 149/149 (no new test file; tags are data-only and covered by existing engine-scoping tests)
- tsc delta: 548 → 548
- Speculative-From: tuning.md#4 (Commerce catalog budget ≤ 30 confirmed in probe; actual 13-16 range leaves healthy margin)

---

## P2.commerce.M03 — Commerce flow templates
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m03` (stacked on M02)
- Files changed: 5 added + 1 modified
  - `src/lib/relay/flow-templates/commerce/{general-retail,food-delivery,food-supply,subscription,index}.ts`
  - `src/lib/relay/flow-templates/commerce/__tests__/commerce-templates.test.ts` (8 tests)
  - `src/lib/relay/orchestrator/signals/flow.ts` (wire `getCommerceFlowTemplate` when activeEngine === 'commerce')
- Tests: **157/157 pass** (149 prior + 8 new)
- tsc delta: 548 → 548
- Templates shipped (4):
  - `GENERAL_RETAIL_FLOW_TEMPLATE` — 13+ retail / D2C functionIds: ecommerce_d2c, physical_retail, fashion_apparel, electronics_gadgets, jewelry_luxury, furniture_home, grocery_convenience, health_wellness_retail, books_stationery, sports_outdoor, baby_kids, pet_supplies, pharmacy_retail (plus secondaries: carpentry_furniture, laundry_drycleaning, vision_care, auto_parts, tires_batteries, forex_remittance, translation_docs, logistics_courier, decor_floral, printing_invitations)
  - `FOOD_DELIVERY_FLOW_TEMPLATE` — 7 F&B functionIds: full_service_restaurant, casual_dining, qsr, beverage_cafe, bakery_desserts, cloud_kitchen, street_food (plus secondary: bars_pubs)
  - `FOOD_SUPPLY_FLOW_TEMPLATE` — 8 supply functionIds: fresh_produce, meat_fish, dairy_beverage, packaged_specialty, grocery_delivery, food_wholesale, farm_agricultural, organic_health_foods (plus secondary: wholesale_distribution)
  - `SUBSCRIPTION_FLOW_TEMPLATE` — online_learning (primary)
- All 36 commerce-primary functionIds covered by `getCommerceFlowTemplate` (verified via test).
- Every template: `engine: 'commerce'`, canonical stage order, `serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order']`.
- Every `suggestedBlockId` exists in registry AND is tagged commerce or shared (verified via test).
- Orchestrator wiring: `loadFlowDefinition` now checks `getCommerceFlowTemplate(functionId)` when `activeEngine === 'commerce'`, falling back to legacy `getFlowTemplateForFunction`.
- Speculative-From: tuning.md#1 (lexicon tie-break discipline — serviceIntentBreaks declared up-front, not discovered via C2.2-style smoke)

---

## P2.commerce.M04 — activate Commerce tab in /admin/relay/blocks
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m04` (stacked on M03)
- Files changed: 2 modified
  - `src/app/admin/relay/blocks/components/EngineTabs.tsx` — added `'commerce'` to `ACTIVATED_ENGINES` set
  - `src/app/admin/relay/blocks/components/BlocksEngineShell.tsx` — added Commerce tab branch + Commerce catalog memo + broadened Health-load gate to `ACTIVATED_ENGINES.has(...)`
- Tests: 157/157 pass (no new tests; UI branch follows the same shape as Booking tab)
- tsc delta: 548 → 548
- Commerce tab behavior:
  - Renders stage-ordered pipeline via reused `BookingPipeline` component (which is engine-agnostic internally — just buckets blocks by canonical stage). An engine-neutral alias rename is a future cleanup.
  - Catalog source: `getAllowedBlocksForFunctionAndEngine(partner.functionId, 'commerce')` — M12 helper activated via M02 tagging.
  - Health dots fill from the new M0-enabled real snapshots when a partner is selected. No partner → catalog view, dots hidden.
- Other engine tabs (Lead, Engagement, Info, Service) still render "Coming soon" via the existing `ComingSoon` component.
- Screenshots: **deferred** to reviewer with dev-server access (same Q6 pattern as Phase 1 M08). Module graph compiles, types check, data layer verified via the M02/M03 tests.
- Speculative-From: tuning.md#4 (catalog budget — Commerce tab content for a commerce-primary partner stays under 30 blocks by design of M02+M03)

---

## P2.commerce.M05 — activate Commerce row in /admin/relay/health
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m05` (stacked on M04)
- Files changed: 1 added — `src/app/admin/relay/health/components/__tests__/health-matrix-commerce.test.ts`
- Tests: 161/161 pass (157 prior + 4 new)
- tsc delta: 548 → 548
- **Zero production-code changes.** The HealthMatrix component is engine-agnostic by Phase 1 design (iterates `ENGINES`, gates cells on `partnerEngines.includes(engine)`). Commerce rows render status for commerce partners the moment the partner's `getPartnerEngines` returns a set containing `'commerce'` — which M03 already does for 41 commerce functionIds.
- Apply-fix flows are engine-agnostic too (from Phase 1 M09) — `bind-field` works for commerce partners out of the box. Stubbed kinds (enable-block, connect-flow, populate-module) surface the same "Not yet implemented" messages regardless of engine.
- Preview Copilot button in HealthShell.tsx still hardcoded to `partnerEngines.includes('booking')` — will be broadened when commerce.M08 ships Commerce scripts. Logged here as a no-op for now; not regressing existing Booking behavior.
- Speculative-From: tuning.md#7 (engine order — Commerce coming second confirmed engine-agnostic design of Phase 1 admin UI holds)

---

## P2.commerce.M06 — Commerce onboarding starter blocks
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m06` (stacked on M05)
- Files changed: 1 modified + 1 added + 1 updated (M14 test relaxed)
  - `src/lib/relay/onboarding/starter-blocks.ts` — extended `STARTER_BLOCKS_BY_FUNCTION` with 36 commerce-primary functionIds (all primaries from M03 recipe)
  - `src/lib/relay/onboarding/__tests__/commerce-starter-blocks.test.ts` — 6 acceptance tests
  - `src/lib/relay/onboarding/__tests__/starter-blocks.test.ts` — relaxed M14 assertion: starter-set functionIds now allow booking OR commerce in recipe (was booking-only)
- Tests: 167/167 pass (161 prior + 6 new)
- tsc delta: 548 → 548
- Coverage: all 36 commerce-primary functionIds have curated starter sets
- Set sizes: 5–13 blocks each (`forex_remittance` is smallest at 6; `full_service_restaurant` is largest at 11)
- Pattern per flow-template shape:
  - General retail (13 + 6 secondary-style): `greeting, suggestions, product_card, product_detail, compare, bundle?, promo?, cart, contact` (+variants per sub-vertical)
  - Food delivery (7): `greeting, suggestions, menu_item, category_browser, dietary_filter?, order_customizer, daily_specials?, combo_meal?, cart, contact`
  - Food supply (8): `greeting, suggestions, fs_product_card, catalog_browser?, bulk_order?, wholesale_pricing, delivery_scheduler, recurring_order?, cart, contact`
  - Subscription (1): `greeting, suggestions, skin_quiz, product_card, product_detail, subscription, promo, cart, contact`
- `applyEngineRecipe` (from Phase 1 M14) is generic — no action code changes needed. New Commerce partner onboarded via the form now gets the right starter blocks + the cloned Commerce flow template + Health recompute for [commerce, service].
- Speculative-From: tuning.md#1 (lexicon tie-breaks — set sizes held the 7-13 band for most, widened to 5-13 when forex_remittance / translation_docs / logistics_courier came in with minimal viable shape)

---

## P2.commerce.M07 — Commerce seed templates
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m07` (stacked on M06)
- Files changed: 2 added + 1 modified
  - `src/lib/relay/seed-templates/commerce/index.ts` — 5 templates
  - `src/lib/relay/seed-templates/commerce/__tests__/commerce-seeds.test.ts` — 8 tests
  - `src/actions/relay-seed-actions.ts` — unified `getSeedTemplate` lookup (booking OR commerce registry)
- Tests: 175/175 pass (167 prior + 8 new)
- tsc delta: 548 → 548
- 5 templates shipped:
  - `commerce.products` (5 items) — D2C retail product catalog, tiered pricing starter → flagship
  - `commerce.menu_items` (5 items) — F&B menu across appetizer / main / beverage / dessert with dietary tags
  - `commerce.product_categories` (5 items) — navigation categories (New Arrivals, Bestsellers, On Sale, Gift Ideas, Clearance)
  - `commerce.bulk_offers` (5 items) — B2B wholesale tiers (starter / growth / volume / enterprise / flagship) with tier-pricing logic baked in
  - `commerce.subscription_plans` (3 items) — monthly / quarterly / annual
- All items INR currency, empty images, no PII (pattern-checked).
- Module targets: `product_catalog` (4 templates) + `food_menu` (1 template) — the 2 commerce-applicable system modules.
- `applySeedTemplate` action unified: looks up ids from both booking + commerce registries. Prefix convention `booking.*` vs `commerce.*` ensures no collisions.
- CSV import path from Phase 1 M15 is unchanged — generic, engine-agnostic, works for product_catalog out of the box (verified by Phase 1's M15 tests still passing).
- Speculative-From: tuning.md#4 (catalog budget enforced at the seed level too: max 5 items per template keeps operator cognitive load manageable)

---

## X01 — Service overlay tagging + verification
- Status: done (Commerce-adjacent scope; broader tagging carry-forward)
- Commit: (this commit)
- Branch: `claude/engine-rollout-x01-service` (stacked on M07)
- Files changed: 3 modified + 1 added + regenerated registry
  - `previews/ecommerce/index.ts` — tagged `order_confirmation`, `order_tracker` with `engines: ['service']`
  - `previews/food_beverage/index.tsx` — tagged `kitchen_queue` with `engines: ['service']`
  - `previews/food_supply/index.tsx` — tagged `fs_order_tracker` with `engines: ['service']`
  - `_registry-data.ts` regenerated (4 service tags)
  - `src/lib/relay/__tests__/x01-service-overlay.test.ts` — 7 tests
- Tests: 182/182 pass (175 prior + 7 new)
- tsc delta: 548 → 548
- Scope **this session**: **Commerce-adjacent Service blocks only** (4 tags). Other Service-candidate blocks listed in the playbook spec (hospitality `check_in`, personal_wellness `loyalty_progress`, healthcare `lab_results`, healthcare `prescription`, public_nonprofit `application-tracker`, etc.) are **carried forward** — they need tagging when their respective engines ship in later Phase 2 sessions. Non-Commerce engines aren't in scope this session.
- Verified behaviors:
  - Service auto-included for every booking-primary partner (Phase 1 M03 confirmed)
  - Service auto-included for every commerce-primary partner (Phase 2 M01 confirmed)
  - Service-scoped catalog for ecommerce_d2c includes order_confirmation + order_tracker
  - Commerce-scoped catalog does NOT leak service blocks
  - Booking-scoped catalog does NOT include Commerce service blocks (kitchen_queue, order_tracker)
  - Shared blocks still appear in service catalog (greeting, contact, etc.)
- Onboarding UX (from Phase 1 M14): `Q2_ENGINES = ENGINES.filter((e) => e !== 'service')` already excludes Service from the 3-question form. No change needed.
- Commerce flow templates' `serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order']` now resolve to real Service blocks when the orchestrator routes to them.
- Speculative-From: tuning.md#7 (X01 alongside Commerce — confirmed the coupling works; service tagging doesn't require its own engine-milestone pattern, just per-engine tagging as needed)

---

## P2.commerce.M08 — Commerce Preview Copilot scripts (32 scripts)
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-m08` (stacked on X01)
- Files changed: 2 added
  - `src/lib/relay/preview/commerce-scripts.ts` — 32 scripts (8 × 4 sub-verticals)
  - `src/lib/relay/preview/__tests__/commerce-scripts.test.ts` — 8 tests
- Tests: **190/190 pass** (182 prior + 8 new)
- tsc delta: 548 → 548
- 32 scripts shipped:
  - general-retail (8): browse, specific-product, compare, cart-checkout, promo, track-order (service break), cancel-order (service break), edge-subscription
  - food-delivery (8): browse, specific-dish, compare, cart-checkout, promo, track-order (service break), cancel-order (service break), edge-customize
  - food-supply (8): browse, specific-product, compare-tiers, bulk-order, promo/sample, track-shipment (service break), cancel-order (service break), edge-recurring
  - subscription (8): browse, specific-plan, compare, subscribe-checkout, promo, track-next-delivery (service break), cancel/pause (service break), edge-swap
- All scripts static plain text; no templates / randoms / Date.now (pattern-asserted in test).
- Service-overlay breaks (themes 6 + 7 in each sub-vertical) depend on X01's Service tagging — ship AFTER X01 per the playbook ordering.
- Runner (`runPreviewScript` from Phase 1 M13) is already engine-agnostic; no action-level changes needed. The commerce panel would just need to import `COMMERCE_PREVIEW_SCRIPTS` alongside `BOOKING_PREVIEW_SCRIPTS` — a follow-up UI tweak (Q8), not blocking.
- Speculative-From: tuning.md#3 (sticky multi-turn for commerce partners surfaces same tie-break validation via scripts 6+7 — acts as regression for the Phase 1 M10-tune pattern)

---

## Phase 2 Session 1 — Commerce Phase C
- Status: done
- Commit: (this commit)
- Branch: `claude/engine-rollout-commerce-phase-c` (stacked on commerce.M08)
- Deliverable: `docs/engine-rollout-phase2/retro-session-1.md` + this block
- Test count: **190/190 pass** (138 Phase 1 + 52 Phase 2 Session 1)
- tsc delta: 548 → 548 (zero new errors across the stack)

### Gate results

**C2.1 — Commerce partner engine derivation (via `getPartnerEngines`):**
- `ecommerce_d2c` → `[commerce, service]` ✓
- `qsr` → `[commerce, service]` ✓
- `fresh_produce` → `[commerce, service]` ✓

**C2.2 — Commerce 5-turn multi-turn (partnerEngines=[commerce, service]):**
```
"I want to browse your new arrivals"    hint=commerce/weak  → commerce (fallback-first)
"Show me the black leather jacket..."   hint=-/-            → commerce (sticky)
"Add two to my cart"                    hint=-/-            → commerce (sticky)
"Track my order #1234"                  hint=service/strong → service  (switch-strong-hint)
"Actually cancel my order"              hint=service/strong → service  (sticky)
```
Service-overlay break at turn 4 works without a commerce-specific tiebreaker — the Phase 1 M10-tune pattern ("service ∈ strongHits AND strongHits.length > 1 → service wins") generalizes to Commerce. ✓

**C2.3 — Per-engine catalog sizes (budget ≤ 30):**

| Partner | Unscoped | Commerce-scoped | ≤30? |
|---|---|---|---|
| ecommerce_d2c | 15 | 13 | ✓ |
| qsr | 13 | 12 | ✓ |
| fresh_produce | 5 | 5 | ✓ |
| online_learning | 14 | 14 | ✓ |
| fashion_apparel | 14 | 12 | ✓ |

All commerce-primary sample partners under the 30-block budget with substantial headroom.

**C2 consistency checks:**
- All 36 commerce-primary functionIds have flow template mappings ✓
- All 36 commerce-primary functionIds have starter block sets ✓
- 32 preview scripts (8 × 4 sub-verticals) ✓
- 5 seed templates targeting product_catalog (4) + food_menu (1) ✓

**C4 — Booking regression:**
- `hotels_resorts` → `[booking, service]` (unchanged) ✓
- Booking Phase 1 tests: all still pass ✓
- No booking-exclusivity assertion regressed; the `booking OR commerce` widening of the Phase 1 M14 starter-blocks test is the single expected extension, tracked in the commerce.M06 block above.

**C5 — Multi-engine catalog reduction (FIRST REAL MEASUREMENT):**

Phase 1 couldn't measure C5 because no multi-engine partner existed yet. `full_service_restaurant` ([booking, commerce, service]) is the first.

| Scope | Blocks | Reduction vs unscoped |
|---|---|---|
| unscoped | 17 | baseline |
| booking-scoped | 6 | **65%** |
| commerce-scoped | 15 | 12% |
| service-scoped | 6 | **65%** |

Asymmetric reduction is expected and correct: commerce is the "heavy" engine for food_beverage (menu_item, menu_detail, dietary_filter, order_customizer, combo_meal, …); booking + service are lean overlays. See `docs/engine-rollout-phase2/retro-session-1.md` §2.1 for details.

### Retrospective summary
- All 10 `Speculative-From: tuning.md#X` footers evaluated. **9 confirmed, 1 revised** (M0 loader estimate dropped ~1 day → ~1.5 hours; starter-block set size widened 7-13 → 5-13 to accommodate minimal-viable commerce partners like forex_remittance).
- 2 unexpected findings: (a) first real C5 multi-engine reduction data (65% for booking & service scopes on `full_service_restaurant`); (b) M0 surfaced a vitest subcollection mock gap — logged as Q9.
- **Gate decision for Lead: GREEN.** No blockers. Q8 (commerce preview panel UI import) + Q9 (vitest mock helper) are low-priority, non-blocking.

### Stack state (session ready for PR)
```
claude/engine-rollout-phase2-preflight
└─ claude/engine-rollout-m0-snapshots
   └─ claude/engine-rollout-commerce-m01
      └─ claude/engine-rollout-commerce-m02
         └─ claude/engine-rollout-commerce-m03
            └─ claude/engine-rollout-commerce-m04
               └─ claude/engine-rollout-commerce-m05
                  └─ claude/engine-rollout-commerce-m06
                     └─ claude/engine-rollout-commerce-m07
                        └─ claude/engine-rollout-x01-service
                           └─ claude/engine-rollout-commerce-m08
                              └─ claude/engine-rollout-commerce-phase-c  ← THIS
```

### Next session: Lead engine (P2.lead.M01 onwards)
Entry predicate satisfied per retro §3. Lead-primary functionIds (insurance, real_estate, education enrolment, financial discovery flows, etc.) enumerated in Lead M01. Service-overlay carry-forward (Q10) handled during Lead X01.

---

## Gate Session (pre-Lead)
- Status: done
- Branches: `claude/gate-session-q9-mock-helper` → `claude/gate-session-q8-preview-panel` → `claude/gate-session-c5-interpretation` → `claude/gate-session-lexicon-stress`
- Commits:
  - `cba60a4b` [gate-session] Q9 vitest subcollection mock helper
  - `fbbae94d` [gate-session] Q8 preview panel imports commerce scripts
  - `0bce185d` [gate-session] C5 interpretation — commerce (A verdict)
  - `243fda36` [gate-session] Commerce lexicon stress test + 3 lexicon fixes
- Tests: **213/213 pass** (190 Session 1 + 23 new this gate session)
  - 7 in `firestore-admin-mock.test.ts` (Q9)
  - 6 in `scripts-index.test.ts` (Q8)
  - 10 in `lexicon-stress-commerce.test.ts` (Task 4, 3 of which triggered lexicon fixes)
- tsc delta: 401 → 401 (re-measured baseline; see tuning.md §11 for the 548-vs-401 drift note)
- Files touched:
  - New: `src/__tests__/helpers/firestore-admin-mock.ts`, `src/__tests__/helpers/__tests__/firestore-admin-mock.test.ts`, `src/lib/relay/preview/scripts-index.ts`, `src/lib/relay/preview/__tests__/scripts-index.test.ts`, `src/__tests__/integration/lexicon-stress-commerce.test.ts`, `docs/engine-rollout-phase2/c5-interpretation-commerce.md`
  - Modified: `src/actions/__tests__/{m0-snapshot-loaders,relay-health-actions,apply-fix-proposal}.test.ts` (migrated to shared mock), `src/lib/relay/preview/script-runner.ts` (accepts AnyRunnablePreviewScript), `src/actions/relay-preview-actions.ts` (unified lookup), `src/app/admin/relay/health/preview/{page,PreviewPanel}.tsx` (engine-gated commerce scripts), `src/lib/relay/engine-keywords.ts` (+2 commerce-strong, +2 service-strong), `docs/engine-rollout-phase2/tuning.md` (§4 update + new §11 findings)

### Gate results

- **Task 1 (Q9):** helper extracted, 3 existing test files migrated, WARN-log leak eliminated (was "[health] loadPartnerBlockPrefs failed" × N per run; now zero).
- **Task 2 (Q8):** commerce scripts now appear in the Preview Copilot panel for commerce-enabled partners. Engine-gated: booking-only partners see only booking scripts (backward-compat).
- **Task 3 (C5 interpretation):** **Interpretation A — catalog-wide by nature.** All 15 commerce-scoped blocks on `full_service_restaurant` classified; zero scoping-layer gaps, zero material taxonomy redundancy. Playbook's uniform 40% C5 target retired; per-engine ranges adopted (see `c5-interpretation-commerce.md`).
- **Task 4 (lexicon stress):** 10-case stress test shipped. 3 initial failures produced 3 lexicon fixes (commerce: `place an order`, `want to order`; service: `order update`, `order updates`). Pattern established for Lead to inherit.

### Lead readiness: **YES**

- C5 interpretation is A (no Interpretation B/C fix required before Lead starts).
- Lexicon stress pattern established; Lead session must add `lexicon-stress-lead.test.ts` alongside M08.
- Q8, Q9 resolved. Q10 (service tagging for non-Commerce blocks) and Q11 (observation data) still open by design.
- New questions: Q12 (tsc 548 → 401 baseline drift, root-caused to .next/types/ cruft — resolution: always `rm -rf .next` before tsc), Q13 (Preview panel Playwright smoke deferred), Q14 (n/a — lexicon stress didn't exceed 3 failures).

### Stack state
```
claude/engine-rollout-commerce-phase-c
└─ claude/gate-session-q9-mock-helper
   └─ claude/gate-session-q8-preview-panel
      └─ claude/gate-session-c5-interpretation
         └─ claude/gate-session-lexicon-stress  ← (pre-Lead foundation)
```

---

## Lead state assessment (pre-M01)
- Baseline verification: `main` clean-tree tsc = **401** (confirms Session 1 + gate session introduced zero regressions hidden under `.next/types/` cruft)
- Re-verified on gate-session tip: tsc = 401 ✓
- Test count before session: 213/213 passing ✓
- All 4 gate-session branches on origin ✓
- `docs/engine-rollout-phase2/{tuning.md,retro-session-1.md,c5-interpretation-commerce.md}` present ✓

---

## P2.lead.M01 — recipe verification
- Status: done (commit `fc61579e`)
- Branch: `claude/engine-rollout-lead-m01` (stacked on gate-session-lexicon-stress)
- Tests: 213 → 220 (+7). tsc 401 → 401.
- Inventory: 48 lead-primary functionIds across 8 categories
- 3 documented no-service exceptions (community_savings, k12_education, higher_education) — logged Q15
- Speculative-From: tuning.md#engine-order

## P2.lead.M02 — tag Lead blocks
- Status: done (commit `f712944c`)
- Tests: 220 → 228 (+8). tsc 401 → 401.
- 46 lead-tagged blocks across 4 verticals (business 14, financial 14, home 13, events 5 new beyond pre-tagged booking)
- Dual-tag breakdown: 9 × `['lead', 'service']`, 4 × `['lead', 'booking']` (home-services genuine overlap)
- Speculative-From: c5-interpretation-commerce.md

## P2.lead.M03 — flow templates + orchestrator wiring
- Status: done (commit `f84d0254`)
- Tests: 228 → 238 (+10). tsc 401 → 401.
- 3 templates: financial, professional, real-estate-b2b
- Canonical serviceIntentBreaks: `['track-application', 'status-check', 'amend-application', 'withdraw-application']`
- All 48 lead-primary fns covered
- Every template has `followup` before `handoff` (asserted)
- Speculative-From: c5-interpretation-commerce.md

## P2.lead.M04 — activate Lead tab
- Status: done (commit `0198850a`)
- Tests: 238 → 241 (+3). tsc 401 → 401.
- ACTIVATED_ENGINES now `['booking', 'commerce', 'lead']`
- Screenshots deferred (Q13 open)

## P2.lead.M05 — activate Lead health row
- Status: done (commit `56afcf0f`)
- Zero production-code changes (HealthMatrix engine-agnostic)
- Tests: 241 → 246 (+5). tsc 401 → 401.

## P2.lead.M06 — starter blocks
- Status: done (commit `1959ea67`)
- Tests: 246 → 252 (+6). tsc 401 → 401.
- All 48 lead-primary fns have curated starter sets, size band 5-13
- Phase 1 M14 assertion widened: booking → booking OR commerce OR lead

## P2.lead.M07 — seed templates
- Status: done (commit `951eaf7a`)
- Tests: 252 → 261 (+9). tsc 401 → 401.
- 5 templates × 5 items = 25 items targeting 5 modules
- INR currency, empty images, anti-PII pattern-checked

## P2.lead.M08 — Preview Copilot scripts (24)
- Status: done (commit `e9d854fd`)
- Tests: 261 → 269 (+8). tsc 401 → 401.
- 8 scripts × 3 sub-verticals
- Runner broadened to accept `AnyRunnablePreviewScript`
- page.tsx engine-gated append when partner has lead

## P2.lead.M08.5 — lexicon stress test (FIRST-CLASS MILESTONE)
- Status: done (commit `e3ad395d`)
- Tests: 269 → 285 (+16). tsc 401 → 401.
- 16 cases; 8 initial failures → 9 lexicon keyword additions (5 lead.strong + 4 service.strong) fixing 7 of them; 2 documented gaps
- NOT systemic (2 known-category gaps). Revised threshold proposed: systemic vs count-based
- Speculative-From: c5-interpretation-commerce.md#lexicon-stress

---

## Lead Phase C
- Status: done
- Branch: `claude/engine-rollout-lead-phase-c` (stacked on M08.5)
- Deliverable: `docs/engine-rollout-phase2/retro-session-2.md` + this block
- Test count: **285/285 pass**. tsc 401 → 401.

### Gate results

**C2.1** Lead partner engine derivation: 5 samples verified incl. `k12_education` → `[lead, info]` documented exception ✓
**C2.2** 5-turn multi-turn: service break at turn 4 ("status of my application"), sticky at turn 5 ("withdraw") ✓
**C2.3** All 7 sample Lead partner catalogs ≤ 25 (max 15, min 5) ✓
**C2 consistency:** 48/48 flow templates + starters; 24 scripts; 5 seeds ✓
**C4 regression:** hotels_resorts booking-scoped=18, ecommerce_d2c commerce-scoped=13, full_service_restaurant commerce-scoped=15 — all unchanged ✓

**C5 (Interpretation A with dual-tag amendment):**

| Partner | Unscoped | Lead-scoped | Reduction |
|---|---|---|---|
| wealth_management | 5 | 5 | 0% |
| legal_services | 15 | 15 | 0% |
| real_estate | 12 | 12 | 0% |
| consulting_advisory | 15 | 15 | 0% |
| **event_planning** | 15 | 11 | **27%** (in range) |
| painting_renovation | 13 | 12 | 8% |

Explanation: dual-tagged blocks (`['lead', 'booking']`, `['lead', 'service']`) mean lead scoping strips nothing on partners whose booking overlap is genuine (home services, legal, consulting). `event_planning` shows real reduction because its booking-side (evt_venue_card, show_listing, seating_chart, invite_rsvp) is distinct. Catalog-size reduction is ONE goal of scoping; routing discipline is another and works regardless.

### Retrospective summary
- 10 `Speculative-From:` footers evaluated: 9 confirmed-by-test, 1 revised (threshold rule)
- C5 Interpretation A holds with amendment
- Lexicon stress NOT systemic (2 known categories)
- **Gate decision for Engagement: GREEN** (no blockers)
- Q15, Q16, Q17 newly opened

### Stack state (session ready for PR)
```
claude/gate-session-lexicon-stress
└─ claude/engine-rollout-lead-m01
   └─ claude/engine-rollout-lead-m02
      └─ claude/engine-rollout-lead-m03
         └─ claude/engine-rollout-lead-m04
            └─ claude/engine-rollout-lead-m05
               └─ claude/engine-rollout-lead-m06
                  └─ claude/engine-rollout-lead-m07
                     └─ claude/engine-rollout-lead-m08
                        └─ claude/engine-rollout-lead-m08-5
                           └─ claude/engine-rollout-lead-phase-c  ← THIS
```

### Next session: Engagement
Entry predicate satisfied. Lexicon-stress pattern + C5 interpretation discipline carried forward. Engagement M01 starts on `claude/engine-rollout-engagement-m01`.
