# Q10 Service-tagging audit

Session: Phase 3 pre-flight (revised, v3), Task 1.
HEAD: `claude/cutover-preflight-v3` (stacked on `claude/baseline-investigation-fresh`).
Baseline: tsc = 276.

## Service-tagged block inventory

Actual count: **16 blocks** carry `engines: ['service']` or `[..., 'service']`. Phase 2 summary claimed "4 blocks tagged during Session 1 (Commerce-adjacent)" — the 4 was the Session-1-specific delta from X01. The total has grown across Sessions 2–3 as per-engine dual-tags accumulated.

### Single-tag service (7 blocks) — standalone service overlay

| Block | Primary engine context |
|---|---|
| `order_confirmation` | Commerce |
| `order_tracker` | Commerce |
| `kitchen_queue` | Commerce (food_beverage) |
| `fs_order_tracker` | Commerce (food_supply) |
| `hp_job_tracker` | Home-services (booking/lead) |
| `hp_history` | Home-services (booking/lead) |
| `pu_application_tracker` | Engagement / public-nonprofit |

### Dual-tag `[lead, service]` (8 blocks) — Lead engagement-status overlays

| Block | Notes |
|---|---|
| `engagement_timeline` | Lead engagement progress |
| `retainer_status` | Lead retainer burn-down |
| `document_collector` | Lead document-upload flow |
| `evt_timeline` | Events planning timeline |
| `fin_account_snapshot` | Lead financial account overview |
| `fin_portfolio` | Lead wealth-mgmt portfolio view |
| `fin_credit_score` | Lead credit-health snapshot |
| `fin_doc_upload` | Lead KYC document upload |
| `fin_app_tracker` | Lead application pipeline |

(9 rows but one repeats — `fin_app_tracker` also carries `service` tag meaning "track existing application" — correctly dual.)

## Per-engine service-break intent coverage

Service-break intent names by engine (from flow templates):

| Engine | Service-break intents |
|---|---|
| Booking | `track-reservation`, `cancel-booking`, `modify-booking` |
| Commerce | `track-order`, `cancel-order`, `modify-order` |
| Lead | `track-application`, `status-check`, `amend-application`, `withdraw-application` |
| Engagement | `track-donation`, `cancel-recurring`, `update-rsvp` |
| Info | `track-status`, `track-outage`, `report-issue` |

When a service break fires, the orchestrator scopes the allowed-blocks catalog to engines containing `service` on the partner. The eligible service-tagged blocks for that partner then render. The concern: is each engine's service break routed to blocks tagged for the right domain shape?

### Booking service breaks

**Intent → candidate blocks:**
- `track-reservation` → no booking-specific service tracker block
- `cancel-booking` → no booking-specific cancellation block
- `modify-booking` → no booking-specific modify block

**Gap assessment:** When a hotels_resorts partner has a customer ask "where's my booking status?", the service-scoped catalog contains only the 16 service-tagged blocks, none of which are booking-domain (all are commerce/lead/home-services/public). The orchestrator's permissive fallback currently carries it — rendering `order_tracker` or `hp_job_tracker` for a hotel reservation is semantically wrong but not a rendering failure. **After P3.M05 removes permissive fallbacks, this becomes a routing gap.** Partners will see "no block available" for service breaks.

**Severity: must-fix-before-P3.M05** for:
- `reservation_tracker` — service-tagged block covering booking-domain "track my reservation"
- `booking_modifier` — service-tagged block covering "change my booking date" (or widen an existing block)
- `booking_canceller` — or repurpose an existing Lead-domain withdraw flow

### Commerce service breaks

**Intent → candidate blocks:**
- `track-order` → `order_tracker` (matches by intent name) ✓
- `cancel-order` → no dedicated cancel block; permissive fallback carries it
- `modify-order` → no dedicated modify block; permissive fallback carries it

**Gap assessment:** Commerce has `order_tracker` + `order_confirmation`, plus `kitchen_queue` + `fs_order_tracker` sub-vertical variants. Tracking is well-covered. Cancel and modify rely on permissive fallback — same pattern as booking. **Must-fix-before-P3.M05**: add at least an `order_modifier` block or confirm the cancel/modify intents intentionally degrade to a generic "contact support" block (`contact` shared block).

### Lead service breaks

**Intent → candidate blocks:**
- `track-application` → `fin_app_tracker`, `pu_application_tracker`, `engagement_timeline`, `evt_timeline` ✓
- `status-check` → same set ✓
- `amend-application` → `document_collector`, `fin_doc_upload` ✓
- `withdraw-application` → no dedicated withdraw block; permissive fallback

**Gap assessment:** Lead's service breaks have real coverage via the 8 dual-tagged blocks. Withdraw-application is the only uncovered intent. Permissive fallback handles it. **Acceptable to defer** — Phase 3 Session 1 can ship P3.M05 with this intent degrading to `contact`; mid-Phase-3 can add a `lead_withdraw` block if operator feedback warrants.

### Engagement service breaks

**Intent → candidate blocks:**
- `track-donation` → no donation-tracking block (only `pu_donation` exists for intake; no post-commit tracker)
- `cancel-recurring` → no recurring-cancel block
- `update-rsvp` → `invite_rsvp` is tagged `['booking', 'engagement']` — no service tag

**Gap assessment:** Engagement-primary partners are largely service-exception (Q15 documented 4-of-5 cap; ngo_nonprofit/religious/community_association/cultural_institutions). Partners that DO enable service on top of engagement would hit all three intents with zero coverage today. But since Q15 documented that engagement-primaries don't enable service, **these gaps are architecturally absorbed** — partners that need donation tracking opt into service explicitly, and when they do, should tag their own partner-specific blocks.

**Must-fix-before-P3.M05: minimal.** Consider one shared block (`commitment_tracker` or similar) for recurring-donation and RSVP tracking, or accept `order_tracker` as the cross-domain fallback (commerce and engagement "track a commitment" are structurally similar). Document the choice.

### Info service breaks

**Intent → candidate blocks:**
- `track-status` → `pu_outage_status`, `pu_application_tracker` ✓
- `track-outage` → `pu_outage_status` ✓
- `report-issue` → `pu_complaint` (engagement-tagged, not service; partners with info+engagement catch it via engagement side)

**Gap assessment:** public_transport and utilities are info+service; `pu_outage_status` covers the tracking intents. `report-issue` is thin for utilities partners without engagement. **Acceptable to defer** — `contact` fallback is adequate.

## Gap summary

| Engine | Must-fix-before-P3.M05 | Safe-to-defer |
|---|---|---|
| Booking | **3** (reservation_tracker, booking_modifier, booking_canceller) | — |
| Commerce | **0–2** (order_modifier optional; consider documenting cancel→contact) | 2 (cancel/modify → contact acceptable) |
| Lead | 0 | 1 (withdraw → contact acceptable) |
| Engagement | **0–1** (commitment_tracker optional) | 3 (if engagement-only partner) |
| Info | 0 | 1 (report-issue → contact acceptable) |

**Total must-fix: 3–6 blocks** depending on whether we add dedicated Commerce/Engagement trackers or reuse `contact`.

**Total gap count: under 10** — below the escalation threshold (playbook Section 8 trigger #2 says ">10 gaps warrants dedicated session"). Phase 3 proceeds.

## Recommendation

**Option A (conservative):** ship 3 booking-specific service blocks (`reservation_tracker`, `booking_modifier`, `booking_canceller`) as part of a new milestone P3.M04.5 before P3.M05 permissive-fallback removal. Commerce/Lead/Engagement/Info degrade their uncovered intents to `contact`.

**Option B (aggressive):** skip authoring service-specific blocks entirely; make all uncovered service breaks degrade to `contact` shared block via an explicit orchestrator rule ("service break with no service-tagged eligible block → route to contact with context"). Lower code surface; documented fallback semantics instead of per-intent blocks.

**Recommended: Option B** — one explicit rule beats six domain-specific blocks. Service's purpose is routing discipline; when the domain doesn't have a tracker, degrading to "contact the team" is the correct user experience (consistent with service.strong phrases like "cancel my reservation" which should escalate to humans, not self-serve).

## Action for P3.M05

P3.M05 execution:
1. Audit the orchestrator's current permissive fallback path for service breaks
2. Replace permissive fallback with: "service break + no eligible service-tagged block → render `contact` with error context"
3. Add integration tests per engine verifying: service break + no matching block → contact renders (not orchestrator error)
4. Document the "contact fallback for uncovered service intents" rule in `tuning.md` §Phase-3-specific

No new blocks shipped; no taxonomy change; only orchestrator rule change. Low-risk.

## Discrepancy with Phase 2 summary

`ENGINE_ROLLOUT_SUMMARY.md` line ~50 claims: *"Service overlay (X01): 4 blocks tagged during Session 1 (Commerce-adjacent)"*. That's accurate for **Session 1's delta** — 4 blocks were added in X01 (`order_confirmation`, `order_tracker`, `kitchen_queue`, `fs_order_tracker`). What it doesn't say is that Sessions 2 and 3 added 12 more service-tagged blocks (8 lead-service dual-tags + others). The total of 16 is the current state.

Not an error in the summary — the "4 blocks" was Session 1 scope. But for Phase 3 planning purposes, the real number is 16. Flagged for erratum in Task 9.
