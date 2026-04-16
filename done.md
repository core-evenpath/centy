# Relay Commerce Phase 2 — Session & Block Action Layer

Status: implementation complete, awaiting review on
`claude/relay-session-actions-Ak9zl`.

## What this layer adds

A stateful cart + booking layer attached to every Relay chat
conversation. The runtime session is keyed by `{partnerId}_{conversationId}`
in the top-level `relaySessions` Firestore collection and survives view
switches / page refreshes for the same conversation id.

## Modular file map

The work was deliberately split into small, independently-writable
files so a single large file write never had to land at once.

### Types & store (no `'use server'`)

| File | Purpose |
|---|---|
| `src/lib/relay/session-types.ts` | `RelaySession`, `RelaySessionItem`, `RelayBookingSlot`, `recomputeCartTotals`, `relaySessionDocId`, `SESSION_TTL_MS` |
| `src/lib/relay/session-store.ts` | Firestore Admin SDK helpers: `loadSession`, `saveSession`, `loadOrCreateSession`, `newSession` |

### Server actions (`'use server'`, one file per concern)

| File | Exports |
|---|---|
| `src/actions/relay-runtime/session-actions.ts` | `getOrCreateRelaySessionAction`, `getRelaySessionAction`, `updateRelaySessionAction` |
| `src/actions/relay-runtime/cart-actions.ts` | `addToCartAction`, `updateCartItemAction`, `removeFromCartAction`, `clearCartAction`, `applyDiscountCodeAction` |
| `src/actions/relay-runtime/booking-actions.ts` | `reserveSlotAction`, `cancelSlotAction`, `confirmBookingAction` |
| `src/actions/relay-runtime/index.ts` | Barrel re-export consumed by the API route |

> Note: a different `src/actions/relay-session-actions.ts` already
> exists (loads partner relay config). The new files live under
> `src/actions/relay-runtime/` to avoid colliding with that contract.

### API & client

| File | Purpose |
|---|---|
| `src/app/api/relay/action/route.ts` | CORS-friendly POST endpoint. Accepts `{ action, conversationId, partnerId, payload }` and dispatches to the server action layer. Supports `get_session`, `fetch_session`, `update_session`, `add_to_cart`, `update_cart`, `remove_from_cart`, `clear_cart`, `apply_discount`, `reserve_slot`, `cancel_slot`, `confirm_booking`. |
| `src/hooks/useRelaySession.ts` | Client hook. Loads/creates the session on mount, exposes `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, `applyDiscount`, `reserveSlot`, `cancelSlot`, `confirmBooking`. Updates local state from server responses so consumers can wire it straight into `BlockRenderer` callbacks. |

### Block layer changes

| File | Change |
|---|---|
| `src/components/relay/blocks/types.ts` | Extended `BlockCallbacks` with `onAddToCart`, `onUpdateCartItem`, `onRemoveFromCart`, `onClearCart`, `onApplyDiscount`, `onReserveSlot`, `onCancelSlot`, `onConfirmBooking`, plus a `cart: BlockCartContext` snapshot. New helper interfaces `BlockAddToCartArgs`, `BlockReserveSlotArgs`, `BlockCartItemRef`, `BlockCartContext`. |
| `src/components/relay/blocks/CartBlock.tsx` | New block. Reads `callbacks.cart` and emits `onUpdateCartItem` / `onRemoveFromCart`. |
| `src/components/relay/blocks/BlockRenderer.tsx` | Imports `CartBlock`, adds `case "cart"`. Catalog/products case now prefers `onAddToCart` (fall back to legacy `onSendMessage` if the host hasn't wired session callbacks). |
| `src/components/relay/blocks/BookingFlow.tsx` | Step 1 → Step 2 "Continue" now calls `callbacks.onReserveSlot` to create a tentative reservation when a session is wired. |

### Widget integration

| File | Change |
|---|---|
| `src/components/relay/RelayWidget.tsx` | Generates a stable `conversationId`, instantiates `useRelaySession`, builds a `BlockCallbacks` snapshot, threads it into `HomeScreenRenderer` and `ChatInterface`. |
| `src/components/relay/HomeScreenRenderer.tsx` | Accepts `callbacks?: BlockCallbacks` and forwards to every `BlockRenderer`. |
| `src/components/relay/ChatInterface.tsx` | Accepts `conversationId` + `callbacks` for parent-driven session wiring (no behavioural change — message bubbles render as text and don't currently re-dispatch through `BlockRenderer`). |
| `src/components/relay/RelayFullPage.tsx` | Mounts `useRelaySession` so the runtime session document is created for the public `/r/[partnerId]` page. |

### Firestore rules

`firestore.rules` (the file referenced by `firebase.json` — there is a
stale duplicate at `src/firestore.rules`, which we left alone) gained a
`match /relaySessions/{sessionId}` block immediately above the
catch-all deny. Reads / creates are open (the widget is unauth'd);
identity fields are immutable on update; deletes are denied (sessions
are TTL-style).

## How the action loop works

1. Widget mounts → `useRelaySession` POSTs `{ action: 'get_session' }`
   to `/api/relay/action`.
2. Server action calls `loadOrCreateSession(partnerId, conversationId)`
   under `relaySessions/{partnerId}_{conversationId}`.
3. Block-level interactions (e.g. "Add to cart" in `CatalogCards`)
   bubble through `BlockRenderer` → `callbacks.onAddToCart` →
   `useRelaySession.addToCart` → `POST /api/relay/action`
   `{ action: 'add_to_cart', payload: { … } }`.
4. Server response includes the new `cart` / `booking`; the hook
   reduces it into local state and re-renders the consumer.

## Known gap

The partner-side test chat (`/partner/relay`) still renders blocks via
`TestChatBlockPreview`, which mounts admin-preview components that
don't yet accept `BlockCallbacks`. Cart/booking actions therefore do
not flow through that surface even though the runtime session document
is created. Production-style rendering via `BlockRenderer` (used by
`RelayWidget` / `HomeScreenRenderer`) is fully wired.

## Verification

- `tsc --noEmit` passes (run via the package's `typecheck` script).
- Files created can each be opened independently — no single file
  exceeded ~170 lines.
