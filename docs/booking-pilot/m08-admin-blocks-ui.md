# M08 — Admin UI: engine tabs in `/admin/relay/blocks`

## Files

- `src/app/admin/relay/blocks/page.tsx` + child components.
- Any new components in `src/app/admin/relay/blocks/_components/` as needed.

## What to build

- **Top tab bar:** one tab per engine (`commerce`, `booking`, `lead`, `engagement`, `info`, `service`).
- **Booking tab:** fully implemented in this pilot. Every other tab renders a **"Coming soon"** placeholder.
- Inside the Booking tab: blocks rendered as a **horizontal pipeline** in stage order:
  `greeting → discovery → showcase → comparison → conversion → followup → handoff`
- Each block card shows **three health dots**:
  1. Flow connected
  2. Module connected
  3. Fields bound
- Dot values come from the latest `EngineHealthDoc` for the selected partner (or a global placeholder if no partner selected — document chosen behaviour in code).

## Constraints

- Do not render booking blocks under any other engine tab.
- Reuse the existing block-card component if present; only add the dot row.
- Health dots read via `getEngineHealth` from M07 — never recompute in the component.

## Acceptance

- Visual diff reviewed manually against current admin screenshot.
- Booking tab shows the stage-ordered pipeline.
- Health dots render from real data for a hotel test partner.
- Other tabs render only the "Coming soon" placeholder.
- No console errors, no failing lints.

## Commit

`[booking-pilot M08] admin blocks UI: engine tabs + booking pipeline + health dots`
