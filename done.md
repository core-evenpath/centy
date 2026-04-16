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

---

# Relay Commerce Phase 3 — Orders + Admin Modules View

Status: implementation complete on the same branch
(`claude/relay-session-actions-Ak9zl`), stacked on top of Phase 2.
Split into many small files so no single write had to carry the whole
feature.

## Phase 3a — Orders system

### Shared types & helpers (no `'use server'`, safe from client)

| File | Purpose |
|---|---|
| `src/lib/relay/order-types.ts` | `OrderStatus`, `OrderItem`, `OrderAddress`, `OrderTracking`, `OrderTimeline`, `RelayOrder`, `CreateOrderInput`, `OrderSummary`, `OrderLookupResult` |
| `src/lib/relay/order-helpers.ts` | `generateOrderId` (6-char unambiguous alphabet), `getStatusLabel`, `computeOrderPricing` (free shipping ≥ ₹500 + 18% GST), `orderToSummary`, `orderStatusToStepLabel`, `ORDER_TRACKER_STEPS` |
| `src/lib/relay/order-store.ts` | Firestore refs + `loadOrder` / `saveOrder` for `partners/{pid}/orders/{oid}` |

### Server actions (one file per concern)

| File | Exports |
|---|---|
| `src/actions/relay-orders/create-order.ts` | `createOrderFromCartAction` — loads the runtime session, snapshots cart into order doc, drains cart, revalidates `/partner/orders` |
| `src/actions/relay-orders/get-order.ts` | `getOrderAction`, `getOrdersForConversationAction`, `getPartnerOrdersAction` |
| `src/actions/relay-orders/update-order.ts` | `updateOrderStatusAction` (appends timeline + milestone timestamp), `addTrackingInfoAction` |
| `src/actions/relay-orders/lookup-order.ts` | `lookupOrderAction` — cross-partner `collectionGroup('orders')` query for the widget tracker, returns sanitized `OrderLookupResult` |
| `src/actions/relay-orders/index.ts` | Barrel re-export |

### API + client hook

| File | Purpose |
|---|---|
| `src/app/api/relay/order/route.ts` | CORS-open POST dispatcher (`create` / `lookup` / `list`) + GET shortcut (`?orderId=…`) |
| `src/hooks/useRelayCheckout.ts` | Client hook with `checkout`, `lookupOrder`, `listOrders`, + `loading` / `error` / `order` state |

### Block layer

| File | Change |
|---|---|
| `src/lib/relay/blocks/ecommerce/order-tracker-live.tsx` | Wraps the existing `OrderTrackerBlock` — when `data.orderId` is present, fetches `/api/relay/order?orderId=…` and projects the live `OrderStatus` into the 5-step UI |
| `src/lib/relay/blocks/ecommerce/order-confirmation-live.tsx` | Wraps `OrderConfirmationBlock` — when `data.order` is a real `RelayOrder`, maps it into the card's expected shape |
| `src/lib/relay/blocks/index.ts` | Registers the live wrappers against the existing block definitions so preview fallback still works |
| `src/components/relay/blocks/types.ts` | Added `onCheckout?: () => Promise<unknown> | void` to `BlockCallbacks` |
| `src/components/relay/blocks/BlockRenderer.tsx` | Wires `callbacks.onCheckout` into `CartBlock`'s `onCheckout` prop |
| `src/components/relay/checkout/address-form-fields.ts` | Declarative address-field schema |
| `src/components/relay/checkout/CheckoutAddressForm.tsx` | Controlled address form + payment method pills |
| `src/components/relay/checkout/CheckoutFlow.tsx` | Overlay modal: owns `useRelayCheckout`, submits, closes on success |
| `src/components/relay/RelayWidget.tsx` | Instantiates the checkout flow, exposes `onCheckout` in `sessionCallbacks`, mounts `<CheckoutFlow>` alongside the widget |

### Firestore rules

`firestore.rules` gained a `partners/{pid}/orders/{orderId}` match — read/update gated by `canAccessPartner` / `canModifyPartner`; create/delete denied (server-side only). Identity + items + createdAt are immutable on update. The widget's cross-partner lookup runs through Admin SDK (rules bypassed) so no public collection-group read rule is needed — keeping raw addresses / phone / payment method partner-scoped.

### Checkout loop end-to-end

1. Cart block's checkout button → `callbacks.onCheckout` → `RelayWidget` opens `<CheckoutFlow>`.
2. Form submit → `useRelayCheckout.checkout(address, method)` → `POST /api/relay/order` `{ action: 'create' }`.
3. Server loads session, snapshots cart, writes order doc, clears cart.
4. Response returns the full `RelayOrder`; the hook folds it into local state and the overlay closes.
5. The next time the `ecom_order_confirmation` block renders with `data.order = <RelayOrder>`, `OrderConfirmationLive` maps it into the visual card.
6. Tracking lookup: `ecom_order_tracker` with `data.orderId = "ORD-XXXX"` triggers `OrderTrackerLive` → `GET /api/relay/order?orderId=…` → real status + carrier.

## Phase 3b — Admin Relay Modules view (`/admin/relay/modules`)

### Shared types / derivation

| File | Purpose |
|---|---|
| `src/lib/relay/module-analytics-types.ts` | `BlockModuleBinding`, `ModuleBlockUsage`, `RelayModuleAnalytics`, `SimpleBlockRef` — consumed by both server action and client view |
| `src/lib/relay/module-analytics-derive.ts` | `buildBlockVerticalMap` (inverts `sub.industryId` → `block.verticals[]`), `resolveBlockVerticals` — pure, no I/O |

### Server actions

| File | Exports |
|---|---|
| `src/actions/relay-module-analytics/analytics.ts` | `getRelayModuleAnalyticsAction` — joins `ALL_BLOCKS_DATA` with `systemModules`, `relayBlockConfigs`, and partner `businessModules` (collection-group) to produce `{ connectedBlocks, darkBlocks, modules, …counts }` |
| `src/actions/relay-module-analytics/lookups.ts` | `getBlocksForModuleAction`, `getModuleForBlockAction` |
| `src/actions/relay-module-analytics/index.ts` | Barrel |

### Page + view components

| File | Purpose |
|---|---|
| `src/app/admin/relay/modules/page.tsx` | Server component: runs the action once, renders the view |
| `src/app/admin/relay/modules/RelayModulesView.tsx` | Client orchestrator: vertical filter + tabs for dark / connected / modules |
| `src/app/admin/relay/modules/SummaryCards.tsx` | 4-card summary row (total blocks, module-dependent, dark, modules) |
| `src/app/admin/relay/modules/VerticalFilter.tsx` | "All / automotive / ecommerce / …" pill filter |
| `src/app/admin/relay/modules/DarkBlockCard.tsx` | Amber card with "View Module" / "Create Module" deep links |
| `src/app/admin/relay/modules/ConnectedBlockCard.tsx` | Neutral card showing module slug + item count |
| `src/app/admin/relay/modules/ModuleCard.tsx` | Module row listing every block it powers + item/partner totals |

### Navigation

`src/app/admin/relay/RelayDashboard.tsx` gained a "Modules ↔ Blocks" link next to Block Registry / Flow Editor.

## Verification

- `tsc --noEmit`: net zero new errors vs baseline (same 400-class of pre-existing env-only errors — missing React types / module stubs).
- Every new file stays comfortably small (~40–200 lines each); the biggest file in the diff is `analytics.ts` at ~170 lines and it's composed of 4 small named helpers.

## Known gaps / follow-ups

- **Chat assistant doesn't auto-surface `order_confirmation` on success.** The overlay closes silently; a future change should post a system-style chat message referencing the new order id so the `OrderConfirmationLive` block picks up `{ order }` on its next render. The hook surface already supports this via `onOrderCreated`.
- **No partner-facing orders dashboard yet.** `revalidatePath('/partner/orders')` is a placeholder — the route itself is a follow-up PR.
- **Discount codes still built-in.** `applyDiscountCodeAction` (from Phase 2) stays with its two-code test list; real partner-owned codes deserve their own config layer.
- **Collection-group indexes.** The first deploy of this branch needs a composite index for `orders` (`id asc`) and another for `businessModules` (`moduleSlug asc`) so the two `collectionGroup` queries in `lookupOrderAction` / `loadModuleItemCounts` run without fallback errors.
