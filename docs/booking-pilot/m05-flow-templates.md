# M05 — Booking flow templates

## Files

- `lib/relay/flow-templates/booking/` (new directory)
- One template file per major booking sub-vertical:
  - `hotel.ts`
  - `clinic-appointment.ts`
  - `wellness-appointment.ts`
  - `ticketing.ts`
  - `airport-transfer.ts`

## Shape of each template

```ts
{
  engine: 'booking',
  stages: ['greeting', 'discovery', 'showcase', 'conversion', 'followup', 'handoff'],
  suggestedBlockIds: { [stage]: string[] },   // booking + shared block ids only
  intentRoutes: [
    { match: /track my reservation|cancel my.../i, target: 'service' },
    // ...
  ]
}
```

## Requirements

- All `suggestedBlockIds` must be valid `booking` or `shared` block ids (verify programmatically in the unit test).
- Stage order is the canonical pipeline order.
- Intent-routing rules handle explicit breaks to the `service` overlay (tracking, cancel, modify).

## Integration

- Templates are loadable by `loadFlowSignal` via the existing flow engine (see A3 for current plumbing).
- Do not change `loadFlowSignal` behaviour in this milestone beyond accepting the new templates — engine-scoped filtering lands in M12.

## Acceptance

- Templates parse and load without error.
- Unit test enumerates every `suggestedBlockId` across every stage in every template and asserts each is present in the registry with `engines` including `booking` or `shared`.
- Templates committed together with a short README describing the shape (optional, only if existing flow-templates have READMEs).

## Commit

`[booking-pilot M05] booking flow templates: hotel, clinic, wellness, ticketing, airport_transfer`
