# Phase 4 Backlog — /partner/relay functional phases

Lightweight backlog. Session 3 M07 (docs consolidation) will replace
this with the consolidated cross-phase backlog; for now this doc
tracks unblocked / blocked / in-progress work related to
`/partner/relay` Phases 1–4 and captures decisions already made.

Current scope: **decisions + readiness state**. No implementation
tracking here — per-phase progress lives in the phase's own log
once the phase starts.

---

## Decisions shipped

### Adjustment 5 reopen — ADR-P4-01

- **Status:** Decided 2026-04-20 via
  `docs/phase-4/adjustment-5-decision.md` (ADR-P4-01).
- **Decision:** Option B — grouped sub-objects on existing
  `relaySessions/{id}` doc. Separate `bookingHolds` + `spaceHolds`
  (not unified). Engine-scoped `serviceContext`. Cross-conversation
  `contactId` via `contacts/{partnerId}/{phone}`. Per-field TTL.
  No explicit versioning. Anon allowed until commit boundary.
  Parallel first ship (Phase 1 + Phase 0).
- **Options research:** `docs/phase-4/adjustment-5-options.md`
  (committed `1252d39d`).

---

## Unblocked phases

All four /partner/relay functional phases are architecturally
unblocked by ADR-P4-01. Sequencing per the ADR's §Sequencing:

### /partner/relay Phase 1 — Identity

- **Status:** unblocked; ready to scope.
- **First chore:** migrate `session-store.ts` writers from
  `.set({...}, { merge: true })` to Firestore field-path
  `.update({...})` (ADR-P4-01 §Prerequisite). Ship as first commit.
- **Deliverables:** `contacts/{partnerId}/{phone}` collection;
  phone-lookup action; `identity.contactId` / `identity.resolvedAt`
  / `identity.source` fields on `RelaySession`.
- **Parallel with:** Phase 0 (decoupled, separate branch).

### /partner/relay Phase 2 — Commerce

- **Status:** architecturally unblocked; code-blocked on Phase 1
  field-path migration.
- **Deliverables:** `cart.currency`, `cart.expiresAt`,
  `serviceContext.commerce.orderId`. Cart-mutation path ships anon;
  order-create gates on `identity.contactId`.

### /partner/relay Phase 3 — Booking

- **Status:** architecturally unblocked; code-blocked on Phase 2
  pattern (for commit-boundary reference).
- **Deliverables:** `bookingHolds[*]`,
  `serviceContext.booking.bookingId`. Slot-time-range semantics.
  Multiple concurrent holds allowed per ADR §Schema.

### /partner/relay Phase 4 — Space

- **Status:** architecturally unblocked; follows Phase 3's hold
  pattern (reference implementation, not code dependency).
- **Deliverables:** `spaceHolds[*]`,
  `serviceContext.space.reservationId`. Date-range-across-days
  semantics.

---

## Parallel work

### /partner/relay Phase 0 — widget data gap

- **Status:** unblocked, decoupled.
- **Branch:** TBD (separate branch; not stacked on Adjustment 5
  work).
- **Scope:** widget data plumbing. Independent of ADR-P4-01 schema.
- **Can start:** immediately.

---

## Deferred items (from Adjustment 5 session)

None at ADR-level. Milestone retros own these adjacencies:

- Cart sweeper cron cadence (Phase 2 retro decides if cart reuse
  becomes load-bearing).
- Booking hold release semantics on conversation abandonment
  (Phase 3 retro decides: application-level proactive release vs
  passive TTL sweep).

---

## Still-pending Phase 3 cutover items

Adjacent to /partner/relay phases but separate work:

- **P3 Session 3** — P3.M08 (X04 Drafting AI Narrow) + P3.M07 (docs
  consolidation, which will subsume this backlog doc) + P3.M09
  (observation closure sign-off). ~2.5h per session-2-retro.md §4.

Session 3 runs in sequence after /partner/relay phases land (or in
parallel on a separate branch, operator call).

---

## Invariants reminder

Phases 1–3 disciplines carry forward:

- Additive-only schema (invariant #3).
- No AI in hot path (engine-keywords).
- Deterministic onboarding (recipes → templates → health).
- Evidence precedes removal.
- Audit-mismatch halt rule (tuning.md §4.5).
- Speculative-From commit footers.
- One milestone per commit.
- Dual-tag justification (Adjustment 4).
- Service-exception cap at 5 (Adjustment 3).

Adjustment 5 modified, not removed — session-state growth now
requires an ADR (ADR-P4-01 is the first).
