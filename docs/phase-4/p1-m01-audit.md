# P1.M01 — Session-store write-discipline audit

Session: /partner/relay Phase 1, Milestone M01 audit.
Branch: `claude/partner-relay-phase-1` (off `main` at `d34d230b`).
Baseline: tsc = 276, tests = 556/556 green.
Date: 2026-04-20.

"Evidence precedes change" (Phase 3 tuning §4.1). Per
ADR-P4-01 §Prerequisite, Phase 1's first commit must migrate session
writers from `.set({...}, { merge: true })` (whole-doc merge) to
Firestore field-path `.update({...})` before any new sub-object
lands. This doc inventories the sites and the migration shape.

---

## Direct `.set()` call sites in `session-store.ts`

```bash
grep -n "\.set(" src/lib/relay/session-store.ts
```

| Line | Function | Shape | Array-clobber risk? |
|---|---|---|---|
| 47 | `saveSession()` | `.set(updatedSession, { merge: true })` — full-doc merge | **Yes.** When a future write passes `{ booking: { holds: [...] } }` without including `booking.slots`, deep merge replaces the `booking` object wholesale and the `slots` array is lost. Triggers once new nested arrays land (ADR Schema). |
| 58 | `loadOrCreateSession()` | `.set(fresh)` — no merge; genuine initial-write | **No.** Fires only when `existing === null` (no doc present). This is correct behavior for the create path; kept as-is. |
| 70 | `setActiveEngine()` | `.set({ activeEngine, updatedAt }, { merge: true })` — scalar-only merge | **Low today.** The payload contains only scalar fields, so the current call is array-safe. Converting to `.update()` aligns with the discipline and removes the "someday someone adds a nested field here" risk. |

**Direct site count: 3.** Under the halt threshold of 5. No additional
`.set()` calls on `relaySessions/*` exist in the repo.

## Indirect callers (via `saveSession()`)

Every caller of `saveSession` inherits the whole-doc merge at line 47.
Grep:

```bash
grep -rn "saveSession\b" src/ --include="*.ts" | grep -v __tests__
```

| File | Line | Mutation shape |
|---|---|---|
| `src/actions/relay-runtime/cart-actions.ts` | 61 | `addToCartAction` — mutates `cart` |
| `src/actions/relay-runtime/cart-actions.ts` | 84 | `updateCartItemAction` — mutates `cart` |
| `src/actions/relay-runtime/cart-actions.ts` | 100 | `removeFromCartAction` — mutates `cart` |
| `src/actions/relay-runtime/cart-actions.ts` | 114 | `clearCartAction` — replaces `cart` |
| `src/actions/relay-runtime/cart-actions.ts` | 154 | `applyDiscountCodeAction` — mutates `cart` |
| `src/actions/relay-runtime/booking-actions.ts` | 46 | `reserveSlotAction` — mutates `booking.slots` |
| `src/actions/relay-runtime/booking-actions.ts` | 63 | `cancelSlotAction` — mutates `booking.slots` |
| `src/actions/relay-runtime/booking-actions.ts` | 84 | `confirmBookingAction` — mutates `booking.slots` (flips status) |
| `src/actions/relay-runtime/session-actions.ts` | 62 | `updateRelaySessionAction` — merges `customer / booking / cart` |
| `src/actions/relay-orders/create-order.ts` | 119 | post-order cart clear |

**Indirect call count: 10.** These inherit the risk through
`saveSession`'s implementation, not directly.

## Migration shape

Two options considered; picking the second per ADR single-writer-per-
field discipline:

1. **Keep `saveSession`, rewrite its body to field-path.** Would require
   computing a diff or unconditionally writing every field — messy,
   loses single-writer-per-field clarity.
2. **Targeted setters per sub-object.** Match ADR §Schema's ownership
   table (each sub-object has one writer-module). Add:
   - `setSessionCart(partnerId, conversationId, cart)` — cart-actions
   - `setSessionBooking(partnerId, conversationId, booking)` — booking-actions
   - `setSessionCustomer(partnerId, conversationId, customer)` — session-actions
   - `updateSession(partnerId, conversationId, updates)` — generic field-path wrapper for mixed-sub-object cases (session-actions, create-order)
   - `setActiveEngine` — convert `.set(..., merge:true)` to `.update()` in place
   - **Keep** `newSession` + `loadOrCreateSession`'s initial-write `.set(fresh)` — that's a genuine create, not a merge
   - **Delete** `saveSession` public export after migrating all callers

Migrate the 10 callers to the targeted setters. Each caller drops its
`{ ...session, cart }` spread-then-write pattern and calls the setter
directly with just the sub-object it owns.

## Doc-existence guard

Per prompt: `.update()` fails if the doc doesn't exist. Every current
caller pattern already goes through `loadOrCreateSession()` first —
which creates the doc via `.set(fresh)` before any subsequent
`.update()` runs. So the existing code ordering is already
`.update()`-safe; no new `ensureSession` helper needed.

Explicit assertion for the migration tests: every setter's doc-ref
assumption is "session exists" because callers load-or-create before
mutating. The targeted setters inherit that invariant without an
extra `ensureSession` round-trip.

## Behavior preservation

The migration is semantically equivalent for current data shapes (no
nested arrays under the merged fields today that would be clobbered
by whole-doc merge). The value is **future-proofing against ADR
Schema additions** — when Phase 3 adds `bookingHolds[]` or Phase 4
adds `spaceHolds[]`, the field-path discipline prevents silent data
loss at the first cross-concern write.

## Tests to add post-migration

Per prompt exit check:

1. **Per-setter isolation:** seed a session with multiple sub-objects
   (cart, booking, customer, activeEngine). Call one setter. Assert
   the other sub-objects are untouched.
2. **Array-clobber regression:** seed a session with
   `booking.slots = [slot_a, slot_b]`. Write a future-shaped nested
   payload that would've wiped `slots` under whole-doc merge (simulate
   by updating `'booking.nestedFutureField': 'x'` via field path).
   Assert `booking.slots` intact.

## Proceeding

Audit commit ships first. Migration commit follows with:
- 5 targeted setters added to `session-store.ts`
- `setActiveEngine` converted in place
- `saveSession` removed
- 10 callers migrated
- 2 new tests per §above
- Existing tests stay green (no behavioral change)

No new fields introduced by M01 — only write discipline. Identity
fields (`identity.contactId`, etc.) land in M03 after M01's
infrastructure is in place.
