# M14 — Onboarding: deterministic recipe picker

**Files:**
- `src/app/admin/onboarding/relay/page.tsx`
- `actions/onboarding-actions.ts`
- `lib/relay/onboarding/starter-blocks.ts` (new)

**Goal:** A 3-question form that deterministically produces a runnable Booking config.

## Questions

1. **Business function** — dropdown of `BUSINESS_FUNCTIONS`, single-select.
2. **Customer journey type** — multi-select, **pre-checked from M03 derivation**:
   - Buy goods
   - Reserve time
   - Submit inquiry
   - Donate / sign up
   - Look up info
3. **Track or manage afterwards?** — yes/no. Yes → `service` auto-included.

## Apply action

```ts
export async function applyEngineRecipe(partnerId: string, input: {
  functionId: string;
  engines: Engine[];
  recipeKind: 'auto' | 'custom';
}) {
  // 1. Write partner.engines, partner.engineRecipe, partner.businessPersona...functionId
  // 2. For each Booking-supported engine in input.engines:
  //    a. Enable starter blocks (partnerBlockPrefs.{blockId}.isVisible = true)
  //    b. Clone flow template into the partner's flow collection (status: 'active')
  // 3. Trigger Health recompute per engine
  // 4. Return summary
}
```

## Starter block sets per `functionId`

Curated per sub-vertical. Example for `hotels_resorts`:

```
greeting, quick_actions, availability, rooms, amenities, room-card,
room-detail, property-gallery, compare, booking, order_confirmation,
transfer, contact
```

## Rules

- If the partner already has an active Booking flow: **warn, don't silently overwrite**.
- For non-Booking engines selected: write to `partner.engines` only. **No starter content.** Health for those will be red — that is expected and correct in shadow mode.

## Acceptance

- [ ] 3-question form pre-fills Q2 from Q1
- [ ] Submit writes engines, recipe, functionId
- [ ] Booking enables starter blocks + clones flow
- [ ] Health recomputes per engine
- [ ] Re-onboarding warns rather than overwrites
- [ ] Newly onboarded partner runs ≥ 1 Preview Copilot script without errors
- [ ] No starter content written for non-Booking engines

## Escalation triggers

- Existing onboarding conflicts with the new flow
- Partner persona shape blocks the write
- Multiple active flows create ambiguity

## Commit

`[booking-pilot M14] onboarding recipe picker: deterministic engines + starter blocks + flow clone`
