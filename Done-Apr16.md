# Option A — Quick Wins (2026-04-16)

Three small fixes that close out the Phase 3 gaps tracked in `done.md`.
Shipped on branch `claude/relay-session-actions-Ak9zl`, commit `ac27865`,
open as draft PR
[core-evenpath/centy#124](https://github.com/core-evenpath/centy/pull/124).

Split into many small modular files so no single write carried more
than one concern — matches the constraint that a single massive write
would break the runtime.

## Task 1 — Order confirmation surfaces in the chat

After checkout, `RelayWidget` now closes the overlay, flips the view
to chat, and injects a system-style `ecom_order_confirmation` block
carrying the real `RelayOrder`. `OrderConfirmationLive` (from Phase 3)
already knows how to project `data.order` into the visual card.

| File | Action | Purpose |
|---|---|---|
| `src/components/relay/RegisteredBlock.tsx` | NEW | Tiny renderer that calls `registerAllBlocks()` once, then renders the component returned by `getBlock(blockId)`. Returns null for unknown ids. |
| `src/components/relay/chat-message-types.ts` | NEW | Shared `RelayChatMessage` shape with optional `blockId` / `blockData`. Import-clean (no `'use client'` / no circular imports). |
| `src/components/relay/ChatInterface.tsx` | MODIFY | Retypes local `ChatMessage` as `RelayChatMessage`; accepts a new `injectMessage` prop (dedup'd by id via a ref-held `Set`); renders `<RegisteredBlock>` above the text bubble when `blockId` is present. |
| `src/components/relay/RelayWidget.tsx` | MODIFY | New `handleOrderCreated(order)` builds the injected message, switches view to `'chat'`, closes overlay. Replaces the previous silent close. |

### Behavior
- Dedup ref ensures the same order can't surface twice even if the
  parent re-renders with the same `injectMessage`.
- Injection still works if the user was on the Browse tab — the view
  flip happens in the same callback.
- The visual order confirmation is already fully wired via
  `OrderConfirmationLive` registered against `ecom_order_confirmation`
  in `src/lib/relay/blocks/index.ts`; this PR just pipes the data
  through.

## Task 2 — Firestore composite indexes

Four new entries appended to `firestore.indexes.json`. Existing
entries (Telegram, items, partners, etc.) are untouched.

| Index | Collection scope | Fields | Consumer |
|---|---|---|---|
| Orders by id | `orders` collection-group | `id asc` | `lookupOrderAction` (cross-partner widget tracker) |
| Orders by conversation | `orders` (collection) | `conversationId asc + createdAt desc` | `getOrdersForConversationAction` |
| Orders by status | `orders` (collection) | `status asc + createdAt desc` | `getPartnerOrdersAction` status filter (used by the new `/partner/orders` page) |
| Business modules by slug | `businessModules` collection-group | `moduleSlug asc` | `loadModuleItemCounts` in `/admin/relay/modules` |

Deploy after merge:

```bash
firebase deploy --only firestore:indexes
```

`firebase.json` already points at `firestore.indexes.json` — no change
needed there.

## Task 3 — Partner `/orders` dashboard

Split across 6 small files under `src/app/partner/(protected)/orders/`
so each concern stays independently reviewable:

| File | Lines | Purpose |
|---|---|---|
| `page.tsx` | ~15 | Server wrapper; renders `<OrdersDashboard>` inside the standard partner container. |
| `OrdersDashboard.tsx` | ~220 | Client orchestrator: resolves `partnerId` via `useMultiWorkspaceAuth`, loads via `getPartnerOrdersAction`, owns filter + selection state, wires status mutations through `updateOrderStatusAction`, surfaces `sonner` toasts. |
| `orders-constants.ts` | ~60 | Status-tab definitions, tailwind badge color map, linear status flow + `nextStatusAfter()` helper. |
| `StatsCard.tsx` | ~45 | Single summary tile with color-coded icon badge (gray/yellow/purple/blue/green). |
| `OrderRow.tsx` | ~50 | List-pane row: id, status badge, item count, total, relative createdAt via `date-fns`. |
| `OrderDetailPanel.tsx` | ~140 | Detail pane: items, totals (subtotal / discount / shipping / tax / total), shipping address, payment, tracking info, "Mark as <next status>" action + conditional Cancel button. |

### Behavior notes
- **Selection survives list reloads.** A `useEffect` watches `orders`
  and `selectedOrder`: if the selected order is still in the filtered
  set the reference is refreshed in place; otherwise selection is
  cleared. No accidental ghost-order state after status mutations.
- **Status updates short-circuit.** On success, the single changed
  row is patched locally rather than re-fetching the whole list —
  keeps scroll + selection stable during rapid-fire status moves.
- **Currency formatting is INR-aware** (₹ symbol); any other
  `currency` code prints as raw code. Matches the formatting used in
  `OrderConfirmationLive`.
- **Navigation:** `UnifiedPartnerSidebar.tsx` gained a
  `ShoppingBag`-iconed "Orders" link at `/partner/orders`. Chose
  `ShoppingBag` over `Package` because the latter is already used by
  the Modules menu item.

## Verification

- `npm run typecheck`: **400 errors** — identical to the pre-change
  baseline. Zero new errors introduced across all three tasks.
- File sizes stay modest: largest new file is `OrdersDashboard.tsx`
  at ~220 lines (unavoidable because it orchestrates several hooks and
  the two-pane layout). Every other new file is comfortably under
  140 lines; most are 40–60.
- Vercel preview build at the time of push: completed successfully
  (`Vercel Preview Comments` check run green on PR #124).

## Files touched — full manifest

```
NEW  src/components/relay/RegisteredBlock.tsx
NEW  src/components/relay/chat-message-types.ts
NEW  src/app/partner/(protected)/orders/OrderDetailPanel.tsx
NEW  src/app/partner/(protected)/orders/OrderRow.tsx
NEW  src/app/partner/(protected)/orders/OrdersDashboard.tsx
NEW  src/app/partner/(protected)/orders/StatsCard.tsx
NEW  src/app/partner/(protected)/orders/orders-constants.ts
NEW  src/app/partner/(protected)/orders/page.tsx
MOD  src/components/relay/ChatInterface.tsx
MOD  src/components/relay/RelayWidget.tsx
MOD  src/components/navigation/UnifiedPartnerSidebar.tsx
MOD  firestore.indexes.json
MOD  done.md
```

13 files changed, **+825 / −19** lines.

## Follow-ups still open

- Tracking info editor on the order detail panel. The server action
  (`addTrackingInfoAction`) already exists; the detail pane just needs
  a small edit form. Deliberately out of scope here so the "read-only
  partner view" works first.
- Customer-facing "where is my order" intent parse so
  `OrderTrackerLive` triggers from a raw chat message. Currently the
  block only renders when `data.orderId` is explicitly supplied.
- Partner-side test chat (`TestChatBlockPreview`) still doesn't
  thread callbacks through admin preview blocks — unchanged from
  Phase 2.

## Next sensible prompts

1. **Tracking editor + timeline note** — a single focused PR to make
   `addTrackingInfoAction` actually callable from the detail panel
   (~3 small files: form component + dialog + wiring in
   `OrderDetailPanel`).
2. **Chat intent parse for tracking** — hook the `order_status`
   intent in `intent-engine.ts` so "where is my order #ORD-ABCDEF"
   resolves to `ecom_order_tracker` with `orderId` set. One small
   change in two files.
3. **Docs split** — move `done.md` into `docs/done/YYYY-MM-DD-*.md`
   (keep `Done-Apr16.md` style going forward) with a thin index.
   Purely docs, zero risk, unblocks future agents.
