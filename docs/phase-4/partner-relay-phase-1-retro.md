# /partner/relay Phase 1 Identity — Retrospective

Session: /partner/relay Phase 1 (single-session execution covering
M01 + M02 + M03 + M04 + M05).
Branch: `claude/partner-relay-phase-1` (off `main` at `d34d230b`).
Baseline throughout: tsc 276.

## 1. Commits shipped

| SHA | Commit | tsc | tests |
|---|---|---|---|
| `dbccedb6` | `[P1.M01-audit] session-store write-discipline audit` | 276 | 556 |
| `d13d3b23` | `[P1.M01] session-store: migrate to field-path updates` | 276 | 564 |
| `de4b210a` | `[P1.M02] contacts: canonical doc + resolveContact action` | 276 | 579 |
| `a7274389` | `[P1.M03] session: identity group + setter/getter helpers` | 276 | 584 |
| `7ed7d5e1` | `[P1.M04] identity: commit-boundary gate helper + integration test` | 276 | 590 |
| `e1ab2358` | `[P1.M05] docs: identity-runbook` | 276 | 590 |

**6 commits (1 audit + 5 milestones).** tsc held at 276 every commit.
Tests 556 → 590 (+34 net).

## 2. Schema migration summary

Per `docs/phase-4/p1-m01-audit.md`. Inventory:

- **3 direct `.set()` sites in `session-store.ts`** — under halt threshold of 5
  - Line 47 `saveSession` full-doc merge → deleted, replaced with targeted setters
  - Line 58 `loadOrCreateSession` initial-create `.set(fresh)` → **kept** (genuine create, not merge)
  - Line 70 `setActiveEngine` scalar-only merge → converted to `.update()`
- **10 indirect callers via `saveSession`** — all migrated:
  - 5 in cart-actions.ts → `setSessionCart`
  - 3 in booking-actions.ts → `setSessionBooking`
  - 1 in session-actions.ts → `updateSession`
  - 1 in create-order.ts → `setSessionCart`

Targeted setters added: `setSessionCart`, `setSessionBooking`,
`setSessionCustomer`, `updateSession` (generic), `setSessionIdentity`
(M03), `setActiveEngine` (converted).

Public `saveSession` removed. No caller left standing.

## 3. Phone normalizer — reused

Existing `src/utils/phone-utils.ts` normalizer reused without
modification. Covers E.164, US 10-digit, US 11-digit, hyphenated,
parenthesized inputs. No net-new normalizer shipped.

Caveat flagged in `docs/identity-runbook.md` §4: non-US 10-digit
phones misnormalize (Indian mobile `9876543210` → `+19876543210`).
Manual Firestore-console Contact creation documented as the
operator escape hatch. Per-partner country hint is a Phase 4
adjacency; flagged in `PHASE_4_BACKLOG.md` deferred items below.

## 4. Integration test shape (Phase 2 template)

P1.M04's end-to-end test (`src/lib/relay/identity/__tests__/commit-gate.test.ts`)
establishes the anon → engine → gate-throws → resolve → gate-returns
pattern. Phase 2 Commerce's order-create test should follow the same
structure:

1. Start anon session via `loadOrCreateSession`.
2. Perform anon-allowed setup (cart add, set active engine).
3. Call the commit action (order-create) → expect
   `IdentityRequiredError`.
4. `resolveContact(partnerId, phone)` + `setSessionIdentity(...)`.
5. Retry the commit action → expect success.
6. Assert sibling sub-objects (cart, booking, activeEngine) preserved
   across the identity write.

Key invariants to carry forward:
- `getSessionIdentity` is pure; no mock needed.
- `requireIdentityOrThrow` is the only gate import for commit actions.
- Contact doc side-effect at `contacts/{partnerId}_{phone}` verifiable
  via `firestoreStore.get(...)`.

## 5. Open items for Phase 2 Commerce

Carried forward explicitly so Phase 2 doesn't re-derive:

1. **Cart mutation is anon-allowed.** `cart-actions.ts` does NOT call
   `setSessionIdentity` or `requireIdentityOrThrow`. It stays
   unchanged in Phase 2.
2. **Order-create is the first commit consumer.** Import
   `requireIdentityOrThrow` from `@/lib/relay/identity/commit-gate` at
   the top of the function, throw-guard before any write, catch in
   the endpoint layer and surface `IDENTITY_REQUIRED` to the client.
3. **UI-layer integration.** The phone-capture step is a Phase 2 UI
   concern; after it fires, call `resolveContact` then
   `setSessionIdentity`. Do NOT inline the resolution in order-create
   — keeping resolution a separate explicit step makes telemetry
   clearer (creation vs reuse visible in `resolveContact` result's
   `created` flag).

## 6. ADR §Follow-ups status

`docs/engine-architecture.md §8 invariant #4` update (per ADR-P4-01
§Follow-ups) is **still pending M07**. That file does not yet exist.
Phase 1 did not land the update. Flagged here for Session 3 M07 to
pick up:

> `docs/engine-architecture.md §8 invariant #4` currently reads (in
> `docs/engine-rollout-phase2/tuning.md`): "no new session-state fields
> (Adjustment 5)." When M07 creates the consolidated
> architecture doc, update this entry to:
> *"no new session-state fields (Adjustment 5, reopened via
> ADR-P4-01 on 2026-04-20). New session fields require an ADR; see
> `docs/phase-4/adjustment-5-decision.md`."*

## 7. Discipline check

- ✅ Audit commit landed before M01 migration (evidence precedes change)
- ✅ Field-path updates only; no whole-doc merges added
- ✅ No engine-specific fields on Contact (tight ADR shape preserved)
- ✅ `resolveContact` not health-gated (prerequisite, not commit)
- ✅ Commit-boundary gating is a single exported helper, not
     inlined per action
- ✅ tsc ≤ 276 every commit
- ✅ Speculative-From footers reference ADR sections
- ✅ No scope creep (no cart state, no order create, no UI work)

## 8. Deferred items → `PHASE_4_BACKLOG.md`

Surfaced during Phase 1, not addressed:

1. **Per-partner country hint for phone normalizer.** Non-US mobile
   inputs misnormalize; manual Firestore-console workaround
   documented. Fix = `businessPersona.country` feeding into
   `normalizePhoneNumber`. Scope: small, but an ADR addendum to
   P4-01 preferred since it changes normalizer contract.
2. **Contact merge UI / contact edit UI.** Explicitly out of scope
   for Phase 1. If partner usage surfaces duplicate-contact reports,
   revisit at Phase 2 retro.
3. **Phone verification / OTP.** Out of scope. Only revisit if a
   partner use case requires identity-proof (e.g. healthcare PII).

## 9. Session close

All 5 milestones shipped. Phase 2 Commerce is unblocked. Per ADR-P4-01
Decision 8, Phase 2 runs on its own branch
(`claude/partner-relay-phase-2`) off post-merge main.

**Phase 2 can start when:**
1. Phase 1's 6 commits merge to main.
2. Fresh `main` carries `setSessionIdentity`, `requireIdentityOrThrow`,
   and the targeted session setters.
3. A Phase 2 kickoff prompt references `requireIdentityOrThrow` as
   the order-create gate.

Estimated Phase 2 budget: unknown — depends on whether order-create
needs new cart currency/expiresAt fields (likely yes per ADR Schema),
how many existing cart tests need updates, and whether the UI-layer
phone-capture is in scope or deferred.
