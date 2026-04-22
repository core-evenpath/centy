# Pingbox Homepage & Marketing Site Upgrade

**Branch:** `claude/affectionate-diffie-644888`  
**Completed:** 2026-04-19

## What was built

Replaced the old Tailwind-based homepage and built a complete marketing site for Pingbox.io across 6 phases.

### Phase 1 — Homepage
- Created `src/app/(marketing)/` route group (no URL impact)
- `layout.tsx`: Karla + Fraunces + JetBrains Mono via `next/font/google`, global animations CSS
- `components/theme.ts`: shared color palette `C`, font variables `F/FM/FS`, SVG icon paths
- `components/PingboxHomepage.tsx`: full client component (Nav, Hero, TrustBar, ProblemStats, HowItWorks, Platform, Comparison, Industries, Pricing, FAQ, FinalCTA, Footer, RegionBanner)
- `page.tsx`: thin server wrapper importing PingboxHomepage
- Deleted old `src/app/page.tsx` (conflicting Tailwind homepage)

### Phase 2 — Stub pages (35 routes)
All hrefs in the homepage now resolve to real pages. Zero broken links.

US routes: `/pricing`, `/relay`, `/engage`, `/intelligence`, `/for/teams`, `/for/dental-clinics`, `/for/hvac`, `/for/fitness`, `/for/real-estate`, `/for/law-insurance`, `/for/b2b-wholesale`, `/contact/sales`, `/customers`, `/about`, `/careers`, `/security`, `/cookies`, `/changelog`, `/docs`, `/docs/api`, `/blog`, `/case-studies`, `/help`, `/tools/leak-calculator`, `/us`

India routes: `/in`, `/in/pricing`, `/in/customers`, `/in/contact/sales`, `/in/for/dental-clinics`, `/in/for/hvac`, `/in/for/fitness`, `/in/for/real-estate`, `/in/for/b2b-wholesale`

### Phase 3 — Priority pages (real content from `pingbox-site-content.docx`)
Fully implemented with inline styles (no Tailwind):
- `/pricing` — full pricing page with billing toggle, tier cards, feature matrix, ROI anchor, FAQ accordion
- `/relay` — product deep-dive with block library, text-vs-UI comparison, embed snippet
- `/engage` — unified inbox, routing rules, broadcast campaigns
- `/intelligence` — revenue attribution, 6 dashboards, AI lift tracking, integrations
- `/contact/sales` — sales form with trust signals sidebar, WhatsApp demo path
- `/customers` — minimum viable page with beta-partner callout
- `/for/teams` — multi-location deep-dive with rollout framework
- All 6 industry pages (dental, HVAC, fitness, real estate, law/insurance, B2B wholesale) via reusable `IndustryPage` component

### Phase 4 — India subsite (/in)
- `/in` — WhatsApp-first India homepage with ₹ pricing preview, Hindi/Tamil/Marathi support, DPDP compliance, Meta BSP badge
- `/in/pricing` — ₹6,999/₹16,999/₹0 tiers, GST-invoiced, Razorpay, annual/monthly toggle
- `/in/customers` — beta-partner callout with Indian context
- `/in/contact/sales` — India sales form with WhatsApp number field, city dropdown, demo format selection
- 5 India industry pages — same `IndustryPage` component with India-specific content (IndiaMART, Zoho, LeadSquared, ₹ ROI math)

### Phase 5 — SEO infrastructure
- `src/app/sitemap.ts` — updated with all 36 marketing URLs, proper priorities
- `src/app/(marketing)/layout.tsx` — hreflang `en-us`/`en-in`/`x-default` (removed incorrect shared canonical)
- `src/app/(marketing)/in/layout.tsx` — India sub-layout with self-referential `/in` canonical + hreflang back to `/`
- Key pages refactored to server wrappers + client components for per-page canonical metadata:
  - `pricing`, `relay`, `engage`, `intelligence`, `contact/sales`, `customers`, `for/teams`
  - All have correct `alternates.canonical` and paired hreflang where India equivalent exists

### Phase 6 — Validation
- `tsc --noEmit`: zero marketing errors (only pre-existing issues in admin/lib files)
- Broken link scan: all 35+ hrefs resolve; `/partner/login` confirmed via `(auth)` route group
- Build compilation: passes in 39.4s; pre-render failures are Firebase credential issues in pre-existing admin/partner routes (expected in worktree without .env)

## Architecture decisions
- Inline styles throughout (no Tailwind conversion)
- `'use client'` for interactive pages; server component wrappers export metadata
- Shared `IndustryPage` component reused for US + India verticals
- Shared `StubPage` component for remaining placeholder pages
- `RegionBanner` parameterized (`fromRegion`, `toHref`, `toLabel`) for reuse

## Files created / modified
- `src/app/(marketing)/layout.tsx` — modified
- `src/app/(marketing)/in/layout.tsx` — new
- `src/app/(marketing)/components/theme.ts` — new
- `src/app/(marketing)/components/PingboxHomepage.tsx` — new
- `src/app/(marketing)/components/StubPage.tsx` — new
- `src/app/(marketing)/components/IndustryPage.tsx` — new
- `src/app/(marketing)/components/PricingClient.tsx` — new
- `src/app/(marketing)/components/RelayClient.tsx` — new
- `src/app/(marketing)/components/EngageClient.tsx` — new
- `src/app/(marketing)/components/IntelligenceClient.tsx` — new
- `src/app/(marketing)/components/ContactSalesClient.tsx` — new
- `src/app/(marketing)/components/CustomersClient.tsx` — new
- `src/app/(marketing)/components/ForTeamsClient.tsx` — new
- 35+ `page.tsx` files across US and India routes
- `src/app/sitemap.ts` — updated

---

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

---

# Option A — Quick wins on top of Phase 3

Closes out the three Phase-3 gaps flagged in the section above. Split
into many small files so each write stays modest.

## Task 1 — Order confirmation surfaces in chat

After checkout, the widget now switches to the chat view and injects
a system-style `ecom_order_confirmation` block carrying the real
`RelayOrder`.

| File | Change |
|---|---|
| `src/components/relay/RegisteredBlock.tsx` | New — thin wrapper around the block registry: calls `registerAllBlocks()` once, then renders the component returned by `getBlock(blockId)`. Returns null for unknown ids. |
| `src/components/relay/chat-message-types.ts` | New — shared `RelayChatMessage` shape with optional `blockId` / `blockData`. |
| `src/components/relay/ChatInterface.tsx` | Extended local `ChatMessage` to the shared type, accepts a new `injectMessage` prop (dedup'd by id via a ref-held `Set`), renders `<RegisteredBlock>` above the text bubble when `blockId` is present. |
| `src/components/relay/RelayWidget.tsx` | New `handleOrderCreated(order)` — closes the overlay, builds an injected message (`blockId: 'ecom_order_confirmation'`, `blockData: { order }`), and switches `view` to `'chat'` so the confirmation is visible regardless of which tab the user came from. `OrderConfirmationLive` already knows how to project `data.order` into the visual card. |

## Task 2 — Firestore composite indexes

`firestore.indexes.json` gained four entries (existing entries
untouched):

- `orders` collection-group, `id asc` → `lookupOrderAction`
- `orders` collection, `conversationId asc + createdAt desc` → `getOrdersForConversationAction`
- `orders` collection, `status asc + createdAt desc` → `getPartnerOrdersAction` status filter
- `businessModules` collection-group, `moduleSlug asc` → `loadModuleItemCounts` in `/admin/relay/modules`

Deploy with `firebase deploy --only firestore:indexes`.

## Task 3 — Partner orders dashboard (`/partner/orders`)

| File | Purpose |
|---|---|
| `src/app/partner/(protected)/orders/page.tsx` | Tiny server wrapper; renders the client dashboard inside the standard partner container. |
| `src/app/partner/(protected)/orders/OrdersDashboard.tsx` | Client orchestrator. Resolves `partnerId` via `useMultiWorkspaceAuth`, loads via `getPartnerOrdersAction`, owns filter + selection state, wires status updates to `updateOrderStatusAction`. |
| `src/app/partner/(protected)/orders/orders-constants.ts` | Status-tab definitions, tailwind badge color map, linear status flow + `nextStatusAfter()` helper. |
| `src/app/partner/(protected)/orders/StatsCard.tsx` | 5 summary tiles (total / pending / processing / shipped / delivered). |
| `src/app/partner/(protected)/orders/OrderRow.tsx` | Row in the left-hand list (id, status badge, item count, total, relative createdAt via `date-fns`). |
| `src/app/partner/(protected)/orders/OrderDetailPanel.tsx` | Right-hand detail: items, totals (subtotal / discount / shipping / tax / total), shipping address, payment, tracking, "Mark as <next status>" action + conditional Cancel button. |
| `src/components/navigation/UnifiedPartnerSidebar.tsx` | Added `ShoppingBag`-iconed "Orders" link at `/partner/orders`. |

Behavior notes:
- Selection survives list reload (if the selected order is still in the filtered set it gets updated in place; otherwise cleared).
- Status updates short-circuit: on success, the single row is patched locally without re-fetching the full list, keeping scroll + selection stable.
- Currency formatting is INR-aware (₹ symbol); everything else prints the raw code. Matches the format used in `OrderConfirmationLive`.
- Uses the existing `sonner` toast system (also used elsewhere in partner settings).

## Verification

- `npm run typecheck`: no new errors introduced; same 400-class of pre-existing env/stub issues as the baseline.
- File sizes stay modest: biggest new file is `OrdersDashboard.tsx` (~220 lines) since it orchestrates a few hooks; every other new file is comfortably under 140 lines.

## Follow-ups that remain

- Order detail page with per-order edit (addresses, add tracking info) — the dashboard detail panel intentionally stays read-only for addresses in this pass.
- Customer-facing "where is my order" intent in the chat still returns the design sample until `OrderTrackerLive` is triggered by an explicit `orderId` in the intent parse.
- Partner-side test chat (`TestChatBlockPreview`) still doesn't thread callbacks through admin preview blocks — unchanged from Phase 2.

---

# Commerce Engine Completion

Two focused tasks on top of Phase 3 + Option A that close the "orders can be tracked end-to-end" story. Split across many small files so no single write is dangerous.

## Task 1 — Tracking editor on the order detail panel

Partners can now add / edit tracking info from the `/partner/orders` detail pane. The server action (`addTrackingInfoAction`) already existed; this wires a UI around it and auto-flips the order to `shipped` status with a timeline entry.

| File | Action | Purpose |
|---|---|---|
| `src/app/partner/(protected)/orders/tracking-carriers.ts` | NEW | Pure data module: 10-carrier list, per-carrier URL builders (Delhivery / BlueDart / DTDC / FedEx / UPS), `carrierLabel()` + `carrierValueFromLabel()` helpers. |
| `src/app/partner/(protected)/orders/TrackingFormDialog.tsx` | NEW | Controlled form in a shadcn `Dialog`: carrier select (with a free-text fallback for "Other"), AWB, optional tracking URL (auto-filled on carrier/number change), optional ETA date. Validates shape before enabling the submit button. |
| `src/app/partner/(protected)/orders/OrderDetailPanel.tsx` | MODIFY | Accepts new `partnerId` + `onTrackingUpdated` props. The Tracking section now renders for any confirmed/processing/shipped/out-for-delivery order, with an inline "Add tracking" or "Edit" button that opens the dialog. On save it calls `addTrackingInfoAction` and shows a `sonner` toast. |
| `src/app/partner/(protected)/orders/OrdersDashboard.tsx` | MODIFY | Threads `partnerId` into the detail panel and passes `loadOrders` as `onTrackingUpdated` so the row reflects the new status after a save. |

### Behavior notes

- Carrier select pre-populates from the stored `carrier` string via `carrierValueFromLabel()` — round-trip works even though we store the human label, not the value.
- The dialog blocks interaction (can't close) while `savingTracking` is true, preventing double-submits.
- `addTrackingInfoAction` itself flips the order to `shipped` and appends a `"Shipped via <carrier> (<awb>)"` timeline entry — the dialog doesn't do this itself, so the behavior stays centralized in the server action.

## Task 2 — "Where is my order" intent → real tracker

Chat visitors can now trigger the live order tracker from a free-form message. The intent engine already had an `order_status` type and a `resolveOrderTracker` that hands the orderId into `ecom_order_tracker`; this PR tightens the id regex and makes the tracker gracefully prompt for an id when none is quoted.

| File | Action | Purpose |
|---|---|---|
| `src/lib/relay/order-id-parser.ts` | NEW | Shared regex + helpers: `ORDER_ID_REGEX` (matches canonical `ORD-XXXXXX` *and* the legacy `#PBX-NNNNNN` design-sample shape), `extractOrderId()`, `isCanonicalOrderId()`, `normalizeOrderIdInput()` (lenient — tolerates leading `#`, lowercase, bare 6-char suffix). |
| `src/lib/relay/intent-engine.ts` | MODIFY | `detectOrderId()` now delegates to the shared `extractOrderId()`. The old ad-hoc regex required 4+ digits, which failed against the actual `generateOrderId()` output (letter-heavy alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) — real `ORD-ABC234` ids weren't matching. |
| `src/lib/relay/blocks/ecommerce/order-tracker-input.tsx` | NEW | Small inline form rendered by `OrderTrackerLive` when no orderId is provided. Normalizes input through `normalizeOrderIdInput()` so users typing just `ABC234` get promoted to `ORD-ABC234`. |
| `src/lib/relay/blocks/ecommerce/order-tracker-live.tsx` | MODIFY | Now maintains its own `pendingOrderId` state. `activeOrderId = data.orderId ?? pendingOrderId`. When neither is set it renders `<OrderTrackerInput>`; on submit the fetch kicks off and the component transitions into the normal loading/error/result flow. |

### Behavior notes

- No change needed in `block-resolver.ts` — the existing `resolveOrderTracker()` already routes `order_status` intent (with or without `intent.orderId`) to `ecom_order_tracker`. The input-form fallback handles the "empty id" path.
- The canonical regex is deliberately lenient (4–10 chars suffix) in case future id generators change length — `CANONICAL_ORDER_ID_REGEX` keeps the strict 6-char shape for input validation.
- The input component is client-only (styled via inline `BlockTheme` tokens to match the rest of the block gallery) — no shadcn deps to avoid pulling the widget bundle into tailwind territory.

## Verification

- `npm run typecheck`: 400 errors — identical to the pre-change baseline. Two `intent-engine.ts` TS2322 warnings about `string | null` vs `string | undefined` on `intent.orderId` already existed before this PR and weren't introduced here.
- File sizes: largest new file is `TrackingFormDialog.tsx` (~170 lines); everything else is 50–120 lines.

## What's still open

- **Timeline notes:** the detail panel doesn't expose a "Add note" control yet.
- **Partner-side test chat** still uses `TestChatBlockPreview`, which doesn't thread callbacks through admin preview blocks.
- **Customer order history:** no "show all my orders" surface yet — customers need to know their order id.
- **Email / SMS notifications:** order status changes don't trigger outbound messages.

---

# AI Data Collection — "Let AI collect it for you"

Backend + UI for the new onboarding accelerator: partner clicks **Let AI collect for you** on an empty module, picks a source (website / PDF / pasted text / AI-generated), reviews the extracted items, approves → items land in the module.

Split across many small files so each concern stays reviewable in isolation. 17 new files, 1 modified page.

## Module layout

```
src/lib/relay/ai-ingest/
├── types.ts                    dep-free shapes (IngestInput, ExtractedItem, IngestResult)
├── schema-builder.ts           ModuleSchema → Zod schema for `ai.generate({ output })`
├── prompt-builder.ts           Extraction prompt (schema description + rules + content)
├── engine.ts                   `ai.generate()` wrapper (Gemini 2.5 Flash, temp 0.3)
└── sources/
    ├── types.ts                `SourceExtractionResult`
    ├── website.ts              scrapeWebsiteAction → knowledge.{packages,services,products,menuItems,faqs,pricingTiers,offerings}
    ├── pdf.ts                  base64 → tmp file → `extractPageTextFromPdf`
    ├── core-memory.ts          `partners/{pid}/hubDocuments/{id}.extractedText`
    ├── text.ts                 raw text + AI-generate wrapper
    └── index.ts                barrel

src/actions/ai-ingest/
├── ingest.ts                   Orchestrator: loads partner+system module, merges schema, runs source adapter, calls engine
├── save.ts                     `bulkCreateModuleItemsAction` wrapper; stashes provenance under `fields.__ingest`
└── index.ts                    barrel

src/app/api/relay/ai-ingest/
└── route.ts                    POST dispatcher — `action: 'ingest' | 'save'`, `maxDuration = 60`

src/hooks/
└── useAIIngest.ts              State machine: pickerOpen / reviewOpen / loading / saving / result

src/components/relay/ai-ingest/
├── source-options.ts           Static catalogue of the 4 pickable sources
├── SourcePickerModal.tsx       Two-stage modal (pick → source-specific form)
├── ReviewItemRow.tsx           Single extracted item w/ inline name edit + remove
├── ReviewModal.tsx             Owns the local edit state, seeds from ingest result
└── IngestMount.tsx             Convenience wrapper mounting both modals with a shared hook
```

## Flow

```
(1) User opens empty module → Empty-state shows "Let AI collect for you" CTA
    → `ingest.startIngest()`

(2) SourcePickerModal opens
    • User picks: website URL / PDF upload / paste text / AI-describe
    • onSubmit → POST /api/relay/ai-ingest { action: 'ingest', … }

(3) ingestContentAction:
    • getPartnerModuleByIdAction → { partnerModule, systemModule }
    • effectiveSchema = systemModule.schema.fields ⧺ partnerModule.customFields
    • getBusinessPersonaAction → industry blurb for prompt context
    • runSourceAdapter → raw text content
    • extractItemsFromContent (Gemini 2.5 Flash w/ Zod-schema output)
    → IngestResult { items, warnings, sourceLabel, processingTimeMs }

(4) ReviewModal opens with the extracted items
    • Users can inline-edit name and remove rows
    • Confidence badge + low-confidence warning
    • Approve → POST /api/relay/ai-ingest { action: 'save', items, … }

(5) saveIngestedItemsAction:
    • maps ExtractedItem → Partial<ModuleItem> (provenance under fields.__ingest)
    • bulkCreateModuleItemsAction writes the batch
    • revalidates /partner/relay/datamap + /partner/relay/modules
```

## Wired surfaces

- `src/app/partner/(protected)/relay/modules/[slug]/page.tsx` —
  empty-state CTA row now shows two buttons: **Let AI collect for you** (primary) and **Add manually** (outline). Instantiates `useAIIngest`; the module + item list refetch on successful save. `<IngestMount>` sits at the bottom of the JSX.

Datamap integration (`/partner/relay/datamap`) intentionally stays in a follow-up PR — feature → module resolution logic there is non-trivial and this PR already touches 17 files.

## Tradeoffs / adjustments from the spec

- **ModuleFieldType** union is narrower than the spec assumed (`'radio'`, `'boolean'` don't exist). Schema-builder maps only the real types; unknowns degrade to `z.string()`.
- **`extractPageTextFromPdf`** takes a **file path**, not a Buffer, and returns `{ success, text }`. PDF adapter writes to a `tmp` file and cleans up in `finally`.
- **`scrapeWebsiteAction`** returns an `AutoFilledProfile` — the website adapter flattens the `knowledge.*` sub-trees into a labeled text blob rather than raw page content.
- **Genkit `output`** is a property getter, not a method (the legacy `result.output()` in an older flow file is a pre-existing TS error). Engine reads `result.output` directly.
- **`ModuleItem`** has no generic `metadata` slot; ingest provenance goes under `fields.__ingest` with `{ source, confidence, importedAt, preview }`. Consumers ignore it; the review modal hides any `__`-prefixed field from its preview row.
- **Core Memory** docs live at `partners/{pid}/hubDocuments/{id}.extractedText` (not `documents` as the spec guessed). Confirmed by grepping `partnerhub-actions.ts`.

## Verification

- `npm run typecheck` — 400 errors, **identical** to the pre-change baseline. Zero new errors across all 17 new files.
- Largest new file: `SourcePickerModal.tsx` (~260 lines). Everything else is 40–180 lines.

## What remains open

- **Datamap wire-in** — the `/partner/relay/datamap` page still has stub `onFileUpload` / `onUseMemory` / `onFetchApi` handlers. Future PR: compute the target module from the `mappedFeatures` entry + the block's `module` binding, then reuse the same hook.
- **Images** — items don't yet get images. The website adapter has the page URLs but we don't parse `<img>`s or surface them into the review modal.
- **Dedup** — no "item looks similar to an existing one" detection.
- **Streaming** — extraction is single-shot (`ai.generate`). Gemini supports streaming; follow-up could surface items as they arrive.

---

# Datamap Design Upgrade — expandable items + inline AI flow

Replaces the flat "needs your input" + separate `DataInputPanel` pattern with expandable cards that surface three choices (Upload / Core Memory / Let AI collect). Picking the AI option runs an inline state machine: `checking` → `found` (offer to connect an existing module) or `not_found` (generate prompts, let partner edit, then activate an AI-driven data-collection module). "Live now" rows are also expandable now, with a data-source / items-synced summary + a placeholder slot for a future UI preview.

## Files (split for reviewability)

### Types + theme + icons

| File | Change |
|---|---|
| `src/app/partner/(protected)/relay/datamap/types.ts` | Appended `AIFlowState`, `MatchedModule`, `GeneratedPrompt`. |
| `src/app/partner/(protected)/relay/datamap/constants.ts` | Added `greenBdr2` + `amberBdr2` darker-border tokens. |
| `src/app/partner/(protected)/relay/datamap/components/inline-icon.tsx` | Added `chevronUp` / `chevronDown` / `edit` path data. |

### Server actions (new)

| File | Exports |
|---|---|
| `src/actions/content-studio-module-match.ts` | `matchExistingModuleAction(partnerId, moduleSlug)` — looks up `partners/{pid}/businessModules` by slug and returns a `MatchedModule` (name / itemCount / timestamps / first 5 field labels) if one already exists with items. |
| `src/actions/content-studio-generate-prompts.ts` | `generateDataCollectionPromptsAction(partnerId, featureLabel, moduleSlug, partnerActionDescription)` — Gemini 2.5 Flash generates 2–5 short conversational prompts + a suggested module name derived from the feature label. |
| `src/actions/content-studio-activate-collection.ts` | `activateAICollectionAction(partnerId, featureId, prompts, suggestedModuleName)` — creates a custom partner module under `businessModules` with `customFields` built from the prompts + writes a pointer at `partners/{pid}/relayConfig/aiCollectionPrompts[featureId]` so the chat agent can pick the prompts up later. |

### UI components (new)

| File | Purpose |
|---|---|
| `components/needs-input/format-relative.ts` | Pure "X days ago" helper. |
| `components/needs-input/prompt-item.tsx` | One editable prompt row (edit-in-place / remove). |
| `components/needs-input/ai-flow-panel.tsx` | The state machine. Kicks off the match + prompt-generation calls in parallel with the initial check; renders the matching-module card or the prompt builder depending on the result. |
| `components/needs-input/needs-input-item.tsx` | Expandable amber card with the 3 option buttons + swap-in for the AI flow. |
| `components/live-now/live-now-preview.tsx` | Two-card summary + source row + profile-fields list + "Displays in UI as" placeholder. |
| `components/live-now/live-now-item.tsx` | Expandable green row rendering `LiveNowPreview` in the expanded state. |

### UI components (rewritten)

| File | Change |
|---|---|
| `components/feature-list.tsx` | Now a thin orchestrator — iterates `notReady` through `NeedsInputItem` and `ready` through `LiveNowItem`, holds only the single "active live row" selection. API changed from 5 legacy handlers to 4 new ones (`onUpload`, `onUseMemory`, `onConnectModule`, `onActivateAICollection`). |

### Page wiring

| File | Change |
|---|---|
| `src/app/partner/(protected)/relay/datamap/page.tsx` | New `ingestTarget` state + single `useAIIngest` instance; `resolveFeatureModule()` resolves a feature's `moduleSlug` to the partner module id via `getPartnerModulesAction`. New handlers `handleUpload`, `handleUseMemory`, `handleConnectModule`, `handleActivateAICollection` replace the stubs. `DataInputPanel` (still used on the empty-state screen) keeps its old 5-handler API via a `legacyInputHandlers` adapter. `<IngestMount>` mounts at the bottom of the page so the picker + review modals share a single instance. |

## Behavior

1. Partner clicks a "Needs your input" card → expands inline with 3 options.
2. Option "Let AI collect for you" → AI flow panel takes over:
   - Spinner while `matchExistingModuleAction` + `generateDataCollectionPromptsAction` race.
   - If a matching module exists with items → **found**: card shows `{name, itemCount, updatedAt, first 5 fields}` + Connect / Create-new buttons.
   - Otherwise → **not_found**: renders the generated prompts, each editable in place + a "Suggested module name" banner that links to `/partner/relay/modules`.
3. "Connect this module" → parent `onConnectModule` callback fires, page refetches state.
4. "Activate AI collection" → `activateAICollectionAction` writes the new custom module + registers the prompts, page refetches state.
5. "Upload a document" and "Use Core Memory" routes reuse the existing `useAIIngest` picker/review modals from PR #126 (AI data collection).

## Verification

- `npm run typecheck`: 400 errors — identical to the pre-change baseline. No new errors across 10 new files + 4 modified files.
- File sizes stay modest: biggest new file is `ai-flow-panel.tsx` at ~310 lines; everything else 40–220 lines.

## Deliberately out of scope (follow-up PR)

- **Test Chat wiring** (Tasks 4 + 5 from the original prompt). Threading `BlockCallbacks` through `TestChatBlockPreview` + wiring `useRelaySession` / `useRelayCheckout` into `/partner/relay` so the phone preview drives the production commerce flow. Kept separate because it touches 4 different files across the test-chat surface and would make this PR non-reviewable.
- **UI preview placeholder** on `LiveNowPreview` currently says "Preview available in Test Chat →". A later PR can render a mini `RegisteredBlock` in that slot once the test-chat-preview wiring lands.
- **Prompt answer handling in chat** — activating an AI collection writes the config, but the chat route doesn't yet pick it up to actually ask the prompts. Needs a handler inside `/api/relay/chat/route.ts` that checks `relayConfig/aiCollectionPrompts` when the matching feature intent fires.
- **Dedupe on activation** — re-running activation on the same feature currently creates a second custom module. Future PR should check `featureId` on the existing config doc and update in place.

---

# Flow-driven Test Chat wiring

Makes `/partner/relay` Test Chat render what's actually configured in `/admin/relay/flows`, with real interaction callbacks. Closes three distinct gaps that PR #124 / #127 left open.

## What changed

### The three root causes

1. **`TestChatBlockPreview` always routed to the admin preview registry.** Interactive blocks (`cart`, `product_card`, `ecom_checkout`, …) came through but `onAddToCart` / `onCheckout` etc. were dropped because the admin preview components don't accept `BlockCallbacks`.
2. **`/api/relay/chat` ignored `flowDecision.suggestedBlockTypes`.** Gemini's catalog was always the function-level list, so it could emit blocks the admin-configured flow explicitly excluded for the current stage.
3. **Test Chat opened empty.** The live widget's `greeting`-stage blocks never auto-rendered, so partner testing missed the actual first impression.

### Fixes

| File | Change |
|---|---|
| `src/lib/relay/flow-to-blocks.ts` (NEW) | `allowedBlocksFromFlow` / `isBlockAllowedByFlow` / `getEntryStage` / `findStageById` — pure helpers. The engine's `suggestedBlockTypes` win; union-of-all-stages is the second preference; empty allow-list means "use the function catalog". |
| `src/app/api/relay/chat/route.ts` | Hoisted `flowDef` out of the inner try block so it's visible to both the catalog filter and the response builder. Gemini's catalog is now filtered through `allowedBlocksFromFlow(flowDecision, flowDef)`. Response `flowMeta` now carries `stageId` + `stageLabel` so the UI can track transitions. |
| `src/app/api/relay/chat/seed/route.ts` (NEW) | POST `{ partnerId }` → returns the entry stage's blocks as `seedMessages[]`. Reuses the same module-loading loop the chat route uses so `buildBlockData` gets real partner data. |
| `src/components/partner/relay/test-chat/TestChatBlockPreview.tsx` | REWRITE. Interactive blocks (cart / product / booking / order-confirmation / order-tracker) route through the production `BlockRenderer` with live `BlockCallbacks`. Design-only blocks continue through the admin preview registry. `RENDERER_TYPE_MAP` translates admin-registry ids (`ecom_cart`, `product_card`, …) to the `type` union `BlockRenderer` switches on. |
| `TestChatMessages.tsx` | Accepts `callbacks` + threads it into every `<TestChatBlockPreview>`. `TestChatMessage` gains optional `stageId`. |
| `TestChatPanel.tsx` | Accepts `callbacks` + `currentStageLabel`, passes through. |
| `TestChatHeader.tsx` | Displays `Stage · <label>` in the subtitle when a stage is known; keeps the static "Test Chat" otherwise. |
| `TestChatFlowPanel.tsx` (NEW) | Debug panel shown below the phone frame — stage / lead temp / interaction count / first five suggested block ids + a link back to `/admin/relay/flows`. |
| `src/app/partner/(protected)/relay/page.tsx` | Mounts `useRelaySession` + `useRelayCheckout`; builds a `sessionCallbacks` object exposing every cart / booking / checkout handler plus the live cart snapshot. A new `useEffect` calls `/api/relay/chat/seed` on mount (and again after Clear) and feeds the returned blocks into `chatMessages`. `sendChatMessage` stores `data.flowMeta` so the header + debug panel reflect the current stage. `<CheckoutFlow>` is mounted at the root and opens when any block triggers `onCheckout`. |

## Runtime loop after this PR

```
Test Chat opens
  ↓ POST /api/relay/chat/seed
Entry stage blocks (greeting / suggestions) render via
  TestChatBlockPreview → BlockRenderer for interactive, admin preview otherwise

User sends "show me products"
  ↓ POST /api/relay/chat
  ↓ runFlowEngine → { currentStageId: 'discovery',
                       suggestedBlockTypes: ['product_card', 'suggestions'] }
  ↓ Gemini catalog = function catalog ∩ suggestedBlockTypes
  ↓ blockId validated against that intersection
Response { blockId: 'product_card', blockData, flowMeta }
  ↓
Bubble mounts BlockRenderer with sessionCallbacks
  ↓
"Add to cart" → onAddToCart → useRelaySession → Firestore write under
  relaySessions/{partnerId}_{conversationId}
  ↓
Cart block renders with live items; clicking Checkout opens CheckoutFlow overlay
  ↓
Order created → handleOrderCreated injects an ecom_order_confirmation
  message into chat with the real order.
```

## Verification

- `npm run typecheck` — 400 errors, identical to baseline. Zero new errors across 3 new files + 6 modifications.
- File sizes stay modest; largest new file is `TestChatFlowPanel.tsx` at ~130 lines.

## Still intentionally out of scope

- **Live widget seeding.** The public `/r/[partnerId]` widget already mounts `useRelaySession`; applying the same flow-entry seed to it is a follow-up PR.
- **Per-bubble stage overlay.** Messages carry `stageId` but no per-bubble debug marker yet.
- **Flow-aware validation on the client.** We rely on the server to enforce `allowedBlocksFromFlow`; the client trusts whatever `blockId` comes back.
- **Admin preview component callbacks.** Design-only admin previews stay static — they're for design review, not interaction.

---

# Relay Orchestrator — unified intelligence stack

Folds all five intelligence signals (flow, partner block prefs, datamap readiness, commerce session, RAG) into a single composable layer under `src/lib/relay/orchestrator/`. Gemini becomes a copywriter + classifier inside a tight policy box — the orchestrator owns the allow-list.

## 12 new files + 2 modifications

### Orchestrator core (`src/lib/relay/orchestrator/`)

| File | Role |
|---|---|
| `types.ts` | Shared shapes: `OrchestratorContext` / `SignalBundle` / `PolicyDecision` / `OrchestratorResponse`. No I/O. |
| `signals/partner.ts` | Partner doc + top-10 modules + items — reused by `buildBlockData`. |
| `signals/flow.ts` | Loads saved flow state or creates one; resolves `FlowDefinition` (partner override → function template); runs `detectIntent` + `runFlowEngine`; returns stage + `suggestedBlockIds`. |
| `signals/blocks.ts` | Loads partner block prefs from `partners/{pid}/relayConfig/*`. Empty subcollection ⇒ permissive downstream. |
| `signals/datamap.ts` | Reads `partners/{pid}/contentStudio/state` and buckets `blockStates` into `ready` vs `dark`. |
| `signals/session.ts` | Live cart / booking holds from `relaySessions/{pid}_{cid}` + recent orders via `getOrdersForConversationAction`. |
| `signals/rag.ts` | Top-k Firestore retrieval via `firestoreRetriever(RAGINDEX_COLLECTION_NAME)` with `where: { partnerId }`. Only fires on factual intents (`inquiry` / `complaint` / `returning` / `location` / `contact`) or hard cue keywords; transactional intents skip to save tokens. |
| `signals/index.ts` | Barrel. |
| `policy.ts` | Pure — `resolveAllowedBlocks` (flow ∩ partner-visible ∩ ¬dark), `applyCommerceBias` (cart / booking / order boosts), `decidePath` (`rag_only` / `block_only` / `block_with_rag` / `fallback`), `buildPolicyDecision`. |
| `prompt.ts` | Assembles system prompt from persona + flow stage + session state + RAG chunks + filtered block catalog (via existing `buildBlockCatalogPrompt`) + response contract. |
| `index.ts` | `orchestrate(ctx)` entry point. Partner signal first → four signals in parallel → RAG (needs intent from flow) → policy → prompt → Gemini → validate → blockData. |

### Chat route + UI

| File | Change |
|---|---|
| `src/app/api/relay/chat/route.ts` | REWRITE as ~130-line HTTP adapter. Resolves `partnerId` from the widget, calls `orchestrate()`, persists the turn + updated flow state non-blocking, returns the legacy response shape plus an additive `signals` field. |
| `src/components/partner/relay/test-chat/TestChatSignalsPanel.tsx` (NEW) | Debug panel below the phone frame showing flow + RAG + session + allowed/rejected blocks + composition path. Links back to `/admin/relay/flows`, `/partner/relay/blocks`, `/partner/relay/datamap`. |
| `src/app/partner/(protected)/relay/page.tsx` | Tracks `signals` on every response; passes through to `<TestChatSignalsPanel>`; clears on Clear. |

## Runtime loop

```
POST /api/relay/chat
  ↓ loadPartnerSignal (sequential — needed for functionId)
  ↓ Promise.all(loadFlowSignal, loadBlocksSignal, loadDatamapSignal, loadSessionSignal)
  ↓ loadRagSignal (needs intent from flow)
  ↓ buildPolicyDecision
    • allowed = flow.suggested ∩ partner-visible ∩ ¬datamap.dark
    • boost cart/checkout if cart has items, tracker if orders, booking-confirm if hold
    • decide compositionPath
  ↓ buildSystemPrompt
    • persona · stage · session state · RAG · filtered catalog · contract
  ↓ Gemini (classifier + copywriter)
  ↓ validate blockId ∈ allowed, build blockData
  ↓ { blockId, blockData, text, suggestions, flowMeta, signals, updatedFlowState }
```

## Spec-vs-reality adjustments

- **Paths**: partner block prefs live at `partners/{pid}/relayConfig/*` (used by `relay-block-actions.ts`), not `partners/{pid}/partnerModules/...` or a nested `blocks/entries`. Datamap state is `partners/{pid}/contentStudio/state` (not `relayConfig/contentStudioState`).
- **RAG retriever**: `firestoreRetriever(RAGINDEX_COLLECTION_NAME)` is a function returning a retriever, options use `where` (not `filter`).
- **`IntentSignal` union** is 12 literals: `browsing` / `comparing` / `pricing` / `booking` / `inquiry` / `complaint` / `returning` / `urgent` / `location` / `contact` / `promo` / `schedule`. The spec used `support` / `objection` / `purchase_ready` which don't exist — remapped to the real enum.
- **`detectIntent`** returns an `IntentSignal` directly (string), not an object with `.type`.
- **`buildBlockCatalogPrompt`** takes `ServerBlockData[]`, not string ids — the prompt resolves the full entries before calling it.
- **Session booking hold** check: `session.booking.slots[]` with `status: 'tentative' | 'confirmed'`, not `session.booking.reservedSlot` as the spec assumed.

## Verification

- `npm run typecheck`: 400 errors — identical to the pre-change baseline. Zero new errors across 12 new files + 2 modifications.
- Largest file: `orchestrator/index.ts` at ~200 lines; every signal loader is 40–95 lines.

## Still out of scope (follow-ups)

- **Streaming responses** — single shot today; Gemini streaming + signal-progress stream to UI is a follow-up.
- **RAG chunk dedup** — adjacent chunks from the same doc both land in the prompt.
- **Per-turn analytics writes** — signals are visible in Test Chat but not persisted to `partners/{pid}/relayAnalytics`.
- **Partner-facing "why did you pick this block?"** — the debug panel exists for the partner surface; customer-facing chat gets only the block + text.
- **Live widget signals UI** — the public `/r/[partnerId]` page uses the same endpoint so the orchestrator benefits apply, but the debug overlay is Test-Chat-only.

## Partner/Relay Test Chat Rebuild + Scenario Backend Scaffold

Files:
- src/lib/relay/scenarios/types.ts (new) — Scenario, ScenarioMessage, ScenarioInput types
- src/lib/relay/scenarios/firestore.ts (new) — list/get/create/update/delete helpers using firebase-admin, partners/{partnerId}/scenarios collection
- src/app/api/partner/relay/scenarios/route.ts (new) — GET (list by partnerId), POST (create)
- src/app/partner/(protected)/relay/page.tsx (Test Chat tab only) — added a Scenarios sidebar (260px, left of the phone) using admin/relay/flows visual language: T color tokens, Karla font, inline styles. All pre-existing features are retained: Setup, Embed & Diagnostics, Conversations, Flows, Storefront tabs; real chat wiring through `sendChatMessage`; cart/checkout integration; seed-on-open; TestChatPanel (phone frame + header + messages + input) continues to own the phone simulator, so block rendering, typing indicator, and empty-state are unchanged. Note: the file lives under the (protected) route group because that is the file-system path Next.js uses to resolve /partner/relay in this project; the spec's literal path src/app/partner/relay/page.tsx would have produced a routing conflict.

Explicitly deferred to next prompt:
- Wiring the scenarios sidebar to /api/partner/relay/scenarios (selecting a scenario is currently a visual-only highlight)
- Scenario editing/creation UI
- PUT/DELETE single-scenario route
- Driving chat seed messages from a selected scenario

Stub data in use: STUB_SCENARIOS constant inside partner/(protected)/relay/page.tsx (3 example entries, empty messages arrays).
