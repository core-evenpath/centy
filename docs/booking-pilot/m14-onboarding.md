# M14 — Onboarding: deterministic recipe picker

## Files

- `src/app/admin/onboarding/relay/page.tsx` (new or extension of existing onboarding)
- `actions/onboarding-actions.ts` (extend; keep existing exports)

## Form (3 questions)

1. **Business function** — single-select from `BUSINESS_FUNCTIONS` (source: `lib/business-taxonomy/industries.ts`).
2. **Customer journey type** — multi-checkbox mapping to engines (e.g., "Customers book time/rooms/tickets" → `booking`).
3. **Post-conversion needs** — yes/no for `service` overlay (e.g., "Do customers manage/track their bookings after?").

## On submit (deterministic)

1. Compute engines:
   - Start from `deriveEnginesFromFunctionId(functionId)` (M03).
   - Merge/override with the form checkboxes.
2. Write `partner.engines` + `partner.engineRecipe`:
   - `'custom'` if the user modified the derived set.
   - `'auto'` if they accepted the derived set unchanged.
3. **Instantiate starter blocks:** enable all booking-tagged blocks appropriate for the chosen sub-vertical (derive starter set from A1 inventory).
4. **Clone the matching booking flow template** (M05) into the partner's flow collection.
5. Trigger Health compute (M07).

## Constraints

- No AI calls for classification or suggestion.
- Never overwrite an existing partner's engines silently — prompt for confirmation if `partner.engines` is already set.

## Acceptance

- New hotel partner onboarded via this form has:
  - `engines: ['booking', 'service']`
  - Enabled blocks matching the hotel starter set (assert against a fixture list)
  - One active flow cloned from the hotel template
  - Health document written (likely amber due to empty modules — acceptable)
- Deterministic: same form input → same partner state.

## Commit

`[booking-pilot M14] onboarding recipe picker: deterministic engines + starter blocks + flow clone`
