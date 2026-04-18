# Engine Rollout — Phase 2 Session 1 Retrospective

Session: M0 + P2.commerce.M01–M08 + X01 Service overlay + Commerce Phase C.

Authored 2026-04-18 on branch `claude/engine-rollout-commerce-phase-c`, stacked on `claude/engine-rollout-commerce-m08`.

Scope: first Phase 2 session after pre-flight. Commerce engine shipped end-to-end; X01 tags Commerce-adjacent Service blocks only. Broader Service tagging (hospitality, healthcare, personal_wellness, public_nonprofit) carried forward to later sessions when those engines ship.

Test counts: Phase 1 closed at 138/138. Session added 52 new tests across 7 files → **190/190 pass**. `tsc` stayed flat: 548 → 548 (no new errors, no regressions). The 548 baseline is pre-existing (see Phase 1 Q4).

---

## 1. Speculative-From footer: confirm / revise

Every milestone this session carried a `Speculative-From: tuning.md#<section>` footer. Evaluated against Session 1 evidence:

| Commit | Tuning section | Prediction | Evidence from this session | Verdict |
|---|---|---|---|---|
| M0 | §2 Health threshold tuning | Wiring snapshot loaders ~1 day of work; every engine ships red-no-data without it | Shipped in ~1h implementation + 30min testing. `loadPartnerBlockPrefs` subcollection call requires Firestore admin shape the vitest mock didn't cover — surfaced as a WARN log in `relay-health-actions.test.ts` but doesn't fail any test. Production behaviour unchanged. | **Confirmed, revise est.** Loader wire-up is cheaper than predicted. Keep it as M0 for every future session. Add a vitest mock helper for nested subcollections before Lead M0-equivalent. |
| commerce.M01 | §1 Lexicon (M10-tune per engine) | Every new engine needs tie-break declared up-front | Commerce.M01 was pure coverage verification — the tie-break between commerce-strong ("cart") vs service-strong ("track my order") resolved naturally via the existing M10-tune rule from Phase 1. No commerce-specific tie-break needed. | **Confirmed with surprise.** The Phase 1 tiebreaker generalizes: "service ∈ strongHits AND strongHits.length > 1 → service wins" covers commerce too. Lead / Engagement / Info should test against this rule first before adding engine-specific overrides. |
| commerce.M02 | §4 Catalog-size budget (≤30) | Need to verify coverage doesn't exceed 30 blocks per partner | Static measurement (C2.3) recorded below. Biggest commerce partner is `full_service_restaurant` at 15 commerce-scoped blocks (17 unscoped). Well under 30. | **Confirmed with margin.** Commerce's catalog is smaller than the budget predicted. Lead / Engagement / Info budgets (≤25 / ≤20 / ≤15) are probably also generous — verify per engine, don't relax. |
| commerce.M03 | §7 Phase 2 ordering | Commerce first; flow templates mirror Phase 1 booking pattern | 4 flow templates shipped (general-retail, food-delivery, food-supply, subscription); `serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order']` pattern emerged naturally. 36 functionId → template mappings cover all commerce-primary functions. | **Confirmed.** The `serviceIntentBreaks` array is new in Phase 2 (Phase 1 bookings also break to service but implicitly via M11 sticky). This is now the pattern future engines should adopt. |
| commerce.M04 | §7 (Commerce tab in /admin/relay/blocks) | Zero production code changes; BlocksEngineShell is engine-agnostic | Only change was adding `'commerce'` to `ACTIVATED_ENGINES` and broadening the health-load gate. BookingPipeline.tsx body works unchanged for commerce partners. | **Confirmed.** The engine-agnostic design from Phase 1 M08 pays off exactly as designed. Lead / Engagement / Info tab activations are now 2-line changes. |
| commerce.M05 | §7 (Commerce row in /admin/relay/health) | Zero production code changes; HealthMatrix iterates ENGINES tuple | Confirmed — 4 regression tests lock in behaviour; no production change. | **Confirmed.** Health UI is the most engine-agnostic surface in the system. |
| commerce.M06 | §1 Lexicon extension to onboarding | 36 commerce-primary functionIds need starter-block sets | Shipped 36 sets, sizes 5–13. Set size band had to widen from the initially speculative 7–13 because `forex_remittance`, `translation_docs`, `logistics_courier` (minimal-viable commerce shape) came in at 5–6 blocks. | **Revise.** Starter set size is 5–13, not 7–13. Future engine M06 tests should assume 5–13 band until proven narrower. Relaxed Phase 1 M14 `booking-only` assertion to `booking OR commerce` — this expected extension was the single place Phase 1 pinned engine exclusivity. |
| commerce.M07 | §4 Catalog budget at seed level | ≤5 items per template keeps operator cognitive load manageable | 5 templates × avg 5 items each (23 total); INR currency, empty images, no PII. Unified `getSeedTemplate` lookup in `relay-seed-actions.ts` falls through booking → commerce registry. Prefix convention `booking.*` / `commerce.*` prevents id collisions. | **Confirmed.** The unified-lookup pattern is the template for every future engine. Lead seeds will be `lead.*`, Engagement `engagement.*`, etc. |
| X01 | §7 X01 alongside Commerce | Service overlay tagging doesn't need its own engine milestone — just per-engine tagging as needed | Tagged 4 blocks across the 3 Commerce verticals (order_confirmation, order_tracker, kitchen_queue, fs_order_tracker). Service auto-inclusion verified for all booking + commerce partners. Cross-engine catalog isolation verified (commerce scope excludes service blocks; service scope includes Commerce-tagged Service blocks + shared; booking scope excludes Commerce service blocks). | **Confirmed with scope note.** X01 shipped Commerce-adjacent only. Broader tagging (hospitality check_in, healthcare lab_results, personal_wellness loyalty_progress, public_nonprofit application-tracker) explicitly carried forward. Treat Service tagging as a per-engine co-requisite instead of a single X01 milestone. |
| commerce.M08 | §3 Sticky engine behavior (multi-turn) | 32 preview scripts acts as regression for M10-tune pattern | 8 × 4 sub-verticals. Themes 6 (track-order) + 7 (cancel-order) in every sub-vertical exercise the service-overlay break. No template interpolation, no Date.now, all static text (pattern-asserted). Runner is engine-agnostic. | **Confirmed.** The commerce preview panel needs a UI tweak to import `COMMERCE_PREVIEW_SCRIPTS` alongside `BOOKING_PREVIEW_SCRIPTS` — logged as Q8 (non-blocking). |

---

## 2. Unexpected findings

### 2.1 First real multi-engine reduction measurement (C5)

Phase 1 couldn't measure C5 reduction on a multi-engine partner because none existed yet. `full_service_restaurant` is the first partner in the repo whose `FUNCTION_TO_ENGINES` maps to 3 engines `[booking, commerce, service]`.

Measured catalog sizes:

| Scope | Blocks | Reduction vs unscoped |
|---|---|---|
| unscoped (all blocks a 3-engine partner might touch) | 17 | baseline |
| booking-scoped | 6 | **65%** |
| commerce-scoped | 15 | **12%** |
| service-scoped | 6 | **65%** |

Interpretation:
- **The reduction is real** — a restaurant operator viewing the booking tab sees 6 blocks instead of 17. This was the entire point of engine scoping (Phase 1 §C5 predicted but couldn't measure it).
- **Asymmetric reduction across engines is expected.** Commerce is the "large" engine for food_beverage (most blocks live here: menu_item, menu_detail, dietary_filter, order_customizer, combo_meal, etc.), so commerce scope retains 15. Booking + Service are lean overlays (table_reservation on booking; kitchen_queue on service), so they compress heavily.
- **Single-engine partners get 0% reduction**, which is correct — if a partner has only commerce + service and you scope to commerce, there's nothing to strip. This shows up for `ecommerce_d2c` (13/15 = 13%, which is just the 2 service blocks filtered out).

Implication for future sessions: **C5 should report reduction for multi-engine partners as a matter of course.** For `full_service_restaurant` the booking and service catalogs are 2.5× smaller than unscoped — this validates the design and will extend to Lead + Engagement + Info partners that overlap.

### 2.2 M0 snapshot loader surfaced a vitest mock gap

When M0 wired `loadPartnerBlockPrefs`, the vitest Firestore admin mock returned a mocked `doc` that doesn't support `.collection()` for subcollection reads. The production path works (real Firestore admin supports `partners/{pid}/relayConfig/{blockId}` subcollections), but the existing `relay-health-actions.test.ts` emits a WARN for partner `p1`.

Not a test failure (the tests pass), but a gap future engine M0-equivalents will hit. Action: before Lead session starts, add a subcollection-aware mock helper to the Firestore admin stub used by `relay-health-actions.test.ts`. ~30min of work. Logged as **Q9** below.

### 2.3 Health shadow-mode "red-no-data" is no longer universal

Pre-M0: every partner's Health docs shadow-wrote `confidenceScore: 0, confidence: 'red'` because `loadBlockSnapshots` returned `[]`. Post-M0: partners with any `relayConfig/*` docs now get real signal (confidence reflects actual field-binding resolution). Partners with no relay config at all are still red-no-data — and that's the correct signal.

Implication: **the "observation window" gating from pre-flight §2 is now actually meaningful.** A Phase 2 mid-cycle Health snapshot will have real false-positive vs true-positive ratios to reason about. Before M0 this would have been noise.

---

## 3. Gate decision for Lead

Phase 2 Session 2 = Lead engine (per playbook ordering: Commerce → Lead → Engagement → Info).

### Entry checks
- ✅ M0 snapshot loaders wired (predicate for every engine's Health to be meaningful)
- ✅ Commerce end-to-end coverage shipped (M01–M08) + Phase C green
- ✅ X01 Service overlay tagging pattern validated on Commerce; can repeat per-engine for Lead's Service-candidate blocks (lead qualification-follow-up, demo-booking confirmation, etc.)
- ✅ Test count trending up, tsc flat — no blocking regressions
- ✅ Engine-agnostic UI surfaces (BlocksEngineShell, HealthMatrix) confirmed to extend cleanly
- ✅ Unified `getSeedTemplate` pattern ready for `lead.*` templates

### Open items before Lead starts (non-blocking but worth addressing)
- **Q8 Commerce preview panel UI import** — wire `COMMERCE_PREVIEW_SCRIPTS` into the admin preview panel alongside `BOOKING_PREVIEW_SCRIPTS`. ~15min. Can ship mid-Lead-session.
- **Q9 Vitest subcollection mock helper** — ~30min. Do before Lead M0-equivalent kicks off to avoid repeating the M0 WARN pattern.

### Gate verdict: **GREEN for Lead.** No blockers.

---

## 4. Open questions + follow-ups (feed into `ENGINE_ROLLOUT_QUESTIONS.md`)

| # | Question | Source | Priority |
|---|---|---|---|
| Q8 | Commerce preview panel needs UI tweak to import commerce scripts alongside booking scripts (non-blocking) | commerce.M08 | Low — can ship in Session 2 |
| Q9 | Vitest subcollection mock helper — upgrade the admin Firestore stub to support nested `.collection()` | M0 | Low — do before Lead M0 |
| Q10 | Carry-forward Service tagging for non-Commerce blocks (hospitality `check_in`, healthcare `lab_results`, personal_wellness `loyalty_progress`, public_nonprofit `application-tracker`) | X01 | Medium — handle per-engine as those engines ship |
| Q11 | Observation window data needed to confirm Session 1's evidence-based decisions | Phase 2 pre-flight §Q2 | Long-running — revisit mid-Phase-2 per the waived-observation caveat |

---

## 5. Lead starts when:
- Q9 (vitest mock helper) is landed on a new branch (optional — Lead can work around it like Commerce did)
- Retro is committed + pushed as part of `claude/engine-rollout-commerce-phase-c`
- PR opened for the Phase 2 Session 1 stack (M0 → commerce.M01–M08 → X01 → Phase C retro)

User confirms readiness → begin Lead M01 on `claude/engine-rollout-lead-m01`, stacked on the merged Session 1 stack.
