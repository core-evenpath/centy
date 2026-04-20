# Adjustment 5 Reopen — Schema Options Draft

Session: Adjustment 5 Decision Session, Phase 3 output.
Date: 2026-04-20.
Status: **draft — awaits operator decision (Phase 4)**.

This doc is the research + options artifact. The Phase 4 operator
decision crystallizes into `adjustment-5-decision.md` (ADR-P4-01).

Prerequisite note (option 2 execution): `docs/engine-architecture.md`
and `PHASE_4_BACKLOG.md` are both Phase 3 Session 3 (M07) deliverables
and do not yet exist. This doc references live unarchived sources:
`docs/engine-rollout-phase2/tuning.md` and
`docs/booking-pilot/m11-session-active-engine.md`. M07 will move them
into the archive layout and update cross-references.

---

## 1. Current `RelaySession` schema (baseline)

**Source:** `src/lib/relay/session-types.ts`.
**Storage:** `relaySessions/{partnerId}_{conversationId}` — single
top-level doc, keyed by composite id. Widget-readable.

### Field inventory

| Field | Type | Optional | Set by | Notes |
|---|---|---|---|---|
| `conversationId` | string | no | `newSession()` | Identity key |
| `partnerId` | string | no | `newSession()` | Identity key |
| `cart` | `RelaySessionCart` | no (always present) | `cart-actions.ts` | `{items, subtotal, discountCode?, discountAmount?, total}`. Empty default. |
| `booking` | `RelaySessionBooking` | no (always present) | `booking-actions.ts` | `{slots[], guestCount?, notes?}`. Empty default. Booking pilot slot-based. |
| `customer` | `RelaySessionCustomer` | yes | `updateRelaySessionAction` | `{name?, email?, phone?}`. Client-provided form data. |
| `createdAt` | string (ISO) | no | `newSession()` | |
| `updatedAt` | string (ISO) | no | `saveSession()` | Stamped on every write |
| `expiresAt` | string (ISO) | no | `newSession()` | +24h TTL (see `SESSION_TTL_MS`). **Not enforced by Firestore TTL policies today — read-path filter absent.** |
| `activeEngine` | `Engine \| null` | yes | `setActiveEngine()` orchestrator M11 | null = explicit "no engine resolved"; undefined = legacy pre-M11 session |

### Reads

- `src/lib/relay/orchestrator/signals/session.ts` — every orchestrator turn reads the session to extract `activeEngine`, `cart`, `booking`, `customer`. Bundled into the `SignalBundle` and fed to policy.ts.
- `src/actions/relay-runtime/session-actions.ts` `getRelaySessionAction` — UI reads for display.

### Writes

- `newSession()` / `loadOrCreateSession()` — initial write.
- `saveSession()` — full merge-write by `updateRelaySessionAction`.
- `setActiveEngine()` — targeted merge-write from orchestrator (fire-and-forget; swallowed on error).
- `cart-actions.ts` (5 actions) — all go through `loadSession` → mutate `cart` → `saveSession`.
- `booking-actions.ts` (2 actions) — same pattern with `booking`.
- `relay-orders/create-order.ts` — writes order then clears cart via `saveSession`.

### Existing TTL / expiry

- `expiresAt` is set, but **no Firestore TTL policy** removes the
  doc. No read-path filter rejects expired sessions either. Client
  treats session as indefinitely valid until a new `conversationId`
  arrives.
- Dormant TTL: the field is present for eventual wire-up; not
  load-bearing today.

### Backward-compat behavior

- `loadSession` returns `null` if the doc is missing.
- `loadOrCreateSession` creates a new empty session (cart/booking
  empty, customer undefined, activeEngine absent).
- Orchestrator signal loader treats `session === null` as a valid
  first-turn state.

### Adjustment 5 baseline

Per Phase 2 `tuning.md` §13 and retro-session-4.md, Adjustment 5's
invariant ("no new session-state fields") has held for all 4 Phase 2
engine sessions. The only post-Adjustment-5 session field is the
M11 `activeEngine` — which predates Adjustment 5 (Phase 1 M11 was
approved as the baseline shape).

No post-Phase-2-close session-field additions exist (git log verified
in Phase 1 survey). No regression; reopen is deliberate.

---

## 2. Per-engine needs (Phase 2 enumeration)

Source: Phase 4 prompt's seed list + cross-checked against existing
block scaffolding in `src/app/admin/relay/blocks/previews/` and
`src/actions/relay-runtime/`.

### Phase 1: Identity

| Field | Shape | Writer | Reader | Notes |
|---|---|---|---|---|
| `identity.contactId` | string \| null | phone-lookup action (new) | orchestrator signals + any engine needing per-contact context | Resolves anon → known. Absent = anon. |
| `identity.resolvedAt` | string (ISO) | phone-lookup action | telemetry | When the resolution happened; useful for cache invalidation. |
| `identity.source` | `'phone' \| 'email' \| 'token'` | phone-lookup action | telemetry | How the contact was identified. |

**Open ambiguity:** does `contactId` persist cross-conversation for
the same phone number, or is it scoped to the current session? Prompt
flags this explicitly.

### Phase 2: Commerce

The current `cart` field already covers most of this. Phase 2 adds:

| Field | Shape | Writer | Reader | Notes |
|---|---|---|---|---|
| `cart.currency` | string (ISO 4217) | cart actions | orchestrator + commerce blocks | Currently computed but not persisted on cart object. |
| `cart.expiresAt` | string (ISO) | cart actions | all | Current TTL is session-level; cart-specific TTL handles abandoned-cart flows. |
| `cart.lineItems[*].moduleItemId` | string | cart actions | order-create | Link back to the partner module item source (already `itemId` but rename clarifies). |

Likely **no net-new top-level fields** — augmentation of existing
cart shape.

### Phase 3: Booking

Current `booking.slots` covers slot-based booking. Phase 3 adds
hold semantics:

| Field | Shape | Writer | Reader | Notes |
|---|---|---|---|---|
| `bookingHolds[*]` | `{resourceId, start, end, holdExpiresAt}` | booking select action | orchestrator + booking blocks | Tentative holds before confirm. **Distinct from `booking.slots` which is confirmed state.** |

**Open ambiguity:** are multiple concurrent holds allowed (one per
resource) or single-hold-at-a-time? Prompt flags this.

### Phase 4: Space

Space is range-based (check-in/check-out dates) vs booking's
slot-based:

| Field | Shape | Writer | Reader | Notes |
|---|---|---|---|---|
| `spaceHolds[*]` | `{resourceId, checkIn, checkOut, holdExpiresAt}` | space select action | orchestrator + space blocks | Prompt flags this as structurally distinct from booking. Could unify under a `holds[*]` array with a discriminator. |

**Open ambiguity:** unify booking + space holds under a single
polymorphic `holds[*]` with a `kind: 'slot' | 'range'` tag, or keep
separate arrays?

### Service overlay

Service engine consumes state produced by other engines:

| Field | Shape | Writer | Reader | Notes |
|---|---|---|---|---|
| `serviceContext.orderId?` | string | order-create | service blocks | "Track my order" needs this. |
| `serviceContext.bookingId?` | string | booking-confirm | service blocks | "Cancel my booking" needs this. |
| `serviceContext.reservationId?` | string | booking/space confirm | service blocks | Space equivalents. |

**Open ambiguity:** single `serviceContext` object or engine-scoped
(e.g. `commerce: {orderId}, booking: {bookingId}`)? Prompt flags.

### Summary of candidate fields

**Top-level candidate additions:**
- `identity` (object)
- `bookingHolds` (array) OR unified `holds` (array)
- `spaceHolds` (array) OR unified `holds` (array)
- `serviceContext` (object) OR engine-scoped sub-objects

**Augmentations to existing fields:**
- `cart.currency`, `cart.expiresAt`
- `cart.lineItems[*].moduleItemId` (rename)

---

## 3. Schema options

Three options drafted. Each option is additive against the baseline
(no field removal, no path migration). Ranked roughly by divergence
from the current shape: Option A least, Option C most.

### Option A — Monolithic doc extension (flat fields)

All new fields live as top-level optional fields on the existing
`relaySessions/{...}` doc.

```ts
interface RelaySession {
  // ... existing fields ...
  identityContactId?: string | null;
  identityResolvedAt?: string;
  identitySource?: 'phone' | 'email' | 'token';
  bookingHolds?: Array<{ resourceId: string; start: string; end: string; holdExpiresAt: string }>;
  spaceHolds?: Array<{ resourceId: string; checkIn: string; checkOut: string; holdExpiresAt: string }>;
  serviceOrderId?: string;
  serviceBookingId?: string;
  serviceReservationId?: string;
  cart: RelaySessionCart & { currency?: string; expiresAt?: string };
}
```

**Tradeoffs:**

| Dimension | Assessment |
|---|---|
| Storage | Single doc; existing atomic merge-write semantics preserved. |
| TTL | Session-level `expiresAt` only. No per-field TTL. Cart `expiresAt` per field for abandoned-cart. Hold `holdExpiresAt` per hold. |
| Migration | Fully additive. No write. Reads check `?? undefined`. |
| Cross-engine atomicity | Cart→order can use single-doc transactions trivially. |
| Test strategy | Each engine unit-tests its own field slice; integration tests read the whole doc. |
| Versioning | Optional-field + deterministic defaults. No explicit `schemaVersion`. |
| Rollback | Revert the commit; field disappears; code treats absent as default. No data migration needed. |
| Reviewability | Easy — one file changed per field. |
| Discoverability | Poor — session-types.ts grows linearly. ~15+ top-level fields by Phase 4. |

### Option B — Grouped sub-objects (nested)

Same single doc, but fields nested under engine/concern-scoped
sub-objects.

```ts
interface RelaySession {
  // ... existing fields ...
  identity?: {
    contactId: string | null;
    resolvedAt: string;
    source: 'phone' | 'email' | 'token';
  };
  booking?: RelaySessionBooking & {
    holds?: Array<{ resourceId: string; start: string; end: string; holdExpiresAt: string }>;
  };
  space?: {
    holds: Array<{ resourceId: string; checkIn: string; checkOut: string; holdExpiresAt: string }>;
  };
  serviceContext?: {
    orderId?: string;
    bookingId?: string;
    reservationId?: string;
  };
  cart: RelaySessionCart; // gets currency + expiresAt via augmented interface
}
```

**Tradeoffs:**

| Dimension | Assessment |
|---|---|
| Storage | Single doc; atomic merge-write. |
| TTL | Session-level `expiresAt` + per-hold `holdExpiresAt` + cart-specific `cart.expiresAt`. |
| Migration | Fully additive. Existing `booking` field gets `holds` added; everything else new. |
| Cross-engine atomicity | Cart→order still single-doc transaction. But nested sub-objects make merge-writes require careful path selection (e.g. writing `{booking: {holds: [...]}}` must not clobber `booking.slots`). |
| Test strategy | Per-sub-object unit tests; integration tests exercise write-path-safety for nested merges. |
| Versioning | Optional top-level group + deterministic defaults. Each group owned by one engine (single-writer invariant trivial to enforce). |
| Rollback | Revert commit; sub-object disappears; code treats absent as default. No data migration. |
| Reviewability | Very good — each engine's addition is one sub-object. |
| Discoverability | Good — `session.identity.contactId` clearly scoped. 5–6 top-level fields total. |

**Risk specific to Option B:** nested merge-writes. Firestore's
`set({...}, {merge: true})` does deep merge for nested objects BUT
replaces nested arrays wholesale. A write to `booking.holds` without
including `booking.slots` would wipe `booking.slots`. Mitigation: per
the existing `saveSession` pattern, always merge on a fully-loaded
session object.

### Option C — Subcollections per concern

Spine (identity, timestamps, cart, activeEngine) stays in
`relaySessions/{id}`. Holds + serviceContext move to subcollections.

```
relaySessions/{id}                  # spine + cart + customer + identity
  holds/{holdId}                    # bookingHolds + spaceHolds as docs
  serviceEvents/{eventId}           # orderId, bookingId references as events
```

**Tradeoffs:**

| Dimension | Assessment |
|---|---|
| Storage | Multi-doc. Reads become multi-query (N+1 pattern unless batched). |
| TTL | Per-doc Firestore TTL policies become usable (each hold doc has its own `holdExpiresAt`, Firestore TTL deletes it). |
| Migration | Structural. Adds collection paths. Still "additive" in that no existing docs move, but the shape diverges significantly. |
| Cross-engine atomicity | Cart→order remains simple (cart is in spine). Hold→booking-confirmed requires Firestore transaction across docs (supported but heavier). |
| Test strategy | Per-subcollection tests + orchestrator integration tests verifying multi-doc read coherence. |
| Versioning | Per-collection schema version doc possible. More mechanism; more explicit. |
| Rollback | Harder — if holds/ subcollection has docs, rollback either leaves orphans or needs a cleanup script. |
| Reviewability | Moderate — new action files per subcollection; existing `session-store.ts` stays lean. |
| Discoverability | Good via naming, but requires developer to know the subcollection pattern. |

**Risk specific to Option C:** the orchestrator reads the full
session on every turn. Subcollection pattern adds a `.collection().get()`
per concern, increasing per-turn latency. Can be mitigated with a
denormalized summary on the spine, but that re-introduces Option
A/B's problems.

---

## 4. Cross-cutting decisions (Phase 4 surface)

These apply regardless of which option wins:

### 4.1 TTL granularity

- **Whole-session:** current default. Simple. Fails for abandoned-cart flows (cart should expire faster than session).
- **Per-field:** cart has its own `expiresAt`, holds have their own `holdExpiresAt`. More mechanism; matches real-world TTL needs.
- **Firestore TTL policies:** collection-level; works best with Option C where each hold is its own doc.

### 4.2 Versioning

- **None:** optional fields + deterministic defaults; version is implicit in field presence.
- **Explicit `schemaVersion: number` on root:** tracks the whole session's shape. Monolithic version.
- **Per-group `schemaVersion` inside each sub-object:** fine-grained; matches Option B well.

### 4.3 Cross-engine atomicity

Key transaction boundaries:
- **Cart → Order:** atomic clear-cart + create-order.
  - Options A/B: single-doc transaction (cart is in the session doc; order is in a separate collection → multi-doc transaction).
  - Option C: same as A/B (cart is in spine).
- **Hold → Booking confirmed:** atomic release-hold + create-booking.
  - Options A/B: single session-doc update.
  - Option C: multi-doc transaction (holds/ subcollection + spine update).

Firestore supports multi-doc transactions with restrictions. Not a
blocker for any option.

### 4.4 Single-writer-per-field

Proposed invariant: every new field has exactly one writer-module.
- `identity.*` → identity-resolution action only.
- `cart.*` → cart-actions.ts only.
- `bookingHolds`, `booking.slots` → booking-actions.ts only.
- `spaceHolds` → space-actions.ts (new) only.
- `serviceContext.*` → the action that creates the referenced entity (order-create writes `orderId`, booking-confirm writes `bookingId`).

Enforces clear ownership + rollback safety. No field has multiple
writers. Fits all three options.

### 4.5 Anon/unresolved handling

- **Allowed:** partners can operate with `identity.contactId === null`
  (guest flow). Phase 1 Identity resolves when signal present;
  doesn't gate other engines.
- **Gated:** Identity resolution required before other engines can
  activate. Simpler but breaks guest checkout.

Recommendation (not decision): allow anon. Matches current
`customer` optional pattern.

### 4.6 First /partner/relay phase to ship

- Phase 1 Identity alone (sequenced).
- Phase 1 + Phase 0 data-gap in parallel (decoupled; Phase 0 is
  independent schema).

Recommendation (not decision): parallel — Phase 0 is orthogonal.

---

## 5. Recommendation (for operator consideration, not yet decided)

**Option B** (grouped sub-objects, single doc):

- Lowest migration cost (fully additive, no new paths).
- Clear engine ownership (each sub-object has one writer).
- Single-doc read keeps orchestrator latency unchanged.
- Option C's per-doc TTL benefit is attainable at application
  layer (expired-field filter on read) without the subcollection
  mechanism.

**Open items that operator should decide regardless of option:**

1. Unified `holds[*]` vs separate `bookingHolds` + `spaceHolds` (§2).
2. Unified `serviceContext` vs engine-scoped (§2).
3. `contactId` cross-conversation persistence (§2 Phase 1).
4. Multiple concurrent holds allowed (§2 Phase 3).
5. TTL granularity (§4.1).
6. Versioning (§4.2).
7. Anon gating (§4.5).
8. First ship order (§4.6).

---

## 6. What's NOT in scope for the ADR

- Phase 0 data-gap schema (decoupled).
- Implementation of any field (decision-only session).
- Code writes outside `docs/` and `PHASE_4_BACKLOG.md`.
- Migration of existing partner data (no production partners).
- Documentation consolidation (Session 3 M07's job).
