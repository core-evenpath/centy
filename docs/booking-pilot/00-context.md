# 00 — Context (read before anything else)

## Repo summary

Multi-tenant conversational commerce platform internally called **Relay**. Three authoring layers + one new validation layer:

- `/admin/relay/blocks` — UI vocabulary (what can be shown)
- `/admin/relay/flows` — decision logic (when/why to show it)
- `/admin/modules` — content source (what data fills it)
- `/admin/relay/health` — **new** — are the above three coherently connected

## The `Engine` abstraction

Six engines run through all three layers:

1. `commerce` — sell goods (cart, checkout, orders)
2. `booking` — reserve time or asset (slots, rooms, appointments, tickets)
3. `lead` — qualify high-consideration offline-closed services
4. `engagement` — in-channel non-commerce conversion (donate, volunteer, RSVP)
5. `info` — pure directory / status / FAQ
6. `service` — post-conversion tracking / account / support (auto-overlay when any of 1–4 is on)

Plus a `shared` tag (not an engine) for cross-cutting blocks: `greeting`, `contact`, `suggestions`, `nudge`, `promo`, `testimonials`, `location`, `info`, `quick_actions`.

## Scope of this task

**Booking engine only.** Do not tag, wire, or expose the other five engines. Their schema fields become optional and are ignored at runtime until a later phase.

---

## Non-negotiable constraints

- **No new AI calls.** Existing Gemini/Anthropic usage stays; do not add model calls to admin assists, Health, onboarding, drafting, or Preview Copilot. Seeds and canonical scripts are content deliverables, not prompts.
- **Backward compatibility.** Every production partner without engine fields must continue functioning. All new schema fields are optional with deterministic fallbacks.
- **Shadow mode Health.** Health computes and writes but does not gate publishing or block runtime until explicit flip in Phase 3.
- **No big-bang migrations.** Additive schema changes only. Do not delete `lib/relay-block-taxonomy.ts`; mark deprecated.
- **Booking-only tagging.** Do not add `engines: [...]` to non-Booking blocks in this task.

## Operating principles

- **Analyze before you implement.** Phase A must be committed before any production code.
- **One milestone per commit.** Commit message format: `[booking-pilot Mxx] <summary>`.
- **Pause on ambiguity.** Log to `BOOKING_PILOT_QUESTIONS.md` and wait. Do not assume.
- **Never delete or rewrite established files silently.** Flag, propose, wait for approval.
- **Root-cause fixes only.** If a test fails, fix the cause; do not skip, stub, or relax it.
- **No dependency additions** without a justification line in the progress doc.

---

## Appendix A — Engine enum canonical reference

```ts
export const ENGINES = ['commerce', 'booking', 'lead', 'engagement', 'info', 'service'] as const;
export type Engine = typeof ENGINES[number];

export const BLOCK_TAGS = [...ENGINES, 'shared'] as const;
export type BlockTag = typeof BLOCK_TAGS[number];
```

## Appendix B — Booking block candidates (starting list; expand in A1)

- `lib/relay/blocks/hospitality/*` — all (rooms, availability, check-in, house-rules, room-card, room-detail, property-gallery, amenities, local-experiences, meal-plan, transfer)
- `lib/relay/blocks/healthcare/appointment.tsx`, `telehealth.tsx`, `patient-intake.tsx`, `wait-time.tsx`
- `lib/relay/blocks/personal_wellness/appointment.tsx`, `class-schedule.tsx`, `intake-form.tsx`
- `lib/relay/blocks/travel_transport/ticket-booking.tsx`, `transfer-booking.tsx`, `schedule-grid.tsx`
- `lib/relay/blocks/events_entertainment/availability.tsx`, `invite-rsvp.tsx`, `seating-chart.tsx`
- `lib/relay/blocks/food_beverage/table-reservation.tsx`
- `lib/relay/blocks/automotive/test-drive.tsx`, `service-scheduler.tsx`, `rental-builder.tsx`

Shared-tag candidates: `greeting`, `contact`, `suggestions`, `nudge`, `promo`, `testimonials`, `location`, `info`, `quick_actions`.

## Appendix C — functionId → engines starter mapping (Booking-relevant)

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

Populate clinics, wellness, automotive test-drive during A3/A5 from `lib/business-taxonomy/industries.ts`.

## Appendix D — Key file map

- Block registry: `lib/relay/admin-block-registry.ts`, `src/app/admin/relay/blocks/previews/_registry-data.ts`
- Block taxonomy (deprecated post-pilot): `lib/relay-block-taxonomy.ts`
- Orchestrator: `lib/relay/orchestrator/index.ts`, `.../policy.ts`, `.../signals/*`, `.../types.ts`
- Flow engine: `lib/flow-engine.ts`, `lib/relay/flow-to-blocks.ts`, `lib/types-flow-engine.ts`
- Session: `lib/relay/session-store.ts`, `lib/relay/session-cache.ts`, `lib/relay/session-types.ts`
- Modules: `lib/modules/*`, `actions/modules-actions.ts`
- Partner: `lib/relay-subdomain.ts`, `lib/relay/orchestrator/signals/partner.ts`
- Existing health primitive: `lib/relay/binding-health.ts`
- Import scaffolding: `lib/hotel-import-service.ts`, `lib/business-autofill-service.ts`
