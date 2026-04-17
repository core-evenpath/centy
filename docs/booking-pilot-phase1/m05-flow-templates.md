# M05 — Booking flow templates

**Files:**
- `lib/relay/flow-templates/booking/{hotel,clinic-appointment,wellness-appointment,ticketing,airport-transfer}.ts`
- `lib/relay/flow-templates/booking/index.ts`
- `__tests__/booking-flow-templates.test.ts`

**Goal:** Authored starter flows per Booking sub-vertical, keyed by `functionId`. Each declares `engine: 'booking'`, canonical stage order, and per-stage `suggestedBlockIds`.

## Canonical stage order

`greeting → discovery → showcase → comparison → conversion → followup → handoff`

Not every template needs every stage; present stages must appear in this order.

Each template's `intentRouting` must include explicit breaks to the `service` overlay for:

- `track-reservation`
- `cancel-booking`
- `modify-booking`

## Registry

```ts
export const BOOKING_FLOW_TEMPLATES = {
  hotels_resorts: hotelTemplate,
  boutique_bnb: hotelTemplate,
  vacation_rentals: hotelTemplate,
  ticketing_booking: ticketingTemplate,
  airport_transfer: airportTransferTemplate,
  // ... per A3 + M03 mapping
};

export function getBookingFlowTemplate(functionId: string) {
  return BOOKING_FLOW_TEMPLATES[functionId] ?? null;
}
```

## Acceptance

- [ ] One file per sub-vertical + index
- [ ] Every template sets `engine: 'booking'`
- [ ] Test: every `suggestedBlockId` exists in `_registry-data.ts`
- [ ] Test: every `suggestedBlockId` has `engines` containing `'booking'` or `'shared'`
- [ ] Test: `getBookingFlowTemplate` returns a template for every booking `functionId` from M03

## Escalation triggers

- A referenced block id is missing from the registry
- `FlowDefinition` shape does not accept the template structure

## Commit

`[booking-pilot M05] booking flow templates: hotel, clinic, wellness, ticketing, airport_transfer`
