# /partner/relay Phase 4 Space — Retrospective

Session: /partner/relay Phase 4 (single-session covering M01 + M02;
M03 deferred per Phase 3 precedent).
Branch: `claude/partner-relay-phase-4` (off `main` at `4d9e212f`).
Baseline throughout: tsc 276.

## 1. Commits shipped

| SHA | Commit | tsc | tests |
|---|---|---|---|
| `496d5119` | `[P4.M01] space: spaceHolds[] reducer + session group (schema only)` | 276 | 679 |
| `da998e50` | `[P4.M02] space: holds actions + confirmSpaceAction (third consumer)` | 276 | 692 |

**2 milestone commits.** tsc held at 276 every commit. Tests
664 → 692 (+28).

## 2. Kickoff decisions — clean slate, defaults applied

Infrastructure survey surfaced zero existing space code (the
`checkIn/checkOut` hits were hotel-policy display data, unrelated to
session state). Greenfield; no halt conditions triggered. Defaults:

| Decision | Chosen | Rationale |
|---|---|---|
| Sub-object placement | Top-level `session.space`, not nested under `booking` | ADR §Schema treats space as its own engine; sibling of booking, not a sub-section |
| Hold shape | `checkIn` / `checkOut` as `YYYY-MM-DD` dates (not timestamps) | Spaces are date-range commitments (nights), not time-slot precision |
| Overlap semantics | Half-open intervals `[checkIn, checkOut)` | Adjacent-date sequential holds (A checks out morning of date X, B checks in same date X) are not conflicts |
| Collection path | `partners/{pid}/relayReservations` | Matches P3's `relayBookings` local convention; reservations = confirmed space booking |
| TTL | 15min (same as booking) | Tunable if operator feedback surfaces need; baseline matches P3 |
| M03 (`space_confirmation` block) | Defer | Block not in registry; bundled with P3.M03 follow-up session |

## 3. Reducer pattern — third data point

`space-reducer.ts` is the third pure reducer in the `/partner/relay`
surface (after `cart-reducer.ts` and `booking-reducer.ts`). Same
shape across all three:

- Pure state transitions; no Firestore imports
- Takes group + input + `now`, returns new group
- Actions orchestrate I/O and persist via a single targeted setter
- Error classes for deny cases (`*ConflictError`, `*LimitError`;
  space added `*InvalidRangeError` for date validation specific to
  space's shape)

**Space-specific deviations from booking:**
- Date-range overlap uses string comparison (`'2026-05-01' < '2026-05-04'`
  works lexicographically for YYYY-MM-DD); booking uses `Date.parse`
  on ISO timestamps. Different primitive, same algorithmic shape.
- `SpaceHoldInvalidRangeError` guards date format + `checkIn < checkOut`.
  Booking's slot intervals enter the reducer as pre-parsed ISO
  timestamps from upstream; trust is placed higher in the stack.
- Half-open interval semantics are explicit for spaces
  (adjacent-date is not a conflict); booking's time-range is also
  half-open but the application pattern is different.

## 4. `requireIdentityOrThrow` — three consumers (prediction confirmed)

Phase 1 retro §5 predicted the sequence. Confirmed post-Phase-4:

| Consumer | Shipped | File | Three-gate order |
|---|---|---|---|
| `createOrderFromCartAction` | P2.M02 | `src/actions/relay-orders/create-order.ts` | Health → Identity → Cart-non-empty |
| `confirmBookingAction` | P3.M02 | `src/actions/relay-runtime/booking-actions.ts` | Health → Identity → Hold-or-slot |
| `confirmSpaceAction` | P4.M02 | `src/actions/relay-runtime/space-actions.ts` | Health → Identity → Hold-valid |

Grep verifies exactly 3 consumers across `src/actions/`.

## 5. Abstraction decision — defer extraction, ship 3 parallel

**Decision: keep all three commit actions as parallel implementations
for now. Do NOT extract a shared `commit-boundary-helpers.ts` this
session.**

### What the three share

Comparing `createOrder`, `confirmBooking` (hold-flow branch), and
`confirmSpace`:

1. `evaluatePartnerSaveGate(partnerId)` call + `HEALTH_RED` deny
2. Load session + catch `IdentityRequiredError` wrapping of
   `requireIdentityOrThrow` + `IDENTITY_REQUIRED` deny
3. Specific third gate (cart-non-empty / hold-present / hold-present)
4. Write side-effect doc + release/drain session sub-object
5. Typed-code error envelope

### What differs

- **Cart**: no concept of per-item holds; drains cart atomically on
  success.
- **Booking**: supports two input models (hold-flow + legacy
  slot-flow); single action with `holdId?` param.
- **Space**: single clean hold-flow; no legacy path.
- **Error code unions differ** per action's domain
  (`EMPTY_CART` vs `NO_TENTATIVE_SLOTS` vs `HOLD_MISSING_OR_EXPIRED`).
- **Side-effect doc shape differs** (orders vs bookings vs
  reservations).
- **Release mechanism differs** (cart → `FieldValue.delete()` /
  reducer result via setSessionCart; booking → reducer output via
  setSessionBooking; space → reducer output via setSessionSpace).

### Why NOT extract now

The commonality is ~20 lines per action (the three gates + error
envelope). The differences are the substantive part — the domain-
specific third gate, release semantics, and side-effect doc shape.

An extraction that hides the three gates behind a
`withCommitBoundary(partnerId, session, (ctx) => ...)` wrapper would:
- Add a layer of indirection without removing significant code
- Force either a type-union'd error code or a `string & {}` code
  parameter — both less ergonomic than the current per-action codes
- Make the wire-order (Health → Identity → domain) harder to read

**Three data points are enough to decide; the decision is "no
extraction yet."** The actions are readable, the pattern is
established, and future commit actions can follow the same template
without needing the abstraction.

### Re-visit conditions

Extract when ≥5 commit consumers exist OR when a fourth consumer
surfaces a gate-ordering variation (e.g., Health gate that
short-circuits _after_ identity for some specific commit action).
The current shape handles 3 cleanly; the 4th either confirms the
pattern or reveals a variation worth abstracting around.

## 6. Session schema at Phase 4 close

`RelaySession` now carries:

| Field | Shipped | Purpose |
|---|---|---|
| `conversationId`, `partnerId` | pre-Phase-4 | identity |
| `cart` | P2.M01 | commerce cart + `currency?` + `expiresAt?` |
| `booking` | P3.M01 | booking with `slots[]` (legacy) + `holds[]` (P3) |
| `customer?` | pre-Phase-4 | display data |
| `createdAt/updatedAt/expiresAt` | pre-Phase-4 | timestamps |
| `activeEngine?` | P1 pilot | sticky engine selector |
| `identity?` | P1.M03 | `{ contactId, resolvedAt }` |
| `space?` | **P4.M01 (new)** | `{ holds: [...] }` |

Top-level sub-object count: cart + booking + customer + identity +
space = 5. Engine-scoped `serviceContext.{commerce/booking/space}`
per ADR not yet shipped (deferred — first confirmed action writes
to dedicated collections, not to session).

## 7. Cross-session race surface — same as P3

Same "two sessions could hold + confirm the same resource in
parallel" race exists for space reservations. Acceptable under
zero-production-traffic invariant. Phase 4+ concern if partner
traffic warrants a `spaceReservations` transactional collection.

## 8. Composite Firestore index — operator checklist

Adding to the operator action list (alongside P2's `orders` and
P3's `relayBookings`):

```
Collection: partners/{partnerId}/relayReservations
Fields:
  - contactId  (ASC)
  - createdAt  (DESC)
```

Required for M03's `loadSpaceConfirmationData` query when M03 follow-
up ships. Mock tests pass without it.

## 9. Open items

**For the M03 block-registry follow-up session:**
1. Register `booking_confirmation` (from P3.M03 deferral)
2. Register `space_confirmation` (from P4.M03 deferral)
3. Ship `loadBookingConfirmationData` + `loadSpaceConfirmationData`
   mirroring `loadOrderTrackerData` exactly
4. Wire into orchestrator
5. Extend or register preview components
6. With 3 data loaders (order_tracker, booking_confirmation,
   space_confirmation), the data-loader abstraction check has
   sufficient signal — second DRY decision point, parallel to the
   commit-gate one.

**For a future cleanup ADR (low priority):**
1. `relayBookings` / `relayReservations` / `orders` naming
   inconsistency — Phase 2 chose `orders` (no `relay` prefix),
   Phase 3+4 chose `relay*` prefix (reuse of existing local
   convention). Not a correctness issue; ergonomics.

**For `PHASE_4_BACKLOG.md`:**
1. Cross-session slot + space coordination (`slotReservations` /
   `spaceReservations` transactional collections)
2. Calendar provider integrations (Phase 3 deferred item carries)
3. Booking/space modifications or cancellations post-confirm
4. Waitlists, standby, recurring reservations
5. Engine-scoped `serviceContext.*` pointers — not yet used by any
   commit action; defer until a block or action needs them
6. **ADR §Follow-ups** — `docs/engine-architecture.md §8 invariant #4`
   update still pending Session 3 M07. **Fourth** partner-relay
   retro flagging this.

## 10. Discipline check

- ✅ Phase 3 + ADR merged to main before Phase 4 started
- ✅ Branched off fresh main (not stacked)
- ✅ Reducer pure (no Firestore imports in space-reducer.ts)
- ✅ `pruneExpiredSpaceHolds` on every reducer entry +
     on-read in confirmSpaceAction
- ✅ Single-writer discipline: only space-actions.ts calls
     `setSessionSpace`
- ✅ Hold mutations anon-allowed (no `requireIdentityOrThrow`)
- ✅ `confirmSpaceAction` is the only new gate consumer this phase
     (grep confirms: total = 3 across repo)
- ✅ Three-gate order: Health → Identity → Hold-valid
- ✅ Collection path matches Phase 3 local convention
- ✅ tsc ≤ 276 every commit
- ✅ Speculative-From footers reference ADR + prior retro sections
- ✅ No calendar integration, no cancellation, no waitlists
- ✅ No commit-gate abstraction extraction (decision: 3 consumers is
     not enough pressure; revisit at ≥5 or when a 4th surfaces a
     variation)
- ✅ No data-loader abstraction extraction (will assess at M03
     follow-up with 3 loaders in hand)

## 11. Session close

2 milestones shipped (M03 deferred). `/partner/relay` Phase 4 is
functionally complete; the functional-engine arc (Identity →
Commerce → Booking → Space) is now continuous.

**What's unblocked:**
1. **M03 block-registry follow-up** — can register both
   `booking_confirmation` and `space_confirmation` in one session.
2. **Full `/partner/relay` runtime** — a partner can now browse
   (commerce), reserve time slots (booking), reserve dates (space),
   all with identity resolution at commit boundary and Health
   gating at save boundary.

**Still pending (not blocking Phase 4 consumers):**
1. Phase 3 cutover Session 3 (M07 + M08 + M09) — docs consolidation
   + X04 + observation closure. `docs/engine-architecture.md §8`
   pointer still pending.

Ready for draft PR when called.
