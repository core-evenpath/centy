# /partner/relay Phase 3 Booking — Retrospective

Session: /partner/relay Phase 3 (single-session covering M01 + M02;
M03 deferred per kickoff decisions).
Branch: `claude/partner-relay-phase-3` (off `main` at `3dd4c5ce`).
Baseline throughout: tsc 276.

## 1. Commits shipped

| SHA | Commit | tsc | tests |
|---|---|---|---|
| `6ca8cc50` | `[P3.M01] booking: holds reducer + session group + anon-allowed mutations` | 276 | 653 |
| `79da05a6` | `[P3.M02] bookings: confirmBookingAction — second consumer of requireIdentityOrThrow` | 276 | 664 |

**2 milestone commits.** tsc held at 276. Tests 627 → 664 (+37).

## 2. Kickoff decisions & execution

Infrastructure survey surfaced three halt conditions; operator decided
at kickoff:

| Decision | Chosen | Outcome |
|---|---|---|
| A (existing confirmBookingAction handling) | **A3 — extend** with optional `holdId` param | Existing slot-flow preserved and now gated on Health + Identity; new hold-flow adds typed error codes. Zero callers broken; gates now enforced on both paths. |
| B (collection path) | **B2 — reuse `partners/{pid}/relayBookings`** | Match existing local convention. Divergence from Phase 2's `partners/{pid}/orders` (no `relay` prefix) documented as future cleanup ADR candidate. |
| C (M03 `booking_confirmation` block) | **C2 — defer M03** | Block not in registry; registration belongs with block-registry workflow, not inside a booking phase. Follow-up session. |

## 3. Reducer pattern — second confirmation

The cart-reducer pattern from Phase 2 ported cleanly to bookings:

- Pure reducer in `src/lib/relay/booking/booking-reducer.ts`
- Pure tests exercise the state machine without Firestore
- Thin action orchestration layer persists via `setSessionBooking`
- Single-writer discipline preserved (booking-actions.ts is the only
  writer of `booking.holds`)

**Cart-specific details that did NOT port 1:1:**
- Bookings carry conflict semantics (same resource + overlapping
  interval) that carts don't; new `BookingHoldConflictError`.
- Bookings have a limit (`MAX_CONCURRENT_HOLDS = 5`) that carts don't;
  `BookingHoldLimitError`.
- Bookings have per-field TTL (`holdExpiresAt`) with on-read + on-write
  sweep; carts have a single `expiresAt` with application-level check.
- The reducer takes the **whole group** (slots + holds) and returns it,
  not just the holds array — the nested shape matters because other
  actions (slot-flow) also write to the same sub-object.

**Abstraction opportunity noted, deferred.** Both reducers produce
`RelaySession[group]` from a partial + a now; the shape is similar.
But extracting a shared `reduceGroupedSubObject` helper now would be
pre-abstraction on two data points. Wait for Phase 4 Space. After
three consumers, the DRY decision has sufficient signal.

## 4. `requireIdentityOrThrow` — second consumer confirmed

Phase 1 retro predicted `createOrder` → `confirmBooking` →
`confirmSpace` as the commit-gate consumer sequence. Confirmed:

| Consumer | Shipped in | File |
|---|---|---|
| `createOrderFromCartAction` | Phase 2 M02 | `src/actions/relay-orders/create-order.ts` |
| `confirmBookingAction` | Phase 3 M02 | `src/actions/relay-runtime/booking-actions.ts` (extended) |
| `confirmSpaceAction` | Phase 4 M02 (pending) | — |

Grep post-M02: `grep -rn "requireIdentityOrThrow" src/actions` returns
exactly these two consumers. Same gate path, same typed error code
surface (`IDENTITY_REQUIRED`).

## 5. Three-gate sequence — template extended

Phase 2's Health → Identity → (Cart/Hold/Slot) pattern now applies
to both booking paths:

- **Slot-flow** (legacy): Health → Identity → NO_TENTATIVE_SLOTS
- **Hold-flow** (P3.M02): Health → Identity → HOLD_MISSING_OR_EXPIRED

Typed error codes on `ConfirmBookingResult.code` — callers can render
actionable messages. Legacy callers that read only `success`/`error`
continue to work without code changes.

## 6. Race surface — documented, not fixed

**Cross-session slot coordination is NOT implemented.** Two sessions
in the same partner can hold + confirm the same `resourceId +
[startAt, endAt)` interval in parallel; both writes succeed.

**Acceptable under current invariants:**
- Phase 3 Observation closure (P3.M09 pending M07) says no production
  partners exist — zero traffic, zero collision risk today.
- The hold reducer's in-session conflict check catches same-session
  attempts; only cross-session is unguarded.

**When to fix:** first partner deployment with measurable traffic.
Fix = `slotReservations/{partnerId}/{resourceId}_{startAt}` collection
with create-if-not-exists transaction semantics. Deferred to
`PHASE_4_BACKLOG.md` (§10 below).

## 7. On-read + on-write expiry sweep

No background cron. Invariant per session kickoff prompt.

- **On-write:** every reducer op (`addBookingHold`, `extendBookingHold`,
  `releaseBookingHold`) calls `pruneExpiredHolds` at entry.
- **On-read:** `confirmBookingAction` (hold-flow) calls
  `pruneExpiredHolds` before the hold-lookup, so an expired hold
  surfaces as `HOLD_MISSING_OR_EXPIRED`.

Verified by the `on-read prune` test in `confirm-booking-p3.test.ts` —
a seeded expired hold is correctly rejected without the reducer
being invoked first.

## 8. Composite Firestore indexes — operator action

Adding to the operator checklist alongside Phase 2's index:

```
Collection: partners/{partnerId}/relayBookings
Fields:
  - contactId  (ASC)
  - createdAt  (DESC)
```

Required for M03's `loadBookingConfirmationData` query once M03 ships
in a follow-up session. Mock tests pass without it; real Firestore
will reject the query.

## 9. Open items for Phase 4 Space

Explicit carry-forward list so Phase 4 kickoff doesn't re-derive:

1. **`spaceHolds[]` reducer** mirrors `booking-reducer.ts`
   closely — date-range vs slot-range is the main differentiator:
   - `startAt`/`endAt` become `checkIn`/`checkOut` (date, not ISO
     timestamp)
   - `intervalsOverlap` helper reusable as-is on dates
   - Same `MAX_CONCURRENT_HOLDS` cap; separate constant if space
     needs a different value
2. **`confirmSpaceAction`** is the **third** `requireIdentityOrThrow`
   consumer. If the action bodies converge on shape after Phase 4,
   extract a shared `commit-boundary-helpers.ts` (three-gate wrap,
   typed error codes).
3. **Session field path:** `spaceHolds[]` nests under a new `space`
   sub-object, NOT under `booking.holds[]` (space is its own engine
   per ADR).
4. **Collection path:** match B2 convention — `partners/{pid}/relaySpaces`
   (or `relayReservations`). Decide at Phase 4 kickoff based on what
   the existing code reveals.

## 10. Deferred items → `PHASE_4_BACKLOG.md`

1. **`booking_confirmation` block (M03 from this session)** — block
   not in registry; requires block-registry milestone before the data
   loader lands. Follow-up session.
2. **Cross-session slot coordination** — `slotReservations`
   collection, transactional create-if-not-exists. Phase 4+ if
   partner traffic warrants.
3. **Calendar provider integrations** (Cal.com, Google Calendar,
   Outlook) — explicit scope exclusion.
4. **Booking modifications / cancellations post-confirm** — requires
   refund-adjacent architecture; Phase 4+.
5. **Waitlists, standby, recurring bookings** — all out of scope.
6. **Background cron sweeper** — architectural rejection stands;
   on-read + on-write is the invariant.
7. **`relayBookings` → `bookings` rename** — B2 decision noted; future
   cleanup ADR if naming inconsistency with Phase 2's `orders` becomes
   a hot spot.
8. **Reducer abstraction** (cart + booking + space → generic grouped
   sub-object reducer) — Phase 4 close is the decision point once
   there are three data points.
9. **ADR §Follow-ups** — `docs/engine-architecture.md §8 invariant #4`
   update still pending Session 3 M07. This is the **THIRD** partner-
   relay retro flagging it.

## 11. Discipline check

- ✅ Phase 2 + ADR merged to main before Phase 3 started
- ✅ Branched off fresh main (not stacked on open branches)
- ✅ Reducer pure (no Firestore imports in booking-reducer.ts)
- ✅ `pruneExpiredHolds` called at every reducer op entry
- ✅ `pruneExpiredHolds` called on hold-flow confirm read path
- ✅ Single-writer discipline: only booking-actions.ts calls
     `setSessionBooking`
- ✅ Hold mutations anon-allowed (no `requireIdentityOrThrow`)
- ✅ `confirmBookingAction` is the **only** new `requireIdentityOrThrow`
     consumer this phase (verified via grep — total consumers = 2)
- ✅ Three-gate order: Health → Identity → Hold/Slot
- ✅ Collection path matches existing local convention
- ✅ tsc ≤ 276 every commit
- ✅ Speculative-From footers reference ADR sections
- ✅ No calendar integration, no cancellation, no waitlists
- ✅ No reducer abstraction (waiting for Phase 4 third data point)

## 12. Session close

2 milestones shipped (M03 deferred). /partner/relay Phase 4 Space is
unblocked; same reducer + three-gate template applies with date-range
hold semantics.

**Phase 4 can start when:**
1. Phase 3's 2 commits merge to main.
2. Fresh main carries `booking-reducer.ts`, `addBookingHold`,
   `confirmBookingAction` with `holdId?` param.
3. A Phase 4 Space kickoff prompt references this retro's §9.

**Follow-up session for M03:**
1. Register `booking_confirmation` in
   `_registry-data.ts` alongside other commerce-adjacent blocks.
2. Ship `loadBookingConfirmationData` mirroring
   `loadOrderTrackerData` exactly.
3. Wire in orchestrator.
4. Extend `MiniBookingConfirmation` (or register new preview) to
   accept the data shape.

Estimated follow-up budget: ~45min (same scope pattern as P2.M03).
