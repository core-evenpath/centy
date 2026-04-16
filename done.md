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
