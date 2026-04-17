# M04 — Tag Booking blocks

**Files:** `src/app/admin/relay/blocks/previews/*` (Booking blocks only), regenerated `_registry-data.ts`, generator script if present.

**Goal:** Add `engines: ['booking']` to Booking blocks and `engines: ['shared']` to cross-cutting blocks. **Do not tag any other engine.**

## What to tag

Verify and expand from Phase A analysis A1. Starting list:

- `hospitality/*` — rooms, availability, check-in, house-rules, room-card, room-detail, property-gallery, amenities, local-experiences, meal-plan, transfer, concierge
- `healthcare/` — appointment, telehealth, patient-intake, wait-time
- `personal_wellness/` — appointment, class-schedule, intake-form
- `travel_transport/` — ticket-booking, transfer-booking, schedule-grid
- `events_entertainment/` — availability, invite-rsvp, seating-chart
- `food_beverage/table-reservation`
- `automotive/` — test-drive, service-scheduler, rental-builder

Shared candidates: greeting, contact, suggestions, nudge, promo, testimonials, location, info, quick_actions (verify exact ids during A1).

If a generator exists, run it; do not hand-edit generated output.

## Acceptance

- [ ] All A1-identified Booking blocks tagged `engines: ['booking']`
- [ ] All A1-identified shared blocks tagged `engines: ['shared']`
- [ ] No non-Booking, non-shared blocks tagged
- [ ] Registry regenerated and reflects tags
- [ ] `getAllowedBlocksForFunction('hotels_resorts')` returns the expected superset (booking + shared)
- [ ] Test asserts every booking-tagged block has a valid `stage` and non-empty `fields_req`

## Escalation triggers

- A1 list is materially incomplete
- Generator and registry diverged
- Any Booking block already has an `engines` field from prior work

## Commit

`[booking-pilot M04] tag booking + shared blocks with engines[]`
