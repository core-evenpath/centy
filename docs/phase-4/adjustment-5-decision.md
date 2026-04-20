# ADR-P4-01 — Adjustment 5 reopen: relaySession schema growth

## Status

**Decided 2026-04-20.** Supersedes the Adjustment 5 invariant established
in `docs/engine-rollout-phase2/tuning.md` ("no new session-state
fields"). New constraint: session-state growth requires an ADR. This is
the first such ADR.

## Context

Phases 1–3 of the Relay engine rollout preserved Adjustment 5 strictly:
across four per-engine Phase 2 sessions (Commerce, Lead, Engagement,
Info) and three Phase 3 cutover sessions, zero new session-state fields
landed. Onboarding ran via recipes and static templates; post-commit
state (thank-you, impact-receipt, next-step) lived in flow-template
`followup` stages, not session state. The invariant held as a lexicon
of discipline, not a hard architectural constraint.

`/partner/relay` Phases 1–4 change the situation. User-visible session
state — identity resolution, cart currency + expiry, booking holds,
space holds (date-range distinct from slot-based booking), service
context (post-commit references) — cannot live in flow templates
without collapsing type safety and multi-turn coherence. The invariant
must reopen.

The reopen is deliberate, not compensating for drift: the Phase 1
survey (see `docs/phase-4/adjustment-5-options.md` §1) verified zero
post-Phase-2 session-field additions via `git log --follow` on
`session-types.ts`. `activeEngine` predates Adjustment 5 (M11 in Phase
1). Baseline is clean.

## Options considered

See `docs/phase-4/adjustment-5-options.md` for the full tradeoff matrix.
Summary:

| Option | Shape | Relative merits |
|---|---|---|
| A | Flat top-level optional fields | Simplest; session-types.ts grows linearly (~15+ top-level fields by Phase 4). |
| B | Grouped sub-objects per engine/concern on same doc | Clear ownership; single-doc read preserves orchestrator latency; nested-merge-write risk needs field-path discipline. |
| C | Subcollections per concern (`holds/`, `serviceEvents/`) | Firestore TTL policies usable per-hold; multi-read cost on every orchestrator turn; harder rollback. |

## Decision

**Option B — grouped sub-objects on the existing `relaySessions/{id}` doc.**

Firestore field-path merge-writes (`.update({'booking.holds': [...]})`)
give the write-isolation benefit of subcollections without the multi-
read cost on the orchestrator hot path. Phase 1 must switch
`session-store.ts` to field-path writes before the first new sub-object
lands (see §"Prerequisite" below).

### Schema

Additions to `RelaySession` (all optional; absence = default; no
breaking changes to existing fields):

| Field | Type | Optional | TTL | Owner (writer) | Reader | Notes |
|---|---|---|---|---|---|---|
| `identity.contactId` | `string \| null` | yes | N/A | `phone-lookup-action` (new, Phase 1) | orchestrator, all engines | `null` = anon; pointer to `contacts/{partnerId}/{phone}`. |
| `identity.resolvedAt` | string (ISO) | yes | N/A | `phone-lookup-action` | telemetry | Set when the pointer is written. |
| `identity.source` | `'phone' \| 'email' \| 'token'` | yes | N/A | `phone-lookup-action` | telemetry | How the contact was identified. |
| `cart.currency` | string (ISO 4217) | yes (default `'INR'` when derived) | session-level `expiresAt` | `cart-actions.ts` | orchestrator, commerce blocks | Currently computed; persisted in Phase 2. |
| `cart.expiresAt` | string (ISO) | yes | per-field (~2h idle) | `cart-actions.ts` | read-path filter | Cart-specific TTL distinct from session TTL. |
| `bookingHolds[*]` | `{resourceId, start, end, holdExpiresAt}[]` | yes | per-hold `holdExpiresAt` (~15min) | `booking-select-action` (new, Phase 3) | orchestrator, booking blocks | Slot-time-range semantics; multiple concurrent holds allowed (one per resource). |
| `spaceHolds[*]` | `{resourceId, checkIn, checkOut, holdExpiresAt}[]` | yes | per-hold `holdExpiresAt` (~15min) | `space-select-action` (new, Phase 4) | orchestrator, space blocks | Date-range-across-days semantics; kept distinct from `bookingHolds` per Decision 2. |
| `serviceContext.commerce.orderId` | string | yes | N/A | `order-create-action` | service blocks | Post-commit pointer. |
| `serviceContext.booking.bookingId` | string | yes | N/A | `booking-confirm-action` | service blocks | |
| `serviceContext.space.reservationId` | string | yes | N/A | `space-confirm-action` | service blocks | |

Engine-scoped nesting under `serviceContext` (Decision 3) makes
ownership explicit at the data layer and ages cleanly: new engines
add new sibling keys (e.g. `serviceContext.lead.applicationId`)
without altering existing readers.

### Storage path

Single doc at `relaySessions/{partnerId}_{conversationId}` (unchanged).
No subcollections. The canonical cross-conversation contact record
lives at **`contacts/{partnerId}/{phone}`** — a sibling top-level
collection, NOT inside the session doc. `identity.contactId` is a
pointer; dereferencing happens at read time.

### TTL and expiry

**Per-field TTL (Decision 5).** No Firestore TTL policy; enforcement
happens application-side on read and via a sweep job (scope deferred
to Phase 2 / Phase 3 as needed):

- Session-level `expiresAt` (existing, dormant): 24h. Read-path
  sweeper deletes expired docs. Hardening of the sweeper is a
  Phase 2 prerequisite if cart reuse becomes load-bearing.
- `cart.expiresAt`: ~2h idle. Cart mutations refresh. Read-path
  filter treats expired cart as empty.
- `bookingHolds[*].holdExpiresAt` / `spaceHolds[*].holdExpiresAt`:
  ~15min from creation. Read-path filter drops expired holds from
  the session signal. Server-side sweep can prune the array, but
  is not required for correctness.

Timing values above are targets for Phase 1–4 ship; the ADR commits
to the per-field-TTL shape, not to the exact minutes. Phase 2 / Phase
3 may adjust the specific minutes with a retro note (no new ADR
needed for minute tuning).

### Versioning

**None (Decision 6).** The schema relies on Phases 1–3 invariant #3:
additive-only schema with deterministic defaults. Every new field is
optional; every consumer reads through `?? default`. Breaking changes
trigger a new ADR which may introduce explicit versioning at that
time.

### Cross-engine atomicity

Two load-bearing transaction boundaries; both single-doc on the
session (cart is in-spine; the referenced `orders/...` /
`bookings/...` / `reservations/...` are sibling collections):

- **Cart → Order (Phase 2):** atomic clear-cart + write-`serviceContext.commerce.orderId`. Within the session doc. Order doc write is a separate transaction — failure order is: write order first (succeeds or fails cleanly), then update session (idempotent retry OK).
- **Hold → Booking confirmed (Phase 3):** atomic drop-hold-from-`bookingHolds[]` + write-`serviceContext.booking.bookingId`. Single session-doc update. Booking doc write separate, same pattern as above.

Firestore multi-doc transactions are available if needed, but the
split-phase "write external doc, then update session" pattern is
simpler and rollback-safe (orphaned order / booking docs show up in
telemetry; no stranded session state).

## Prerequisite (Phase 1 first chore)

**Field-path write discipline.** The current `session-store.ts`
`saveSession()` uses `.set({...}, { merge: true })` — whole-doc merge
that deep-merges object maps but **replaces nested arrays wholesale**.
With the new grouped schema, a naive write to `booking.holds` via the
current pattern would clobber existing `booking.slots`.

Verified 2026-04-20: `src/lib/relay/session-store.ts:47` uses
`.set(updated, { merge: true })`; lines 58 and 70 are similar. Phase 1
must migrate write callers to Firestore field-path updates:

```ts
// Current (whole-doc merge, array-clobber risk)
await ref.set({ booking: { holds: newHolds } }, { merge: true });

// Phase 1 target (field-path update, array-safe)
await ref.update({ 'booking.holds': newHolds });
```

Scope: audit + migrate every writer of `RelaySession` sub-objects
(session-store, cart-actions, booking-actions, session-actions,
order-create). Ship as the first commit of Phase 1 before any new
field lands. This is not optional — nested sub-objects with multiple
sibling arrays (e.g. `booking.slots` + future `booking.holds` if we
ever nest holds there; not done per Decision 2) or coexisting writers
depend on field-path safety.

## Anon session semantics (Decision 7 expansion)

Cart and holds work for anon sessions. `contactId` becomes required
only at **transaction commit boundaries** — `place order`,
`confirm booking`, `start service ticket`. Precise split:

- **Gated on session presence only (anon OK):** cart-mutation actions
  (add/update/remove item, apply discount); booking-select
  (hold creation); space-select (hold creation); all read actions.
- **Gated on session presence + resolved `identity.contactId`:**
  order-create; booking-confirm; space-confirm; service-ticket-open.

Phase 2 Commerce's cart-mutation path therefore ships without
touching identity. Order-create is the gate. Phase 3/4 follow the
same pattern.

This prevents Phase 2 from re-litigating: no identity work is
required to ship Commerce's browse/cart path. Identity resolution is
a Phase 1 deliverable consumed at Phase 2's commit action only.

## Invariants preserved from Phases 1–3

- **No AI in hot path** (engine-keywords.ts pattern, deterministic).
- **Deterministic onboarding** (recipes → templates → health).
- **Additive schema** — this ADR's schema entries are all optional
  (invariant #3).
- **Evidence precedes removal** (tuning.md §4.1).
- **Audit-mismatch halt rule** (tuning.md §4.5; Session 2
  codification).
- **Speculative-From footers** on every commit implementing a
  tuning decision.
- **One milestone per commit** (Phase 2 + Phase 3 per-milestone
  shape).
- **Dual-tag justification** (Adjustment 4) — unchanged.
- **Service-exception cap at 5** (Adjustment 3) — unchanged.

## Invariants modified

- **Adjustment 5 — reopened.** Previous state: "no new session-state
  fields, full stop." New state: "session-state growth requires an
  ADR; each new field carries owner, reader, TTL, and rationale in
  the ADR." This ADR is the precedent.

## Sequencing

First ship: **/partner/relay Phase 1 (Identity) + Phase 0 (data gap)
in parallel on separate branches (Decision 8)**.

- **Phase 0 (data gap):** widget data plumbing. Orthogonal to this
  ADR's schema work; no dependency.
- **Phase 1 (Identity):** `contacts/{partnerId}/{phone}` collection +
  phone-lookup-action + `identity.*` session fields + the field-path
  migration prerequisite. Unblocks Phases 2–4.
- **Phase 2 (Commerce):** `cart.currency`, `cart.expiresAt`,
  `serviceContext.commerce.orderId`. Depends on Phase 1's field-path
  migration.
- **Phase 3 (Booking):** `bookingHolds[*]` +
  `serviceContext.booking.bookingId`. Depends on Phase 2 (for
  order-like commit patterns) and Phase 1.
- **Phase 4 (Space):** `spaceHolds[*]` +
  `serviceContext.space.reservationId`. Depends on Phase 3's hold
  pattern (as reference implementation, not code dependency).

## Open items (deferred)

None. All 8 decisions resolved. No 9th surfaced during drafting.

Known Phase-1-to-Phase-2 adjacencies to track (not ADR-level
decisions; milestone retros own them):

- Cart sweeper cron cadence (if cart reuse becomes load-bearing).
- Booking hold release semantics on conversation abandonment
  (application-level vs passive TTL).

## Rollback

Each decision has an independent rollback path. Failure modes and
reverts:

| Failure | Rollback |
|---|---|
| Phase 1 field-path migration breaks existing session writes | Revert the migration commit; previous `.set({...}, merge: true)` pattern restored. No data migration (optional fields absent means absent). |
| `identity.*` sub-object lands wrong shape | Revert the ADR-consuming commit; session doc's `identity` key goes missing; readers treat absent as anon. No data migration. |
| `bookingHolds[*]` or `spaceHolds[*]` semantics wrong | Revert; arrays disappear; engine blocks fall back to the pre-hold flow (already in place for Phase 1 booking pilot). |
| `serviceContext.*` engine-scope proves unwieldy (e.g. we learn we need flatter shape mid-Phase-3) | Drafting a new ADR that modifies ADR-P4-01. Current ADR acknowledges the possibility; Decision 3's rationale ages cleanly but isn't irreversible. |

Combined rollback: `git revert <commit-range>` on the Phase 1 stack.
No production partner data exists (Phase 3 observation-closure
invariant), so no migration or cleanup is needed.

## Follow-ups

**Session 3 M07 (docs consolidation) must update
`docs/engine-architecture.md` §8 invariant #4.** The invariant
currently reads (in `docs/engine-rollout-phase2/tuning.md`
Adjustment 5): *"no new session-state fields."* When M07 creates
`docs/engine-architecture.md` and imports the consolidated invariant
block, update the Adjustment 5 entry to:

> *"no new session-state fields (Adjustment 5, reopened via
> ADR-P4-01 on 2026-04-20). New session fields require an ADR; see
> `docs/phase-4/adjustment-5-decision.md`."*

Noted explicitly so M07 picks up the pointer without archaeology.

**`PHASE_4_BACKLOG.md`** shipped alongside this ADR (repo root).
Lightweight version; M07 replaces with the full consolidated backlog.
