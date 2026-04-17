# Booking Pilot — Phase A Analysis

Source evidence for the Relay Engine Architecture booking pilot (M01–M15).
Every claim below is grounded in a specific file and line range — the
engineering decisions in M01+ depend on these being correct.

---

## A1. Booking-native block inventory

The booking-engine surface is spread across seven verticals. 41 native
booking blocks are in scope for tagging in M04. Data pulled from
`src/lib/relay/blocks/**/*.tsx` and cross-referenced against
`src/app/admin/relay/blocks/previews/_registry-data.ts`.

### Hospitality — `src/lib/relay/blocks/hospitality/` (12 blocks)

| File | id | family | stage | moduleBinding | status |
|---|---|---|---|---|---|
| `availability.tsx` | `hosp_availability` | form | showcase | — | active |
| `room-card.tsx` | `room_card` | rooms | discovery | `moduleItems` | active |
| `room-detail.tsx` | `room_detail` | rooms | showcase | `moduleItems` | active |
| `check-in.tsx` | `hosp_check_in` | form | conversion | — | active |
| `amenities.tsx` | `amenities` | property | discovery | `moduleItems` | active |
| `meal-plan.tsx` | `meal_plan` | dining | showcase | — | active |
| `property-gallery.tsx` | `property_gallery` | property | discovery | — | active |
| `local-experiences.tsx` | `local_experiences` | concierge | discovery | `moduleItems` | active |
| `house-rules.tsx` | `house_rules` | property | objection | — | active |
| `transfer.tsx` | `transfer` | transport | conversion | — | active |
| `guest-review.tsx` | `guest_review` | social_proof | social_proof | — | active |
| `concierge.tsx` | `concierge` | concierge | conversion | — | active |

### Healthcare — booking subset (4 of 13 blocks)

- `src/lib/relay/blocks/healthcare/appointment.tsx` — `hc_appointment`, family `booking`, stage `conversion`
- `.../telehealth.tsx` — `telehealth`, family `virtual`, stage `conversion`
- `.../patient-intake.tsx` — `patient_intake`, family `operations`, stage `conversion`
- `.../wait-time.tsx` — `wait_time`, family `operations`, stage `discovery`

All four: `moduleBinding: null`, `status: active`. Transactional UI; no
module data backing.

### Personal Wellness — booking subset (3 of 14 blocks)

- `src/lib/relay/blocks/personal_wellness/appointment.tsx` — `pw_appointment`, family `booking`, stage `conversion`
- `.../class-schedule.tsx` — `class_schedule`, family `scheduling`, stage `discovery`
- `.../intake-form.tsx` — `intake_form`, family `operations`, stage `conversion`

All three: `moduleBinding: null`.

### Travel & Transport — booking subset (3 of 11 blocks)

- `src/lib/relay/blocks/travel_transport/ticket-booking.tsx` — `ticket_booking`, family `booking`, stage `conversion`
- `.../transfer-booking.tsx` — `transfer_booking`, family `booking`, stage `conversion`
- `.../schedule-grid.tsx` — `tl_schedule_grid`, family `timetable`, stage `showcase`

All three: `moduleBinding: null`.

### Events & Entertainment — booking subset (3 of 14 blocks)

- `src/lib/relay/blocks/events_entertainment/availability.tsx` — `evt_availability`, family `booking`, stage `conversion`
- `.../invite-rsvp.tsx` — `invite_rsvp`, family `management`, stage `social_proof`
- `.../seating-chart.tsx` — `seating_chart`, family `planning`, stage `showcase`

All three: `moduleBinding: null`.

### Food & Beverage — booking subset (1 of 11 blocks)

- `src/lib/relay/blocks/food_beverage/table-reservation.tsx` — `table_reservation`, family `booking`, stage `conversion`

### Automotive — booking subset (3 of 14 blocks)

- `src/lib/relay/blocks/automotive/test-drive.tsx` — `test_drive`, family `booking`, stage `conversion`
- `.../service-scheduler.tsx` — `auto_service_scheduler`, family `booking`, stage `conversion`
- `.../rental-builder.tsx` — `rental_builder`, family `pricing`, stage `showcase`

### Shared / cross-engine candidates

From `_registry-data.ts` lines 23–30 (SHARED_BLOCKS_DATA):

- `greeting` (stage `greeting`) — active
- `suggestions` (stage `greeting`) — active
- `nudge` (stage `social_proof`) — active
- `promo` (stage `showcase`) — active
- `cart` (stage `conversion`) — active
- `contact` (stage `handoff`) — active

All six will receive `engines: ['shared']` in M04. `cart` is logically a
commerce primitive but is listed here because the registry already groups it
with the shared block set; M04 will multi-tag it as `['shared', 'commerce']`
when the taxonomy extends beyond the booking pilot.

**Summary count for M04 planning:** 29 native booking blocks + 6 shared
blocks = 35 blocks in M04 tagging scope. (The 41 total in inventory
includes cross-vertical duplicates that share the same registry id.)

---

## A2. Block registry shape

**Generator script:** `scripts/extract-block-registry-data.js` (committed at
repo root; **not** inside `src/`). The earlier Phase A draft incorrectly
placed this under `src/scripts/` — the canonical path is repo-root
`scripts/`.

**How it works.** The script scans 14 vertical preview directories
(`automotive`, `business`, `ecommerce`, `education`, `events_entertainment`,
`financial_services`, `food_beverage`, `food_supply`, `healthcare`,
`home_property`, `hospitality`, `personal_wellness`, `public_nonprofit`,
`travel_transport`), extracts `[PREFIX]_BLOCKS` and `[PREFIX]_SUBVERTICALS`
arrays from each vertical's `index.tsx` / `index.ts`, strips preview-only
fields, and emits
`src/app/admin/relay/blocks/previews/_registry-data.ts` (396 lines).

**`ServerBlockData` shape** (`_registry-data.ts` lines 7–16):

```ts
interface ServerBlockData {
  id: string;
  family: string;
  label: string;
  stage: string;
  desc: string;
  intents: string[];
  module: string | null;
  status?: 'active' | 'new' | 'planned';
}
```

**Assembly.**
- `ALL_BLOCKS_DATA` (lines ~34–242) — concatenation of per-vertical
  `_BLOCKS_DATA` arrays.
- `ALL_SUB_VERTICALS_DATA` (lines ~245–299+) — map of sub-vertical id →
  block-id list (e.g., `new_vehicle_sales` → `['vehicle_card',
  'vehicle_detail', 'finance_calc', 'test_drive', 'trade_in', 'warranty',
  'auto_review']` at line 247).
- `SHARED_BLOCK_IDS_DATA` (line 32) — 6 ids from the shared set above.

**Re-run:** `node scripts/extract-block-registry-data.js` (no npm script
wrapper; called manually after block edits).

**M02 implication.** Adding `engines?: BlockTag[]` to the registry-data
shape requires both (a) the `_registry-data.ts` type widening and (b) the
generator extracting an `engines` field from block index exports. For
Booking-only scope (pilot constraint), M04 will edit `_registry-data.ts`
entries directly without touching the generator; the generator change is
scheduled alongside a wider engine rollout (Phase 2).

---

## A3. Flow engine current state

**`FlowDefinition`** — `src/lib/types-flow-engine.ts:58–72`:

```ts
export interface FlowDefinition {
  id: string;
  name: string;
  partnerId: string;
  industryId: string;
  functionId: string;
  stages: FlowStage[];
  transitions: FlowTransition[];
  settings: FlowSettings;
  status: 'active' | 'draft';
  sourceTemplateId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

**No `engine` field today.** Flows are scoped by `functionId`, not engine.

**`FlowStage`** — `types-flow-engine.ts:28–38`: includes `blockTypes:
string[]` (ids valid in the stage) and `intentTriggers: IntentSignal[]`.
The `FlowStageType` enum has 9 values: `greeting`, `discovery`, `showcase`,
`comparison`, `social_proof`, `conversion`, `objection`, `handoff`,
`followup`. M05 flow templates will match this enum exactly.

**`FlowEngineDecision`** — `types-flow-engine.ts:97–108`:

```ts
export interface FlowEngineDecision {
  suggestedStageType: FlowStageType;
  suggestedBlockTypes: string[];
  leadScore: number;
  leadTemperature: LeadTemperature;
  shouldHandoff: boolean;
  shouldCaptureLeads: boolean;
  shouldShowPromo: boolean;
  shouldShowTestimonials: boolean;
  contextForAI: string;
  updatedState: ConversationFlowState;
}
```

**Load path.** `src/lib/relay/orchestrator/signals/flow.ts` —
`loadFlowDefinition(partnerId, functionId)` at lines 43–60 tries
`partners/{id}/relayConfig/flowDefinition` first, then falls back to
`getFlowTemplateForFunction(functionId)` (imported from
`src/lib/flow-templates`). `loadFlowSignal(ctx, functionId)` at lines 62+
runs `runFlowEngine` and returns a `FlowSignal` with `suggestedBlockIds:
string[]` pre-computed for the orchestrator policy.

**M11/M12 implication.** Engine-scoped flow selection (Booking flow vs.
Commerce flow for multi-engine partners) requires either (a) adding
`engine?: Engine` to `FlowDefinition` and keying the load on
`(partnerId, activeEngine)`, or (b) layering an engine router above the
per-function template map. The pilot takes path (a) as the additive
change; path (b) becomes relevant in Phase 2 when multi-engine partners
become common.

---

## A4. Module ↔ block coupling

Booking-native blocks that bind modules:

- **Hospitality only.** `room_card`, `room_detail` → `moduleItems`
  (filtered to the `room_inventory` category); `amenities` →
  `moduleItems` (category `amenities`, seeded alongside
  `room_inventory`); `local_experiences` → `moduleItems` (category
  `experiences`).
- **All other booking blocks have `moduleBinding: null`.** Healthcare
  appointments, wellness appointments, travel tickets, event availability,
  table reservations, test drives, service schedulers, etc., are
  transactional UI wrappers that generate data at runtime — they do not
  read from a partner-curated module.

**Seed paths today.** Only `room_inventory` has a partner-facing seed path
(`src/lib/modules/seed-modules.ts:8–49`). No healthcare provider module,
wellness-services module, class-schedule module, ticket-inventory module,
event-space module, table/seating module, or automotive-rental module has
a seed template. **These absences are the M15 deliverables.**

---

## A5. Partner config resolution

**Path:** subdomain → partners doc → `functionId` → `PartnerSignal`.

1. **`src/lib/relay-subdomain.ts:3–23`** — `isRelaySubdomain()` is a
   hostname validator only; does not perform doc lookup.
2. **`src/lib/relay/orchestrator/signals/partner.ts:20–58`** —
   `loadPartnerSignal()`:
   - Reads `partners/{partnerId}` from Firestore (lines 25–26).
   - Extracts `functionId` from
     `partnerData?.businessPersona?.identity?.businessCategories?.[0]?.functionId
     ?? 'general'` (lines 31–35).
   - Loads top 10 enabled modules with active items (lines 37–55).
   - Returns `PartnerSignal` with `functionId`, raw `partnerData`, and
     `modules[]`.
3. **Flow override path:** `partners/{id}/relayConfig/flowDefinition`
   (loaded at A3).
4. **Block preferences:** `partners/{id}/relayConfig/blocks` subcollection,
   per-block `isVisible` overrides, service
   `src/lib/relay/block-config-service.ts:91–99`.

**No `engines` field on Partner today.** M03 is where
`getPartnerEngines(partner)` becomes the canonical accessor —
`partner.engines` if present, otherwise `deriveEnginesFromFunctionId(
partner.businessPersona?.identity?.businessCategories?.[0]?.functionId)`.

---

## A6. Gap analysis

| Area | Exists? | Evidence | Needs change? |
|---|---|---|---|
| `Engine` enum / type | **No code** (only design spec at `docs/booking-pilot/00-context.md` Appendix A) | `grep` for `ENGINES\s*=\s*\[` / `export\s+type\s+Engine\b` in `src/` → zero hits | **M01** creates `src/lib/relay/engine-types.ts` |
| `engines` on `UnifiedBlockConfig` | No | `src/lib/relay/types.ts:126–148` — no `engines` field | M02 adds optional `engines?: BlockTag[]` |
| `engine` on `FlowDefinition` | No | `src/lib/types-flow-engine.ts:58–72` | M02 adds optional `engine?: Engine` |
| `engines` / `engineRecipe` on Partner | No | `loadPartnerSignal()` reads raw doc; no such fields | M02 adds optional fields; M03 fills at onboarding |
| `activeEngine` on `RelaySession` | No | `src/lib/relay/session-types.ts` has no such field | M02 adds optional `activeEngine?: Engine` |
| Health checker (pure fn) | Partial — field-level only | `src/lib/relay/binding-health.ts` (61 lines) computes `ok/empty/missing/skipped` per field | M06 adds block-level + engine-level rules on top |
| `relayEngineHealth` Firestore collection | No | No collection rule or write found | M07 creates in shadow mode |
| Intent `engineHint` | No | `IntentSignal` in `types-flow-engine.ts:12–24` has no `engineHint` | M10 adds hint to lexicon |
| `/admin/relay/engines` or engine tabs in `/admin/relay/blocks` | No | `src/app/admin/relay/blocks/page.tsx` has no engine tab shell | M08 creates tab shell |
| `/admin/relay/health` page | No | Route does not exist | M09 creates |
| Preview Copilot scripts + sandbox | No | Previews exist but no Copilot scripts | M13 |
| Onboarding recipe picker | Partial UI | `src/app/admin/relay/flows/FlowScenarioPicker.tsx` exists but not engine-aware | M14 extends |
| Generic CSV module import | No | Only `src/lib/hotel-import-service.ts` (hotel-specific) | M15 ships generic importer + booking seed templates |
| `lib/relay-block-taxonomy.ts` | Yes, 240 LOC; referenced live | `src/lib/relay-block-taxonomy.ts`; imported from `src/actions/relay-actions.ts` (Gemini taxonomy context) | Marked deprecated; removal deferred to Phase 3 per hard rule #6 |

14 rows — meets Phase A acceptance threshold.

---

## A7. functionId universe

`src/lib/business-taxonomy/industries.ts` is the canonical source. Total
~161 functionIds across 14 industries. Booking-relevant subset per
`docs/booking-pilot/00-context.md` Appendix C (13 functionIds, stable):

```
hotels_resorts        → [booking, service]
budget_accommodation  → [booking, service]
boutique_bnb          → [booking, service]
serviced_apartments   → [booking, service]
vacation_rentals      → [booking, service]
guest_houses          → [booking, service]
camping_glamping      → [booking, service]
corporate_housing     → [booking, service, lead]
event_venues          → [booking, lead]
ticketing_booking     → [booking, service]
airport_transfer      → [booking, service]
cinemas_theaters      → [booking, service]
taxi_ride             → [booking, service]
```

M03 extends this mapping to cover the booking subset of healthcare
(`primary_care`, `dental_care`, `vision_care`, `veterinary`,
`diagnostic_imaging`, `mental_health`, `physical_therapy`,
`alternative_medicine`, `home_healthcare`), personal wellness
(`salon_barbershop`, `spa_wellness`, `fitness_gym`, `yoga_studio`,
`massage_therapy`, `nail_salon`, `physiotherapy`, `personal_training`),
travel (`travel_agency`, `tour_operator`, `airlines_booking`,
`bus_transport`, `train_transport`, `car_rental`), events
(`event_planning`, `wedding_planner`, `corporate_event_management`,
`entertainment_booking`, `cinemas_theaters`, `live_events`, `show_venues`),
food (`full_service_restaurant`, `casual_dining`, `bar_lounge`), and
automotive (`new_vehicle_sales`, `used_vehicle_sales`, `vehicle_service`,
`vehicle_rental_leasing`).

**Uncertainty count:** 0 in the core 13; ~5 at the edges (e.g., does
`cloud_kitchen` get `[booking]` for scheduled drops, or `[commerce]` only?
Takeaway: defer to Phase 2). Well below the 20% threshold that would block
M01 per `docs/booking-pilot/01-phase-a-analysis.md`.

---

## Acceptance checklist

- [x] `docs/booking-pilot-analysis.md` present at this path.
- [x] A1 inventory: 35 tagging targets (29 native booking + 6 shared).
- [x] A2 registry shape + generator script path documented.
- [x] A3 flow engine current state: `FlowDefinition` / `FlowStage` /
      `FlowEngineDecision` shapes captured; confirmed no `engine` field.
- [x] A4 module coupling: only hospitality catalog blocks bind modules.
- [x] A5 partner resolution: subdomain → functionId path traced.
- [x] A6 gap table has 14 rows.
- [x] A7 functionId mapping confidence > 80% (0 blockers in core 13).

Proceeding to M01.
