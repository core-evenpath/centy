# Appendices

## A — Engine enum (canonical)

```ts
export const ENGINES = ['commerce', 'booking', 'lead', 'engagement', 'info', 'service'] as const;
export type Engine = typeof ENGINES[number];
export const BLOCK_TAGS = [...ENGINES, 'shared'] as const;
export type BlockTag = typeof BLOCK_TAGS[number];
```

## B — Booking block candidates (verify in Phase A)

- `hospitality/*` — rooms, availability, check-in, house-rules, room-card, room-detail, property-gallery, amenities, local-experiences, meal-plan, transfer, concierge, guest-review
- `healthcare/` — appointment, telehealth, patient-intake, wait-time
- `personal_wellness/` — appointment, class-schedule, intake-form
- `travel_transport/` — ticket-booking, transfer-booking, schedule-grid
- `events_entertainment/` — availability, invite-rsvp, seating-chart
- `food_beverage/` — table-reservation
- `automotive/` — test-drive, service-scheduler, rental-builder

Shared candidates: greeting, contact, suggestions, nudge, promo, testimonials, location, info, quick_actions.

## C — `functionId → engines` starter (Booking-relevant; expand in M03)

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

For clinics, wellness, automotive test-drive — derive from `lib/business-taxonomy/industries.ts` during M03.

## D — Key file map

- **Block registry:** `lib/relay/admin-block-registry.ts`, `src/app/admin/relay/blocks/previews/_registry-data.ts`
- **Block taxonomy (deprecate, don't delete):** `lib/relay-block-taxonomy.ts`
- **Orchestrator:** `lib/relay/orchestrator/{index,policy,types}.ts`, `lib/relay/orchestrator/signals/*`
- **Flow engine:** `lib/flow-engine.ts`, `lib/relay/flow-to-blocks.ts`, `lib/types-flow-engine.ts`
- **Session:** `lib/relay/{session-store,session-cache,session-types}.ts`
- **Modules:** `lib/modules/*`, `actions/modules-actions.ts`
- **Partner:** `lib/relay-subdomain.ts`, `lib/relay/orchestrator/signals/partner.ts`
- **Existing health primitive (reuse):** `lib/relay/binding-health.ts`
- **Import scaffolding (generalize in M15):** `lib/hotel-import-service.ts`, `lib/business-autofill-service.ts`
