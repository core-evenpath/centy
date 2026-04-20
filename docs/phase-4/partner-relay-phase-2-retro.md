# /partner/relay Phase 2 Commerce — Retrospective

Session: /partner/relay Phase 2 (single-session covering M01 + M02 + M03).
Branch: `claude/partner-relay-phase-2` (off `main` at `3d71b02e`).
Baseline throughout: tsc 276.

## 1. Commits shipped

| SHA | Commit | tsc | tests |
|---|---|---|---|
| `22daf8b7` | `[P2.M01] commerce: cart reducer + currency + TTL (anon-allowed)` | 276 | 611 |
| `2610ed76` | `[P2.M02] orders: createOrder identity gate + contactId snapshot` | 276 | 619 |
| `5fba26b1` | `[P2.M03] commerce: order_tracker reads from partners/{pid}/orders` | 276 | 627 |

**3 commits.** tsc held at 276 every commit. Tests 590 → 627 (+37).

## 2. `requireIdentityOrThrow` first production consumer — confirmed

Phase 1 retro §5 predicted `createOrderFromCartAction` as the first
production consumer of `requireIdentityOrThrow`. **Confirmed in
`2610ed76`:** `src/actions/relay-orders/create-order.ts` now imports
the helper and calls it as Gate #2 of a three-gate sequence:

1. **Health gate** — `evaluatePartnerSaveGate(partnerId)` — fails
   closed BEFORE asking for customer PII. Deny on red engine.
2. **Identity gate** — `requireIdentityOrThrow(session)` — throws
   `IdentityRequiredError` on anon session.
3. **Cart gate** — `session.cart.items.length === 0` — deny on empty
   cart.

All three map to typed error codes (HEALTH_RED, IDENTITY_REQUIRED,
EMPTY_CART, INVALID_INPUT, INTERNAL_ERROR). Callers can render
actionable messages without parsing error strings.

## 3. Cart reducer as reusable pattern

Extracted `reduceCartAdd` / `reduceCartUpdate` / `reduceCartRemove` /
`reduceCartApplyDiscount` as pure functions in
`src/lib/relay/commerce/cart-reducer.ts`. Tests exercise the state
machine without Firestore; actions are thin orchestration.

**Phase 3 Booking and Phase 4 Space should mirror this shape for
their holds reducers.** If the abstraction stays clean across two
instances, extract to a generic `reduceGroupedSubObject` helper
then; don't pre-abstract off one data point.

## 4. `orders` collection location

Used existing `partners/{partnerId}/orders` convention per the
prompt's "if existing convention, use it" instruction. The ADR's
conceptual root-level `orders/` was not shipped. Rationale:

- Existing `order-store.ts` + `order-types.ts` + `create-order.ts`
  already established the per-partner subtree path pre-Phase-2.
- Cross-partner queries ("all orders for contactId X") are not
  currently required; if they become required, an indexed `contactId`
  field on a separate root collection can be added without breaking
  the partner-subtree canonical path.
- Phase 2 scope was Commerce functional minimum; path migration
  would have been scope expansion.

If future architecture needs cross-partner contact views, flag as an
ADR addendum — don't silently migrate.

## 5. Firestore indexes required

The P2.M03 contact-scoped query requires a composite index:

```
Collection: partners/{partnerId}/orders
Fields:
  - contactId  (ASC)
  - createdAt  (DESC)
```

Production deployment must create this via Firebase console before
shipping P2.M03 code to prod. The mock tests pass without it
(in-memory sort), but real Firestore will reject the query.

**Action item for operator:** add the index; verify `order_tracker`
query succeeds in staging before prod rollout.

## 6. Shape decisions — deviations from prompt

The prompt specified a fresh minimal Order shape (`{id, partnerId,
contactId, items, totals, status: 'placed', ...}`). **Shipped
differently:** existing richer `RelayOrder` (addresses, payment
tracking, timeline, etc.) was preserved additively — `contactId`
added as optional, required for new creates via the identity gate.

Rationale: pre-Phase-2 order shape predates ADR-P4-01 and was
out-of-scope to reshape. The ADR wins on schema semantics; the
prompt's minimal shape was an aspiration, not a reshape mandate.
Speculative-From footers reference ADR sections, not the prompt.

If a downstream consumer surfaces confusion from the richer shape,
this becomes an ADR-addendum decision, not a silent migration.

## 7. Integration test shape (ADR template)

`src/actions/__tests__/create-order-p2.test.ts` has the canonical
ADR integration flow for Phase 3 Booking and Phase 4 Space to copy:

1. Start anon session; add anon-allowed content (cart item).
2. Call commit action → expect `IdentityRequiredError` code.
3. `resolveContact(partnerId, phone)` + `setSessionIdentity(...)`.
4. Retry commit → expect success; verify contactId snapshot on
   output.
5. Verify sibling sub-objects preserved (session identity stays,
   other sub-objects untouched).

Phase 3 Booking's `confirmBookingAction` test should mirror this
with `bookingHolds[]` instead of `cart`.

## 8. Open items for Phase 3 Booking

Carried forward for Phase 3 kickoff:

1. **Booking holds reducer.** Mirror `cart-reducer.ts` shape:
   `reduceBookingHoldsAdd`, `reduceBookingHoldsRemove`,
   `reduceBookingHoldsExpire`. Holds carry `holdExpiresAt` per hold
   (~15min per ADR §TTL), distinct from cart's 2h idle.
2. **Second consumer of `requireIdentityOrThrow`** is
   `confirmBookingAction` (not the existing `reserveSlotAction`
   which is anon-allowed hold creation). `requireIdentityOrThrow`
   becomes a reusable gate rail.
3. **Session field path** — `booking.holds[]` via dotted field-path
   updates (field-path discipline from P1.M01). Do NOT add holds as
   a new top-level field on RelaySession; nest under existing
   `booking` sub-object per ADR §Schema.
4. **Cross-engine atomicity** — hold→booking-confirmed is a single
   session-doc update + a separate-collection booking doc write.
   Same pattern as createOrder's cart-drain + order-create. Failure
   order: write booking first, then drop the hold (idempotent retry
   OK).

## 9. ADR §Follow-ups status

`docs/engine-architecture.md §8 invariant #4` update (per ADR-P4-01
§Follow-ups) **still pending Session 3 M07**. That file does not
yet exist. Phase 2 did not land the update. Flagging (again) for
M07 to pick up.

## 10. Discipline check

- ✅ Phase 0 + Phase 1 merged to main before Phase 2 started
- ✅ Branched off fresh main (not stacked on open branches)
- ✅ Field-path writes preserved on session (P1.M01 discipline held)
- ✅ Cart mutations remain anon-allowed (no `requireIdentityOrThrow`
     call added)
- ✅ `createOrder` is the ONLY `requireIdentityOrThrow` consumer
     (verified via grep)
- ✅ Three-gate ordering: Health → Identity → Cart
- ✅ `order_tracker` read path is NOT health-gated (ADR: gating is
     save-path only)
- ✅ Anon-friendly graceful degradation on `order_tracker` (empty
     orders, not throw)
- ✅ tsc ≤ 276 every commit
- ✅ Speculative-From footers reference ADR-P4-01 sections
- ✅ No payment, no status transitions, no editing (scope preserved)

## 11. Deferred items → `PHASE_4_BACKLOG.md`

Surfaced during Phase 2, not addressed:

1. **Payment gateway integration** — explicit scope exclusion. Deferred.
2. **Order status transitions** (placed → confirmed → shipped → delivered → cancelled → refunded). Shipped as pending only; transitions need a separate action per status, per-status auth rules, admin UI. Phase 3+ if a partner needs it.
3. **Order editing / cancellation post-create.** Out of scope; needs refund path consideration.
4. **Multi-partner carts.** Single-partner-per-conversation invariant held.
5. **Tax / shipping / discount totals.** Current `computeOrderPricing` uses zero for tax and shipping; discount path works. Revisit when a partner deploys real tax/shipping rules.
6. **Cart sweeper** for expired carts past `expiresAt`. Read-path today returns expired carts; ADR §TTL flagged this for Phase 2 retro — currently **not load-bearing** (cart reuse across sessions not exposed), so deferred. If cart abandonment telemetry becomes relevant, revisit.
7. **Composite Firestore index** for `partners/{pid}/orders` contactId+createdAt descriptor (§5). **Operator action item**, not a code deferral.

## 12. Session close

3 milestones shipped. /partner/relay Phase 3 Booking unblocked.
Phase 3 will consume `requireIdentityOrThrow` at `confirmBookingAction`
and mirror the cart-reducer pattern for `bookingHolds[]`.

**Phase 3 can start when:**
1. Phase 2's 3 commits merge to main.
2. Fresh main carries cart-reducer, order identity gate, and
   order_tracker data loader.
3. A Phase 3 Booking kickoff prompt references the holds-reducer
   pattern from this retro's §3 and §8.

Estimated Phase 3 budget: ~2 hours — the cart-reducer template
means most of the infrastructure discovery is already done.
