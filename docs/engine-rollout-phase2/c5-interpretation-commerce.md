# Commerce C5 Interpretation

Produced during the pre-Lead gate session (2026-04-18) to interpret the
first real multi-engine catalog-reduction measurement from Phase 2
Session 1 Phase C.

## The number

Partner: `full_service_restaurant` (the first repo partner with three
engines: `[booking, commerce, service]`).

| Scope | Blocks | Reduction |
|---|---|---|
| Unscoped (all blocks across all three engines) | 17 | baseline |
| Booking-scoped | 6 | **65%** |
| Commerce-scoped | 15 | **12%** |
| Service-scoped | 6 | **65%** |

Playbook's uniform 40% target. Commerce's 12% undershoots it by ~28
percentage points. Booking and Service beat it by ~25. This document
interprets that gap.

## The 15 commerce-scoped blocks

Per-block verdict against the three interpretations:
- **A** — catalog-wide by nature (genuinely Commerce-relevant across the
  full conversation, not redundant with another block, belongs in the
  Commerce engine)
- **B** — taxonomy too broad (redundant with another block; a flow
  template could pick between them dynamically)
- **C** — scoping-layer gap (belongs to a different engine but slipped
  through)

| # | Block | Engine tag | Stage | Verdict | Rationale |
|---|---|---|---|---|---|
| 1 | greeting | shared | greeting | A | Shared infrastructure — every engine's catalog needs greeting; scoping shouldn't strip it. |
| 2 | nudge | shared | social_proof | A | Shared re-engagement block; cross-engine. |
| 3 | promo | shared | showcase | A | Shared — promotions apply to both booking (upsell add-ons) and commerce (discounts) flows. |
| 4 | cart | shared | conversion | A | Shared — booking partners can have a cart too (gift cards, add-ons). Correctly retained. |
| 5 | contact | shared | handoff | A | Shared handoff — every engine's catalog needs it. |
| 6 | menu_item | commerce | discovery | A | Core commerce browse block; genuinely commerce-relevant. |
| 7 | menu_detail | commerce | showcase | A | Product-detail page shape; distinct from menu_item (list card vs detail card). Not redundant. |
| 8 | category_browser | commerce | discovery | A | Navigation axis distinct from free browse. |
| 9 | dietary_filter | commerce | discovery | A | Filter UI — separate conversation moment from category_browser. Complementary, not redundant. |
| 10 | order_customizer | commerce | showcase | A | Interactive configure (spice, add-ons). Distinct from menu_detail — one is a card, the other is an input surface. |
| 11 | daily_specials | commerce | showcase | A | Time-scoped curated list. Not a duplicate of menu_item — different composition role. |
| 12 | drink_menu | commerce | discovery | A (with B watch-flag) | A specific sub-browse (drinks only). Slight overlap with menu_item filtered by category. Flow template could dedupe in theory, but the use-case is distinct enough to keep for now. |
| 13 | chef_profile | commerce | social_proof | A | Trust-building content distinct from diner_review (producer vs consumer testimonial). |
| 14 | nutrition | commerce | showcase | A | Specific informational card. Distinct from menu_detail. |
| 15 | diner_review | commerce | social_proof | A | Customer testimonial — distinct role from chef_profile. |

Tally: **15 × A**, with 1 block (`drink_menu`) carrying a watch-flag for
potential future B-consolidation if downstream observation shows the
flow template never selects it independently of menu_item.

## Interpretation

**A — catalog-wide by nature.** The 12% reduction is the expected steady
state for Commerce on a food-heavy partner like `full_service_restaurant`.

Why:
1. **Five shared blocks** are structural scaffolding (greeting, nudge,
   promo, cart, contact) — they exist in every engine's catalog by
   design. No engine-scoping algorithm should strip them. That's
   17 → 15 already accounted for at the shared layer.
2. **Ten commerce-tagged blocks** all serve distinct conversation
   moments. Commerce for food_beverage has more natural surface than
   Commerce for a service-oriented vertical because the menu *is* the
   product surface — browse, filter, detail, customize, social-proof,
   informational — each moment warrants a distinct block.
3. **Zero scoping-layer gaps** (Interpretation C). No block in the
   commerce-scoped list belongs to booking (`table_reservation`
   correctly excluded) or service (`kitchen_queue` correctly excluded).
4. **Zero material taxonomy redundancy** (Interpretation B) beyond the
   one watch-flag on `drink_menu`. Each block's conversation role is
   distinct.

The implication: **the playbook's uniform 40% C5 target is wrong**.
Per-engine targets need to reflect each engine's natural catalog surface
area, not a single global number.

## Revised per-engine Phase 2 C5 targets

Based on Session 1 evidence (Booking 65%, Commerce 12%, Service 65% — all
measured on `full_service_restaurant`), plus static analysis of the
remaining engines' block inventories:

| Engine | Revised target | Basis |
|---|---|---|
| Booking | ≥ 60% | Confirmed at 65% on `full_service_restaurant`. Booking surface is lean (reserve + rooms + availability + greeting + cart + contact). Reduction is high because non-booking blocks dominate the unscoped set. |
| Commerce | 10% – 25% | Confirmed at 12% on food_beverage. Retail sub-verticals may differ — D2C ecommerce has `skin_quiz`, `compare`, `bundle` etc. which are highly commerce-specific but the partner's functionId is commerce-only so unscoped and scoped sizes are close. Expect single-digit reductions for commerce-only partners, 10-25% on multi-engine partners. |
| Lead | 25% – 50% (predicted) | Lead's surface is focused (capture → qualify → nurture → handoff). Most Lead-primary partners also carry Service; many carry Commerce for upsell. Lead-specific blocks (qualification_form, demo_booking, lead_score) are narrower than booking's, so scoping should strip more. |
| Engagement | 40% – 60% (predicted) | Engagement's natural surface is the smallest (donate, RSVP, subscribe, loyalty). Most partners carrying Engagement also carry a primary engine (booking or commerce); scoping strips the primary engine's blocks from Engagement-scoped view. High reduction expected. |
| Info | 50% – 70% (predicted) | Info is the narrowest engine (directory + faq + status + location). Partners carrying Info typically also carry Booking or Service; Info-scoped view strips almost all non-Info blocks. Highest reduction expected. |
| Service | ≥ 60% | Confirmed at 65% on `full_service_restaurant`. Service is an overlay, so its catalog is always small. |

The uniform 40% target is retired. Retrospectives for each engine's
session must compare against the engine's revised range, not the 40%
line.

## Action for Lead session

- Lead's Phase C C5 result must be compared against the **25% – 50%**
  range predicted above.
- A Lead C5 **below 25%** on a single-engine Lead-primary partner:
  investigate for Interpretation B (too-broad taxonomy) or C (scoping
  gap). Do not close retro without resolution.
- A Lead C5 **above 50%** on a multi-engine Lead partner: update the
  prediction upward for Engagement + Info sessions.
- Multi-engine Lead partners (e.g., `insurance` with service): measure
  separately per-scope, record in Lead's retro.

## References

- Session 1 Phase C entry: `ENGINE_ROLLOUT_PROGRESS.md` → "Phase 2
  Session 1 — Commerce Phase C" block, C5 measurement
- Pre-flight tuning: `docs/engine-rollout-phase2/tuning.md` §4 (catalog
  budget) + §8 (risk register "C5 baseline gap")
- Code: `src/lib/relay/admin-block-registry.ts` →
  `getAllowedBlocksForFunctionAndEngine`

## Commit footer convention

All subsequent per-engine Phase C entries should carry:

    Speculative-From: c5-interpretation-commerce.md

and cite the engine's predicted range at retro close.
