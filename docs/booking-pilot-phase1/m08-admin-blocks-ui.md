# M08 — Admin UI: engine tabs in `/admin/relay/blocks`

**Files:**
- `src/app/admin/relay/blocks/page.tsx`
- `src/app/admin/relay/blocks/components/{EngineTabs,BookingPipeline,BlockCard,HealthDots}.tsx`
- Server data loader

**Goal:** Top-level engine tab navigation. Booking tab fully implemented (stage-ordered horizontal pipeline + Health dots). Other engine tabs render a "Coming soon" placeholder.

## Layout

```
PartnerSelector (existing)
EngineTabs: Commerce | Booking | Lead | Engagement | Info | Service
└── Booking tab: horizontal pipeline by stage
    └── Block cards with three Health dots (Flow / Module / Fields)
```

- Health dots sourced from `EngineHealthDoc` for `(selectedPartner, 'booking')`.
- Reuse the existing `HEALTH_STYLES` Tailwind classes from `binding-health.ts`.
- Read-only — no writes added in this milestone.

## Acceptance

- [ ] Engine tabs render; Booking is active by default
- [ ] Booking tab shows a stage-ordered pipeline of all booking + shared blocks
- [ ] Health dots fill from the real `EngineHealthDoc` when a partner is selected
- [ ] No partner selected → catalog view (no dots)
- [ ] Other tabs show "Coming soon" placeholder with no console errors
- [ ] No new write surface
- [ ] Existing page tests pass (or are legitimately updated)

## Escalation triggers

- Current page is entangled with non-tab logic that prevents a clean refactor
- `EngineHealthDoc` is missing fields the dots need

## Commit

`[booking-pilot M08] admin blocks UI: engine tabs + booking pipeline + health dots`
