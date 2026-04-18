# Engine Rollout — Phase 2 Tuning

Pre-flight decisions informing the per-engine milestones (Commerce, Lead, Engagement, Info) and the cross-cutting milestones (X01 Service overlay, X02 Lineage view, X03 Multi-engine refinement, X04 Drafting AI, X05 Gating cutover).

**Gate status note:** the Phase 2 playbook's pre-flight specifies reading production observation data from Phase 1's ≥ 1-week shadow-mode window. At the time this document is authored (2026-04-18), phase-c merged today — observation data does not exist yet. User explicitly requested Phase 2 start now; observation gate waived. This doc distinguishes **evidence-based** recommendations (static analysis, unit tests, code inspection) from **speculative** recommendations that need production evidence to confirm. Every speculative item is flagged explicitly — Phase 2's retrospective should revisit those once observation catches up.

---

## 1. Lexicon refinements

**Evidence from Phase 1:**

- **M10-tune surfaced during C2.2:** "cancel my reservation" misrouted to booking. Fix: added tiebreaker — when `service ∈ strongHits` AND ≥ 1 other engine also in strongHits, prefer service. Shipped.
- **Unit tests only — no production traffic sampled.** Every Phase 1 lexicon misfire is currently one that a unit test caught.

**Evidence-based recommendations for Phase 2:**

1. **Adopt the M10-tune pattern per engine.** Every new engine's lexicon (commerce, lead, engagement, info) will share the same structure: `strong` (full phrase matches) + `weak` (single-word triggers) + a tiebreaker rule against the ambient engine set.
2. **Name-tiebreaker policy must be explicit.** When a new engine's strong keyword overlaps with an existing engine's strong keyword, declare which wins in the per-engine M10 milestone's authoring notes. Don't defer tie-break discovery to C2.2-style integration tests.

**Speculative (needs observation data):**

3. **Booking lexicon production misfires** — `docs/booking-pilot-observation.md` will surface any once the 7-day window elapses. If any turn logs show `engineHint: <wrong>` for a partner's message where the operator meaningfully expected a different engine, that's a Phase 2 tuning input.
4. **"reservation" vs "booking" conflict in the existing booking-strong list** — no evidence yet of this being an ongoing issue, but M10-tune's tiebreaker depends on "my reservation" + "cancel" both firing. If observation shows messages matching "reservation" alone (no service verb) misrouting, the booking.strong list may need to separate "make a reservation" from bare "reservation."

**Carry into Phase 2 M10 per engine:** produce keyword lists with "if this overlaps with booking / service, which wins" declared up front. No more discovering tie-breaks via smoke.

---

## 2. Health threshold tuning

**Evidence from Phase 1:**

- M06 shipped with thresholds hardcoded in-code: `FIX_MATCH_THRESHOLD = 0.6`, `confidenceForScore` tiers at `0.85 / 0.7`, amber/red stage roll-up rules.
- Snapshot loaders (`loadBlockSnapshots`, `loadModuleSnapshots`, `loadFlowSnapshot`) in `relay-health-actions.ts` return **stubs** — production Health docs are currently red-with-no-data for every booking partner, because the snapshot layer isn't wired. This is an M07 debt.

**Evidence-based recommendations for Phase 2:**

1. **Wire the snapshot loaders before Phase 2 engines start shipping Health data.** Without this, every new engine's Health will also be red-with-no-data. Candidate milestone: a "Phase 2 M0" or a lightweight pre-step that fills in `loadBlockSnapshots` from the partner's actual `relayBlockConfigs` + field bindings. **~1 day of work.**
2. **Keep 0.6 fix-match threshold.** No production evidence that this is wrong. Revisit only if reviewers report high false-positive apply-fix suggestions.

**Speculative:**

3. **Amber/red stage boundaries** — only observable once snapshot loaders are wired. Right now every stage is "no blocks renderable" so every partner is red. Not a real signal.

**Carry into Phase 2:** **wire M07 snapshot loaders as the first Phase 2 task** (before or alongside Commerce M01). Otherwise every new engine ships into a broken Health surface.

---

## 3. Sticky engine behavior

**Evidence from Phase 1:**

- M11's `selectActiveEngine` + M12's `setActiveEngine` persistence: shipped, 14 unit tests (including 5-turn multi-turn integration test) all green.
- M10-tune service-overlay tiebreaker: shipped because the original ENGINES-tuple tiebreaker produced semantically wrong behavior for "cancel my reservation."
- **No multi-engine partners exist yet** — every current partner has `[booking, service]` or legacy-derived equivalents. Sticky behavior across *different* primary engines (hotel + restaurant, clinic + pharmacy) is **unexercised**.

**Evidence-based recommendations:**

1. **Keep the M11 rule set as-is for single-engine primaries.** 5-turn sticky test passes reliably.
2. **Multi-engine partners are the Phase 2 test surface.** X03 (Multi-engine refinement) is the milestone that'll reveal whether the current sticky rules hold up when a partner has both `booking` AND `commerce` active.

**Speculative:**

3. **Strong-hint threshold aggressiveness** — classifier currently treats ALL booking-strong keywords equally. Production evidence may show that some keywords (e.g., bare "book") need stricter context requirements to trigger a switch. None observed yet.

**Carry into Phase 2 X03:** this is exactly what X03 is for. No pre-engine work needed.

---

## 4. Catalog-size budget per engine

**Evidence from Phase 1 (static-verified at Phase C C2.3):**

| Engine | Observed typical catalog (scoped) | Spec budget | Verdict |
|---|---|---|---|
| Booking (hotels_resorts) | 18 blocks | ≤ 25 | ✓ |
| Booking (dental_care) | 14 | ≤ 25 | ✓ |
| Booking (hair_beauty) | 15 | ≤ 25 | ✓ |
| Booking (ticketing_booking) | 5 | ≤ 25 | ✓ |
| Booking (airport_transfer) | 5 | ≤ 25 | ✓ |

**Phase 2 per-engine targets (from the Phase 2 playbook's Appendix A):**

| Engine | Target catalog budget | Rationale |
|---|---|---|
| Commerce | ≤ 30 blocks | richer product surface (cart/checkout/orders + category/detail/compare) |
| Lead | ≤ 25 blocks | matches booking's discovery→conversion shape |
| Engagement | ≤ 20 blocks | smallest engine surface (donate/RSVP/subscribe) |
| Info | ≤ 15 blocks | no conversion; directory + status |
| Service overlay | ≤ 15 blocks | overlay, not full surface |

**Evidence-based recommendation:** adopt these budgets from the playbook. Every per-engine M01 verifies coverage against the budget via its C2.3-equivalent static check.

**Speculative:**

- **Whether these budgets actually produce acceptable Gemini prompt-token reductions** — needs production measurement. M12 telemetry log is the measurement surface (emits `catalogSizeBeforeEngineFilter` vs `catalogSize` per turn). Phase 2 M12-integration test should sample this for each new engine's first partner.

---

## 5. Drafting AI decision

**Evidence from Phase 1:**

- **Zero onboarding-friction data.** M14 shipped today; no operator has run it against a real partner yet.
- M15 seed templates: 5 templates × 5 items. Append-only. Operators can skip them entirely and rely on CSV import.
- No partner-reported "seed content is too thin / needs AI assistance" feedback (no time has elapsed to collect such feedback).

**Recommendation for Phase 2: DEFER to Phase 3.**

Rationale:
1. Phase 2's scope is engine coverage expansion — adding Drafting AI mid-expansion would compound risk.
2. The 5 hand-authored seed templates per booking sub-vertical are sufficient for pilot scale. Phase 2 should author equivalent hand-crafted seeds per new engine (X01 service + commerce/lead/engagement/info M07s) rather than introducing AI generation.
3. If operator feedback during Phase 2 reveals "seeds are too thin" is a real bottleneck, re-evaluate at Phase 2 mid-cycle (after X01 + 2 engines). Otherwise, ship Phase 3 with the explicit Drafting AI milestone as per the original three-phase plan.

**Trigger to reconsider mid-Phase-2:** if operator sentiment from X03 onwards consistently says "seeds don't get us 80% of the way there," pause Phase 2 and open an X04-in-flight discussion.

---

## 6. Gating cutover decision

**Evidence from Phase 1:**

- Health runs in shadow mode everywhere. No save-blocking, no runtime-gating.
- Snapshot loaders stubbed → every partner is red-with-no-data. **Flipping gating now would block every partner from saving anything.** Hard no.

**Recommendation for Phase 2: DEFER to Phase 3.** Non-negotiable until:
1. Snapshot loaders wired (Section 2 carry-forward)
2. At least 2 engines shipped on production with real Health signal (not stub data)
3. ≥ 2 weeks of shadow-mode data showing false-positive rate < 10%

**Trigger to reconsider mid-Phase-2:** only if observation data (Section 2 wire-up + the 7-day window) shows false-positive rate < 5% consistently. Even then, defer to Phase 3 unless operator pressure is explicit.

---

## 7. Phase 2 ordering + scope

**Playbook-recommended order:** Commerce → Lead → Engagement → Info, then X01 Service overlay alongside Commerce, X02 Lineage after all 4 engines, X03 Multi-engine refinement after X02, X04 Drafting AI decision (defer), X05 Gating cutover decision (defer).

**Pre-flight adjustments:**

1. **Add a "Phase 2 M0" snapshot-loader wire-up before Commerce M01.** Without this, every new engine ships into the same no-data-red Health state that booking currently has. Scope: fill in `relay-health-actions.ts` `loadBlockSnapshots` + `loadModuleSnapshots` + `loadFlowSnapshot` from real Firestore state. ~1 day. Blocks nothing downstream if deferred; makes Phase 2 less misleading if done first.

2. **Commerce first** (confirmed — has existing CART_BOOSTS orchestrator wiring, largest partner overlap, Service overlay pairs naturally with X01).

3. **Per-engine M01 validation includes the C2.3 catalog-size budget check for that engine** — adopt from Phase 1's pattern.

4. **Per-engine M10 MUST include the tiebreaker declaration** from Section 1 — don't repeat the C2.2 discovery pattern.

---

## 8. Risk register carry-forward

From `BOOKING_PILOT_SUMMARY.md` + `BOOKING_PILOT_QUESTIONS.md`:

| Phase 1 carry-forward | Phase 2 impact | Action |
|---|---|---|
| Snapshot loaders stubbed (M07 debt) | Every Phase 2 engine ships red-no-data Health | Phase 2 M0 before Commerce M01 |
| Preview sub-vertical id drift (Q3) | Engine scoping may mismatch partner data for travel/automotive/food_beverage | Phase 2 Commerce milestone fixes this en route |
| UI visual verification gap (Q6) | Same issue will recur for each new admin tab | Every per-engine M08-equivalent ships with before/after screenshots |
| M09 populate-module stub (Q7) | M09 for Commerce/Lead/Engagement/Info will need wiring | Generic: extend M15 seed action pattern to all engines |
| Full save-hook coverage (Q5) | Non-booking admin saves don't trigger Health recompute | Wire save-hook in relevant admin actions as each engine ships |
| C5 baseline gap | First real reduction measurement is Phase 2 multi-engine | X03 multi-engine refinement measures against telemetry |
| M12 degraded-mode genericness | May show up as operators complain about red-Health responses | X01 Service overlay milestone will add more traffic to degraded mode; revisit if feedback accumulates |

---

## 9. Summary of pre-flight decisions

| Decision point | Verdict | Basis |
|---|---|---|
| Lexicon refinements | Adopt M10-tune pattern per engine; declare tie-breaks up-front | Evidence from M10-tune |
| Health threshold tuning | Keep 0.6 / 0.85 / 0.7 thresholds | No counter-evidence |
| **Snapshot loader wire-up** | **DO FIRST (Phase 2 M0)** | M07 debt surfaced in Section 2 |
| Sticky engine behavior | Keep M11 rules; X03 will test multi-engine cases | Unit tests green; multi-engine unexercised |
| Catalog-size budgets | Adopt playbook's per-engine targets | Phase 1 booking scope already well under its 25-block budget |
| Drafting AI | **DEFER to Phase 3** | No evidence of need; compounds risk |
| Gating cutover | **DEFER to Phase 3** | Depends on snapshot-loader wire-up + observation data |
| Engine ordering | Commerce → Lead → Engagement → Info + X01 Service alongside Commerce | Playbook |

---

## 10. Open items (feed into `ENGINE_ROLLOUT_QUESTIONS.md` as work proceeds)

- **Q2 waived-observation-window** — carried forward; revisit observations at Phase 2 mid-cycle.
- **Snapshot loader wire-up scope** — confirm the data path to partner's field bindings before starting M0. Could surface edge cases in how partner data is shaped.

---

_Authored 2026-04-18 as part of Phase 2 pre-flight. Evidence base: Phase 1 summary + progress log + questions log + static analysis of M01–M15 code surface + M12 telemetry code inspection. No production observation data — see Q2._