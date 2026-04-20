# Identity Runbook

Operator reference for /partner/relay Phase 1 Identity. Load-bearing
for on-call triage, partner support, and Phase 2+ commit-action
debugging.

Source of truth for the identity schema: `docs/phase-4/adjustment-5-decision.md`
(ADR-P4-01). This runbook is operational; the ADR is architectural.

---

## 1. What `IDENTITY_REQUIRED` means in logs

When a commit action (order-create, booking-confirm, space-confirm,
service-ticket-start) fires against a session without a resolved
`contactId`, the action throws `IdentityRequiredError` with
`code: 'IDENTITY_REQUIRED'`. Surfaces:

- Server logs: stack trace naming `requireIdentityOrThrow` in
  `src/lib/relay/identity/commit-gate.ts`
- Client response: error code `IDENTITY_REQUIRED` with the message
  "This action requires a resolved contact…"

**Not a bug** — the gate is working as intended per ADR-P4-01
§Anon handling. The fix is upstream: the UI flow must capture the
customer's phone before the commit action fires, call
`resolveContact(partnerId, phone)`, then `setSessionIdentity(...)`
with the returned `contactId`.

**When investigating:**
1. Check which action threw (server log stack).
2. Check the session at `relaySessions/{partnerId}_{conversationId}`
   — `identity.contactId` should be set if the UI resolved.
3. If `identity` is absent, the UI skipped resolution — look
   upstream of the commit call.

---

## 2. Inspecting a contact doc

Contact docs live at `contacts/{partnerId}_{phone}` (top-level
collection, composite doc id). Phone is always E.164 format.

### Firestore console

Path: `contacts/{partnerId}_+1XXXXXXXXXX` (full E.164 with `+` prefix).

### Shape (per ADR §Schema)

```json
{
  "id": "+15551234567",
  "partnerId": "abc123",
  "phone": "+15551234567",
  "name": "Optional display name",
  "metadata": { /* partner-specific opaque */ },
  "createdAt": "2026-04-20T13:12:34.567Z",
  "updatedAt": "2026-04-20T13:12:34.567Z"
}
```

Strict invariant: **no engine-specific fields on this doc**. Carts,
orders, bookings, tickets live in their own collections and
reference `contactId` (which equals `phone`). If you see a Contact
doc with cart/order data on it, flag as a regression and file to
`PHASE_4_BACKLOG.md`.

---

## 3. Session identity pointer

Session lives at `relaySessions/{partnerId}_{conversationId}`. The
identity group is optional:

```json
{
  "conversationId": "...",
  "partnerId": "...",
  "identity": {
    "contactId": "+15551234567",
    "resolvedAt": "2026-04-20T13:12:34.567Z"
  },
  "cart": { ... },
  "booking": { ... }
}
```

Anon session = `identity` absent or `{}`. Per ADR-P4-01 Decision 7,
anon sessions can do cart/browse/hold actions; only commit actions
require identity.

---

## 4. Phone normalization escape hatch

`resolveContact(partnerId, phone)` returns
`{ success: false, code: 'INVALID_PHONE' }` when the raw input can't
normalize to E.164. The normalizer
(`src/utils/phone-utils.ts:normalizePhoneNumber`) handles:

- E.164 inputs (`+1...`, `+44...`, etc.)
- US 10-digit (`5551234567` → `+15551234567`)
- US 11-digit with country code (`15551234567` → `+15551234567`)
- Hyphens, parentheses, spaces (stripped before normalization)

### Legitimate phones that reject

Non-US numbers without an explicit country code can reject. Example:
`9876543210` (10 digits, Indian mobile) normalizes to `+19876543210`
(interpreted as US). This is incorrect for the Indian customer.

**Manual workaround:**
1. Operator obtains the correct E.164 number from the partner (e.g.
   `+919876543210`).
2. Create the Contact doc manually via Firestore console at
   `contacts/{partnerId}_+919876543210` with the shape in §2.
3. On next resolve call with the same raw input, the normalizer will
   still produce the wrong form — so either:
   - Fix the partner's UI to ask for E.164 up front, or
   - Extend `normalizePhoneNumber` to handle the country (ADR
     addendum; flag to backlog).

Long-term fix: per-partner country hint in `businessPersona` feeds
into the normalizer. Tracked as a Phase 4 adjacency in
`PHASE_4_BACKLOG.md` deferred items.

---

## 5. Commit-gated actions (Phase 2+)

Actions that import `requireIdentityOrThrow`:

| Action | Phase | File |
|---|---|---|
| `order-create` | Phase 2 Commerce | `src/actions/relay-orders/create-order.ts` (not yet wired — Phase 2) |
| `booking-confirm` | Phase 3 Booking | `src/actions/relay-runtime/booking-actions.ts` confirm path (not yet wired — Phase 3) |
| `space-confirm` | Phase 4 Space | (new file; not yet exists) |
| `service-ticket-start` | Service overlay (post-Phase 2) | (TBD) |

If you add a new commit action, import from
`@/lib/relay/identity/commit-gate` — do not reimplement the gate
inline.

---

## 6. Troubleshooting

### Customer can't complete a purchase

Symptom: widget shows a generic "can't complete that action" error.

Triage:
1. Check server logs for `IDENTITY_REQUIRED`.
2. If present: UI failed to capture phone before commit; open the
   checkout flow, verify the phone-capture step fires.
3. If not: different error — look at the response code.

### Partner reports "same customer showing twice"

Symptom: a customer's cart from conversation A isn't visible in
conversation B even though they used the same phone.

**Not a bug** at the session layer — each conversation has its own
cart. Contact identity is cross-conversation (same `contactId`),
but cart state is per-session. Cart-carryover is a distinct
architectural question deferred to Phase 2 retro (ADR-P4-01 Open
items).

### Duplicate contact docs for same phone

Shouldn't happen — `contactDocId(partnerId, phone)` is deterministic.
If you see duplicates:
- Check the raw phone values in both docs. If one is `+15551234567`
  and the other is `+15551234567 ` (trailing space), that's a
  normalizer bug — file to backlog with the raw inputs.
- If identical, a race condition slipped past the check-then-create
  pattern; acceptable per M02 concurrency test documentation, but
  surface if the duplicate count is >2.

---

## 7. Limits (current Phase 1)

- Phone is the only identity channel. Email/SMS-link/OTP are out of
  scope (ADR-P4-01 Out-of-scope + Phase 1 prompt Not-in-scope).
- No contact merge UI. If a partner has two contacts for the same
  human, they must be merged manually in Firestore.
- No contact edit UI. Partners can edit via the existing CRM
  contact flow at `partners/{partnerId}/contacts/{autoId}`, which
  is a distinct collection from runtime Identity.
- No phone verification / OTP. Phase 1 trusts the phone the
  customer provides.

These are not bugs — they're explicit scope limits. Raise to ADR
if business need escalates.
