# /partner/relay Phase 0 — data-gap audit

Session: /partner/relay Phase 0, Phase 1 audit.
Branch: `claude/partner-relay-phase-0` (off `main` at `72b76186`).
Baseline: tsc = 276, tests = 556/556 green.
Date: 2026-04-20.

"Evidence precedes change" (Phase 3 tuning §4.1 discipline carried
forward). This doc maps the actual data flow from `buildBlockData()`
to the public widget, tests the prompt's premise, and surfaces the
halt condition the audit revealed.

---

## TL;DR

**The prompt's premise does not hold.** The chat-turn data pipeline
from orchestrator → `/api/relay/chat` → public widget is **intact
and byte-identical** to the admin Test Chat pipeline. Both surfaces
call the same endpoint, receive the same `blockData`, and pass it
to the same component (`TestChatBlockPreview`).

What the prompt likely observed as "admin shows real data, widget
shows design shells" is explained by two facts the audit uncovered:

1. **Admin seeds entry-stage blocks on mount via `/api/relay/chat/seed`; the public widget has no seed call.** Admin shows populated blocks immediately; widget waits for the first user turn before any block renders. When the user _does_ send a message, widget data flows the same way admin does.
2. **`buildBlockData()` covers only 9 block ids** (greeting, ecom_greeting, product_card, ecom_product_card, menu, fb_menu, services, contact, shared_contact). For every other block (room_card, order_tracker, cart, ecom_cart, booking, …) the function returns `undefined` and the preview component falls back to its design-only sample. This coverage gap applies equally to **both** admin and public surfaces.

Neither condition matches the prompt's Shape A ("orchestrator produces
blockData, endpoint drops it") or Shape B ("orchestrator doesn't
produce blockData on the public path"). Both are false.

---

## 1. `buildBlockData()` call sites

```bash
grep -rn "buildBlockData" src/ --include="*.ts" --include="*.tsx"
```

| Caller | Path | Signature | Notes |
|---|---|---|---|
| Orchestrator | `src/lib/relay/orchestrator/index.ts:285–291` | `buildBlockData({ blockId, partnerData, modules })` | Called inside `orchestrate()` when a `blockId` is selected. Passes result into `OrchestratorResponse.blockData`. |
| Seed endpoint | `src/app/api/relay/chat/seed/route.ts:122` | same | Populates entry-stage blocks at widget mount. **Only used by admin Test Chat** (see §4). |
| Admin preview action | `src/actions/relay-block-sources-actions.ts:161` | same | `getBlockPreviewDataAction` — used in the block-registry admin UI for per-block preview testing. Not on the user-facing path. |
| `buildBlockData` itself | `src/lib/relay/admin-block-data.ts:32` | definition | 9 blockId cases + `default: return undefined`. |

All four call sites share the same function; no divergent copies.

### `buildBlockData()` coverage

Only these 9 `blockId`s produce structured data; everything else
returns `undefined`:

- `greeting`, `ecom_greeting` → `buildGreeting(partnerData)`
- `product_card`, `ecom_product_card`, `menu`, `fb_menu`, `services` → `buildProductCard(modules)`
- `contact`, `shared_contact` → `buildContact(partnerData)`

Blocks NOT handled (return `undefined`): `room_card`, `room_detail`,
`booking`, `booking_confirm`, `cart`, `ecom_cart`, `checkout`,
`ecom_checkout`, `order_tracker`, `order_confirmation`, `promo`,
`hero`, `testimonials`, etc. For these the preview component uses
its hardcoded design sample (e.g. `MiniProductCard`'s
`PRODUCT_FALLBACK_BGS` array at
`src/app/admin/relay/blocks/BlockPreviews.tsx:71`).

---

## 2. Admin preview data path

### Admin Test Chat flow

1. **Mount:** `src/app/partner/(protected)/relay/page.tsx:313` POSTs to `/api/relay/chat/seed`.
2. Seed endpoint returns `{ seedMessages: [{ blockId, blockData, stageId }] }`, populating entry-stage blocks with `buildBlockData()` output.
3. Messages render via `TestChatMessages` (`src/components/partner/relay/test-chat/TestChatMessages.tsx`) which calls `TestChatBlockPreview` passing `blockId`, `blockData`, `theme`, `callbacks`.
4. **Chat turn:** `src/app/partner/(protected)/relay/page.tsx:366` POSTs to `/api/relay/chat`. Reads `data.response.blockData` on line 388–390 and sets it on the message.
5. `TestChatBlockPreview` routes by blockId — interactive blocks → `BlockRenderer`; others → admin-registry `Preview` component. **Both branches receive the same `blockData`.**

### The "data flows in admin" claim

Substantiated by lines 388–390 of the admin page: `blockData:
data.response.blockData && typeof data.response.blockData === 'object'
? data.response.blockData : undefined`. Same shape as the public
widget (see §3).

---

## 3. Public widget data path

### `RelayFullPage.tsx`

1. **Mount:** no seed call. `useEffect` on line 67 pre-populates the message list with a welcome-text message from `config.welcomeMessage` — **no `blockId`, no block preview, no `buildBlockData` invocation.**
2. **Chat turn:** line 88 POSTs to `/api/relay/chat`. Reads `data.response.blockData` on lines 104–107 and sets it on the message (identical logic to admin).
3. Message renders on line 183: `{msg.blockId && <TestChatBlockPreview blockId={msg.blockId} blockData={msg.blockData} />}`. No `theme` or `callbacks` passed — falls through to the admin-preview branch of `TestChatBlockPreview`, which still receives `msg.blockData`.

### The "widget shows shells" claim

If observed on the live widget, two mechanisms can produce the
impression:

1. **Pre-turn state.** The widget's first render shows only
   `config.welcomeMessage`; admin shows entry-stage blocks with data.
   User sees "admin has room cards with real room names, widget is
   empty." This is by design, not a data gap.
2. **Unhandled blockId post-turn.** If the orchestrator selects a
   blockId NOT covered by `buildBlockData` (e.g. `room_card` in a
   hospitality partner), `blockData` is `undefined`, and the preview
   component renders its fallback. This applies equally to admin and
   widget.

No pathway was found where the public widget **receives different
data than admin would** for the same conversation. The pipeline is
symmetric.

---

## 4. Where admin and public diverge

| Surface | Seed call on mount | Chat call | blockData handling |
|---|---|---|---|
| Admin Test Chat | **Yes** (`/api/relay/chat/seed`) | Yes (`/api/relay/chat`) | Identical |
| Public widget (`RelayFullPage`) | **No** | Yes (`/api/relay/chat`) | Identical |

The divergence is the **seed call**, not the chat pipeline.

---

## 5. Representative block traces

Per the prompt's request, three representative blocks traced from
response payload → React render.

### `product_card` (commerce)

- `buildProductCard(modules)` reads `modules.find((m) => m.items.length > 0)` and emits `{items: [{name, desc, price, badge, rating, reviews}]}`.
- Endpoint returns `blockData: {items: [...]}`.
- `RelayFullPage.tsx:105–107` sets `msg.blockData = {items: [...]}`.
- `TestChatBlockPreview` → admin-preview path → `MiniProductCard({data})` → uses `data.items` (not fallback).
- **Widget renders real module items with partner-supplied names/prices. Same as admin.**

### `room_card` (hospitality booking)

- Not in `buildBlockData`'s switch → returns `undefined`.
- Orchestrator returns `blockData: undefined`.
- Endpoint returns `blockData: undefined`.
- `TestChatBlockPreview` → `<Preview data={undefined} />`.
- **Preview component uses its design-only hardcoded sample. Same on admin and widget.**

This is the actual "design shell" case. Not a plumbing gap — a
`buildBlockData` coverage gap.

### `contact` (shared)

- `buildContact(partnerData)` reads `partnerData.businessPersona.identity` and emits `{items: [{label, value, icon}]}`.
- Pipeline identical to `product_card`.
- **Real phone/email/whatsapp values render. Same on admin and widget.**

---

## 6. Type-system check

Widget expectation at `RelayFullPage.tsx:20`:
`blockData?: Record<string, unknown>`.

Orchestrator response at `src/lib/relay/orchestrator/types.ts:162`:
`blockId?: string; blockData?: unknown;`.

Endpoint pass-through at `route.ts:125`: `blockData: result.blockData`.

`TestChatBlockPreview.tsx:59`: `blockData?: Record<string, unknown>`.

No type mismatch. `unknown` ⊇ `Record<string, unknown>` at the
interface boundary; widget narrows at read time
(`typeof data.response.blockData === 'object'`).

---

## 7. Halt condition

Per the session prompt: **"Halt if: the gap turns out to be
architectural (e.g., orchestrator doesn't produce `blockData` at all
for the public endpoint — that's a larger change than plumbing)."**

This audit surfaces a variant: the orchestrator DOES produce
`blockData`, the endpoint DOES pass it, and the widget DOES display
it. The "gap" that the prompt names is not present in the
plumbing layer.

Three possible interpretations of what the operator observed, each
with a different (and not necessarily Phase-0-scoped) remedy:

### Interpretation 1 — "Widget lacks seed call"

**Observation:** admin shows populated entry-stage blocks immediately;
widget is empty until user turns.

**Remedy shape:** add a seed call to `RelayFullPage.tsx` (on mount,
POST to `/api/relay/chat/seed`, render returned seed messages). ~20
LOC addition to the widget component.

**Scope assessment:** mechanical, Phase-0-shaped. Does not touch
orchestrator, session state, or block components. Straightforward
if this is the actual goal.

### Interpretation 2 — "`buildBlockData` doesn't cover enough blocks"

**Observation:** partners configure modules with rooms / orders /
bookings, but blocks for those render design fallbacks because the
block id isn't in `buildBlockData`'s switch.

**Remedy shape:** extend `buildBlockData` — add cases for `room_card`,
`booking`, `order_tracker`, `cart`, etc. Each case needs its own
mapping from partner data / module items to the preview
component's `data` shape.

**Scope assessment:** may exceed 100 LOC quickly (N blocks × per-block
data adapter). Could be Phase-0-shaped if scoped to a specific
engine's blocks; risks expanding into per-engine work.

### Interpretation 3 — "Something else entirely"

The audit produced a clean result — operator may have observed a
different break the audit didn't find (e.g., a specific seeded
partner producing empty blockData for a block that SHOULD be
covered, a Firestore permission error on the public path,
authentication-related data mismatch). None showed up in the
file-read audit.

### Recommended surface

Pause here and let the operator pick which interpretation matches
their observation. Each has a different fix shape and scope risk.

---

## 8. Files read during audit

| File | Lines relevant |
|---|---|
| `src/lib/relay/admin-block-data.ts` | 1–159 (full) |
| `src/lib/relay/orchestrator/index.ts` | 285–312 |
| `src/lib/relay/orchestrator/signals/partner.ts` | 1–58 (full) |
| `src/app/api/relay/chat/route.ts` | 1–148 (full) |
| `src/app/api/relay/chat/seed/route.ts` | 1–153 (full) |
| `src/components/relay/RelayFullPage.tsx` | 1–263 (full) |
| `src/components/partner/relay/test-chat/TestChatBlockPreview.tsx` | 1–105 (full) |
| `src/components/partner/relay/test-chat/TestChatMessages.tsx` | 1–120 |
| `src/app/partner/(protected)/relay/page.tsx` | 300–409 |
| `src/app/admin/relay/blocks/previews/_preview-props.ts` | 1–34 (full) |
| `src/app/admin/relay/blocks/BlockPreviews.tsx` | 70–130 |

No implementation edits made. Docs-only commit to follow.
