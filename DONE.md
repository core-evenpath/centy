## Navigation, Brand & SEO — Done

### Navigation
- 3 anchor links: Relay (#relay), How it works (#demo), Industries (#industries)
- Section IDs added/verified on all target sections
- Smooth scroll via `scroll-smooth` class on <html>
- `scroll-margin-top: 80px` to offset fixed nav
- Mobile hamburger nav (sm:hidden) with auto-close on scroll
- Footer links updated to match nav

### Brand Assets
- `public/images/brand/logo.svg` — full wordmark (P mark + "Pingbox")
- `public/images/brand/favicon.svg` — P mark only
- `public/images/brand/og-image.svg` (and .png)
- `public/favicon.svg` — copied from brand directory

### SEO (layout.tsx)
- Title: "Pingbox — AI That Responds to Your Customers in 30 Seconds"
- Description: channel-agnostic, mentions all 4 channels
- Keywords: 14 terms covering AI messaging, verticals, use cases
- OG image: points to new brand asset
- Favicon: SVG favicon linked
- siteName: "Pingbox" (not PingBox)

### UX / Accessibility
- <main> wrapper around page content
- aria-label on nav
- Single <h1> verified (hero only)
- prefers-reduced-motion media query kills all animations
- Mobile nav accessible: aria-expanded, aria-label on toggle

### Files modified
- `src/app/page.tsx` — nav links, section IDs, mobile nav, scroll-margin, reduced motion, semantic HTML
- `src/app/layout.tsx` — metadata, favicon, scroll-smooth

### Files created
- `public/images/brand/logo.svg`
- `public/images/brand/favicon.svg`
- `public/images/brand/og-image.svg`
- `public/images/brand/og-image.png`
- `public/favicon.svg`

### Honesty check
- [x] No design/layout changes
- [x] No typography changes
- [x] No new npm dependencies
- [x] Exactly 1 <h1> on page
- [x] All nav links have matching section IDs
- [x] PingBox → Pingbox everywhere
- [x] Mobile nav works and auto-closes

---

## Pipeline Orchestrator: Software & IT Services

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/actions/vertical-pipeline-actions.ts` | 304 | Server action orchestrating the full module-to-flow pipeline |
| `src/scripts/seed-software-it.ts` | 36 | CLI seed script for the `software_it` vertical |

### Files Modified

None.

### What the Pipeline Does (Step by Step)

1. **Module Discovery** — Calls `discoverModulesForBusinessType()` with industry/function IDs to get AI-discovered modules for the business type
2. **For each discovered module** (sequential, with 2s delay for rate limiting):
   - Checks if a module with slug `${functionId}_${slug}` already exists — skips if so
   - Calls `generateModuleSchemaAction()` to AI-generate the field schema
   - Calls `createSystemModuleAction()` which:
     - Persists the system module to Firestore
     - Auto-triggers `generateRelayBlockForModule()` to create the relay block
3. **Flow Template Creation** — Creates a hardcoded `SystemFlowTemplateRecord` for `software_it` with 6 stages (Welcome, Discovery, Qualification, Presentation, Conversion, Team Connect), 20 transitions, and default flow settings
4. **Returns a `PipelineResult`** summarizing modules discovered/created/skipped/failed, relay blocks created, and the flow template ID

### How to Run

```bash
npx tsx src/scripts/seed-software-it.ts
```

### Assumptions

- The `discoverModulesForBusinessType` AI call returns modules with `selected` defaulting to true (modules without `selected: false` are included)
- Default currency is `USD` when `countryCode` is `US`, otherwise `INR`
- Module color defaults to `#6366f1` (indigo) for all discovered modules
- The flow template stages map to existing `FlowStageType` values: `greeting`, `discovery`, `showcase` (qualification), `comparison` (presentation), `conversion`, `handoff`
- `IntentSignal` values from the type system are used for `intentTriggers` (not free-form strings)

---

## Prompt 2A: BlockGallery — Scaffold Two-Column Layout

### File changed
- `src/app/admin/relay/blocks/BlockGallery.tsx`

### Before / After
- **Before:** 852 lines
- **After:** 567 lines

### What changed (layout)
- Replaced vertical collapsible `ConfigCard` list with a two-column grid layout (`lg:grid-cols-3`)
- **Left column** (`lg:col-span-1`): scrollable `BlockListItem` list with selection state (`selectedId`)
- **Right column** (`lg:col-span-2`): placeholder preview area (dashed border box with block label, "Phone preview coming soon", block type badge) + "Edit panel coming soon" text
- Added `BlockListItem` internal component (compact row: label, module slug, block type badge, status dot, first applicable function)
- Deleted `ConfigCard` component entirely (~320 lines)
- Removed unused imports: `CatalogCards`, `CompareTable`, `ServiceList`, `BookingFlow`, `LocationCard`, `ContactCard`, `GalleryGrid`, `InfoTable`, `TextWithSuggestions`, `GreetingCard`, `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `ChevronDown`, `ChevronRight`, `Separator`

### What stayed (all state/handlers/constants/actions)
- All constants: `BLOCK_TYPES`, `BLOCK_TYPE_COLORS`, `CATALOG_ITEMS`, `SERVICE_ITEMS`, `CONTACT_METHODS`, `generateMockBlock`, `sampleDataToRelayBlock`, `getBlockTypeColor`
- All state variables: `configs`, `activeFilter`, `industryFilter`, `functionFilter`, `generatingAll`, `clearingAll`, `showClearConfirm`
- All handlers: `handleConfigUpdate`, `handleConfigDelete`, `handleGenerateAll`, `handleClearAll`, `handleConfigRegenerated`
- All memos: `uniqueBlockTypes`, `availableFunctions`, `filteredConfigs`, `blockTypeDistribution`
- Filter pills row, Generate All / Clear All buttons row, empty state card
- Export signature: `export function BlockGallery`
- Kept imports needed for Prompt 2C: `Card`, `CardContent`, `Badge`, `Button`, `Input`, `Textarea`, `Label`, `Select*`, `BlockRenderer`, `DEFAULT_THEME`, type imports

---

## Prompt 2B: BlockGallery — Phone Frame Preview

### File changed
- `src/app/admin/relay/blocks/BlockGallery.tsx`

### Before / After
- **Before:** 567 lines
- **After:** 745 lines

### What changed (phone frame preview)
- Added `buildBlockFromConfig()` — uses real `sampleData` from Firestore config, falls back to `generateMockBlock()`
- Added `getUserMessage()` — contextual user chat bubble text per block type
- Added `getSuggestions()` — suggestion chips per block type
- Added `PREVIEW_THEME` constant — warm stone color palette for phone chrome
- Added `PhonePreview` component — full phone frame (375x667) with notch, header, user bubble, bot response via `BlockRenderer`, suggestion chips, and input bar
- Replaced placeholder div ("Phone preview coming soon") with `<PhonePreview config={selectedConfig} />`

### What stayed
- Two-column grid layout from Prompt 2A
- All constants, state, handlers, memos unchanged
- `BlockListItem` component unchanged
- "Edit panel coming soon" placeholder remains (for Prompt 2C)

---

## Prompt 2C: BlockGallery — Edit Panel

### File changed
- `src/app/admin/relay/blocks/BlockGallery.tsx`

### Before / After
- **Before:** 745 lines
- **After:** 909 lines

### What changed (edit panel)
- Added `EditPanel` component — collapsible card with block type select, label, description, source collection, max items, sort by fields, save/delete/regenerate actions
- Replaced placeholder ("Edit panel coming soon") with `<EditPanel>` wired to existing handlers
- On delete, auto-selects next available block via `setSelectedId`
- Re-added imports: `useEffect`, `ChevronDown`, `Separator`
- Removed unused imports: `RefreshCw`, `CardHeader`, `CardTitle`

### What stayed
- Two-column grid layout (Prompt 2A)
- Phone frame preview with sampleData (Prompt 2B)
- All constants, state, handlers, memos unchanged
- `BlockListItem` and `PhonePreview` components unchanged

### Full feature summary (Prompts 2A–2C)
1. **Two-column layout** — scrollable block list (left), preview + edit (right)
2. **Phone frame preview** — 375x667 phone with notch, chat bubbles, BlockRenderer with real sampleData, suggestion chips
3. **Collapsible edit panel** — inline config editing with save/delete/regenerate actions
All done in 3 incremental prompts modifying 1 file (852 → 909 lines).

---

## Prompt 3A: Create relay-knowledge-actions.ts

### File created
- `src/actions/relay-knowledge-actions.ts` (71 lines)

### Exported functions
1. `getRelayKnowledgeConfigAction(partnerId)` — reads `excludedVaultDocIds` from `partners/{partnerId}/relayConfig/config`, returns empty array if missing
2. `updateRelayDocExclusionsAction(partnerId, excludedDocIds)` — writes exclusions with `merge: true` to preserve other relay config fields, revalidates `/partner/relay`
3. `getVaultFilesForRelayAction(partnerId)` — reads active vault files ordered by createdAt desc, maps field names (`originalName || displayName || name || doc.id`), handles Firestore Timestamp vs string for createdAt

---

## Phase 0 — AI Block Generation Removal — DONE

### Date: 2026-04-04

### Files Modified
- `src/actions/relay-actions.ts` — Removed 518 lines (AI block generation functions, Gemini client, prompts)
- `src/actions/modules-actions.ts` — Removed relay block generation calls from create/update (46 lines changed)
- `src/actions/relay-block-actions.ts` — Removed syncBlocksFromTemplatesAction + ICON_MAP/CAT_MAP (132 lines)
- `src/actions/vertical-pipeline-actions.ts` — Removed relayBlocksCreated tracking (6 lines)
- `src/app/admin/relay/blocks/BlockGallery.tsx` — Removed Generate All, Clear All, Regenerate buttons/handlers (118 lines)
- `src/components/partner/relay/RelayStorefrontManager.tsx` — Removed Sync blocks button/handler (31 lines)
- `src/components/admin/modules/UnifiedModuleCreator.tsx` — Removed relay block status UI (41 lines)

### Files NOT Modified (confirmed unchanged)
- `src/actions/relay-partner-actions.ts` — no changes needed
- `src/actions/relay-storefront-actions.ts` — no changes needed
- `src/actions/relay-knowledge-actions.ts` — no changes needed
- `src/actions/flow-engine-actions.ts` — no changes needed
- `src/actions/module-ai-actions.ts` — calls createSystemModuleAction but doesn't use relayBlock from result
- `src/components/admin/modules/ModuleEditor.tsx` — calls createSystemModuleAction but only uses moduleId
- `src/lib/relay-block-taxonomy.ts` — still imported by flow-engine.ts, not removed

### What Was Removed
- `generateRelayBlockForModule()` — AI-generated block configs from module schemas
- `callGeminiForBlockTemplate()` — Gemini call for block template generation
- `regenerateBlockTemplateAction()` — Re-generate a block template via AI
- `clearAllRelayBlockConfigsAction()` — Bulk delete all relayBlockConfigs
- `generateMissingRelayBlocksAction()` — Generate blocks for modules missing configs
- `syncBlocksFromTemplatesAction()` — Sync partner blocks from system templates
- `BLOCK_TYPE_PROMPT` — 140-line prompt constant
- `VALID_BLOCK_TYPES` — Block type validation array
- `ICON_MAP` / `CAT_MAP` — Block type to icon/category mapping
- `GenerateRelayBlockModuleInput` — Interface for AI block generation input
- `retryWithBackoff()` — Gemini retry helper
- `wait()` — Sleep utility
- GoogleGenAI import and client setup (`genAI`, `BLOCK_GEN_MODEL`)
- relay-block-taxonomy import (from relay-actions only)
- UI: "Generate All Missing" button, "Clear All Configs" button, "Regenerate" button, "Sync Blocks" button
- Relay block status tracking in UnifiedModuleCreator and vertical-pipeline-actions

### What Was Kept (verified present)
- RelayConfig, DiagnosticCheck, RelayConversation, RelayBlockConfigDetail types
- getRelayConfigAction, saveRelayConfigAction
- runRelayDiagnosticsAction
- getRelayConversationsAction
- getRelayBlockConfigsWithModulesAction, updateRelayBlockConfigAction, deleteRelayBlockConfigAction
- All partner block operations (get, toggle, reorder, update, remove)
- All module CRUD (create, read, update, delete, publish schema)
- All flow template CRUD
- relay-partner-actions.ts (slug validation, lookup)
- relay-storefront-actions.ts (storefront data)
- relay-knowledge-actions.ts (vault file exclusions)

### Downstream Fixes
- BlockGallery.tsx: Removed Generate All, Clear All, Regenerate buttons and their handlers/state
- RelayStorefrontManager.tsx: Removed Sync blocks button and handler
- UnifiedModuleCreator.tsx: Removed relay block status from GenerationProgress interface and UI
- vertical-pipeline-actions.ts: Removed relayBlocksCreated from PipelineResult summary

### Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] No dangling references — PASSED (only flow-engine.ts importing relay-block-taxonomy, which is expected)
- [x] All keeper functions verified present — PASSED

### Honesty Check
- Pre-existing TypeScript error in `src/components/partner/settings/BusinessProfileTab.tsx` — not introduced by this change
- `src/lib/relay-block-taxonomy.ts` file itself was NOT deleted because `src/lib/flow-engine.ts` still imports from it
- Module delete functions in modules-actions.ts still reference `relayBlockConfigs` Firestore collection for cleanup — this is correct CRUD behavior, not AI generation
- Total: 882 deletions, 10 insertions across 7 files

---

# Phase 1 — Block Registry + E-Commerce Blocks — DONE

## Date: 2026-04-04

## Files Created
- `src/lib/relay/types.ts` — BlockDefinition, DataContract, BlockTheme, BlockComponentProps types
- `src/lib/relay/registry.ts` ��� registerBlock, getBlock, listBlocks, matchBlocksToIntent, computeDataContract
- `src/lib/relay/blocks/index.ts` — Registration of all 11 blocks
- `src/lib/relay/blocks/ecommerce/greeting.tsx` — Welcome + quick actions
- `src/lib/relay/blocks/ecommerce/product-card.tsx` — Product catalog card
- `src/lib/relay/blocks/ecommerce/product-detail.tsx` — Expanded product view
- `src/lib/relay/blocks/ecommerce/compare.tsx` — Side-by-side comparison
- `src/lib/relay/blocks/ecommerce/cart.tsx` — Shopping cart
- `src/lib/relay/blocks/ecommerce/order-confirmation.tsx` — Order success
- `src/lib/relay/blocks/ecommerce/order-tracker.tsx` — Shipment tracking
- `src/lib/relay/blocks/ecommerce/promo.tsx` ��� Promotional offers (4 variants)
- `src/lib/relay/blocks/shared/nudge.tsx` — Smart contextual prompt
- `src/lib/relay/blocks/shared/suggestions.tsx` — Quick reply chips
- `src/lib/relay/blocks/shared/contact.tsx` — Multi-channel contact

## Block Registry Summary
| Block ID | Family | Preloadable | Variants |
|----------|--------|-------------|----------|
| ecom_greeting | navigation | yes | 3 |
| ecom_product_card | catalog | yes | 6 |
| ecom_product_detail | detail | no | 3 |
| ecom_compare | compare | no | 1 |
| ecom_cart | cart | no | 3 |
| ecom_order_confirmation | confirmation | no | 1 |
| ecom_order_tracker | tracking | no | 1 |
| ecom_promo | promo | yes | 4 |
| shared_nudge | shared | yes | 4 |
| shared_suggestions | shared | yes | 2 |
| shared_contact | support | yes | 1 |

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] All 14 files exist — PASSED
- [x] All 11 blocks registered — PASSED
- [x] No references to removed Phase 0 code — PASSED

## Honesty Check
- Added `import type React from 'react'` to types.ts (not in original spec) because `React.ComponentType` in `BlockRegistryEntry` needs it in `.ts` files
- All blocks follow the exact structure: `export const definition` + `export default function`
- No existing files were modified

---

# Phase 2 — Session Cache + Pre-warming — DONE

## Date: 2026-04-04

## Files Modified
- `src/lib/relay/types.ts` — Appended 7 session interfaces (~60 lines): SessionModuleItem, SessionBrand, SessionContact, SessionFlowStage, SessionFlowDefinition, SessionBlockOverride, RelaySessionData

## Files Created
- `src/actions/relay-session-actions.ts` — Server action: `loadRelaySessionAction()` fires 6 parallel Firestore queries via Promise.all, returns `RelaySessionData`
- `src/lib/relay/session-cache.ts` — `RelaySessionCache` class: in-memory cache with moduleIndex, filterItems, searchItems, getVisibleBlockIds, isStale
- `src/lib/relay/preloader.ts` — Orchestrator: `buildRelaySession()` creates cache, `resolvePreloadData()` pre-resolves preloadable blocks with data from cache

## Architecture

### Server Action (relay-session-actions.ts)
Single `loadRelaySessionAction(partnerId)` does 6 parallel Firestore reads:
1. Partner doc → brand name, logo, contact info
2. Relay config → brandName, tagline, accentColor, emoji
3. Partner blocks → block overrides (visibility, sort order)
4. CoreHub items → all denormalized module items
5. System modules → module metadata
6. Flow templates → active flow matching partner's industry

Returns a flat `RelaySessionData` payload ready for client-side caching.

### Session Cache (session-cache.ts)
`RelaySessionCache` class:
- Builds `moduleIndex` (Map<string, items[]>) on construction for O(1) module lookups
- `filterItems(moduleSlug?, tags?)` — filtered by module and/or tags
- `searchItems(query)` — case-insensitive text search across name, description, tags
- `getVisibleBlockIds()` — sorted visible block IDs from partner overrides
- `isStale(maxAgeMs?)` — checks cache age (default 5 min)

### Preloader (preloader.ts)
- `buildRelaySession(data)` — wraps data in RelaySessionCache
- `resolvePreloadData(cache)` — for each preloadable block in the session category:
  - Resolves field data from cache items
  - Injects contact info for support blocks
  - Falls back to sampleData for missing required fields
  - Returns `PreloadedBlock[]` ready for rendering

## Firestore Paths Used
- `partners/{partnerId}` — partner document
- `partners/{partnerId}/relayConfig/config` — relay config
- `partners/{partnerId}/relayConfig/blocks` — partner block overrides
- `partners/{partnerId}/coreHub/data/items` — CoreHub items
- `systemModules` — system module collection
- `systemFlowTemplates` — flow templates (where status='active')

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] All 3 new files exist — PASSED
- [x] types.ts has 7 session interfaces — PASSED
- [x] No circular imports — PASSED

## Honesty Check
- Partner blocks collection path uses flat `partners/{id}/relayConfig/blocks` (matching relay-block-actions.ts), not a nested subcollection
- `blocks` field in RelaySessionData is currently empty array — block definitions come from the client-side registry, not Firestore
- Category determination uses `industry?.id` with fallback to `industry?.name` lowercased, then `'general'`
- Flow template matching checks both `industryId` and `functionId` against the category
- Pre-existing TypeScript error in BusinessProfileTab.tsx unchanged

---

# Phase 3 — Block Resolver + Intent Engine — DONE

## Date: 2026-04-04

## Files Modified
- `src/lib/relay/session-cache.ts` — Extended with 6 new methods (`getItem`, `getItemCount`, `getCategories`, `hasRag`, scored `searchItems`, object-param `filterItems`), `SearchResult` and `FilterOptions` exports, `itemIndex` for O(1) lookups
- `src/lib/relay/types.ts` — Added `welcomeMessage?: string` to `SessionBrand` interface
- `src/actions/relay-session-actions.ts` — Map `welcomeMessage` from relay config into brand

## Files Created
- `src/lib/relay/query-parser.ts` — Extracts price range, category, keywords, sort preference, product ref, quantity from natural language
- `src/lib/relay/intent-engine.ts` — Classifies messages into 15 intent types via keyword + regex pattern matching
- `src/lib/relay/block-resolver.ts` — Maps intent → block ID + populated data from session cache

## Architecture
```
User: "Show me silk sarees under 5000"
  ↓
query-parser.parseQuery()                           [<5ms]
  → { category: "sarees", priceMax: 5000, keywords: ["silk"], sortBy: null }
  ↓
intent-engine.classifyIntent()                      [<5ms]
  → { type: "browse", confidence: 0.75, filters: { ... } }
  ↓
block-resolver.resolveBlock()                       [<20ms]
  → cache.filterItems({ category: "sarees", priceMax: 5000 })
  → 3 items matched
  → { blockId: "ecom_product_card", data: { items: [...] }, confidence: 0.9 }
  ↓
TOTAL: <30ms, ZERO network calls
```

## Intent Types Supported (15)
| Intent | Block | Trigger Example |
|--------|-------|-----------------|
| greeting | ecom_greeting | "hi", "hello" |
| browse | ecom_product_card | "show me kurtas" |
| search | ecom_product_card | "blue cotton under 2000" |
| product_detail | ecom_product_detail | "tell me about the silk saree" |
| compare | ecom_compare | "compare kurta vs anarkali" |
| price_check | ecom_product_detail | "how much is the choker set" |
| cart_view | ecom_cart | "show my cart" |
| cart_add | (no block) | "add to bag" — handled by UI |
| checkout | ecom_cart | "ready to checkout" |
| order_status | ecom_order_tracker | "track my order #PBX-123" |
| return_request | (no block) | "want to return" — RAG text |
| promo_inquiry | ecom_promo | "any discounts?" |
| contact | shared_contact | "how to contact you" |
| support | shared_contact | "need help with..." |
| general | (no block) | everything else → RAG text only |

## Query Parser Capabilities
- Price: "under 2000", "₹500-1000", "above $50", "budget 3k"
- Category: matches against known categories from session cache
- Keywords: extracts after removing stop words, prices, categories
- Sort: "cheapest", "top rated", "newest", "trending"
- Product reference: searches cache for matching item by name
- Quantity: "2 pcs", "3 items"

## API Mismatches Resolved (12)
The spec code referenced methods/fields that didn't exist in Phase 2's implementation:
- Extended `session-cache.ts` with: `getItem()`, `getItemCount()`, `getCategories()`, `hasRag()`, scored `searchItems(query, limit)`, object-param `filterItems(opts)`
- Adapted spec code: `item.metadata` → `item.raw`, `item.keywords` → `item.tags`, `item.category` → `item.moduleSlug`, `item.currency` with `|| 'INR'` default
- Added `welcomeMessage` to `SessionBrand` type + server action mapping

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] All 3 new files exist — PASSED
- [x] All functions are synchronous — PASSED
- [x] No server/client directives — PASSED
- [x] No network imports — PASSED

## Honesty Check
- Spec said "3 new files, 0 modified files" but code referenced 12 non-existent APIs — had to extend session-cache.ts, types.ts, and server action
- `hasRag()` returns `items.length > 0` — no separate RAG flag in session data
- `getCategories()` returns unique `moduleSlug` values + `raw.category` values — items have no dedicated `category` field
- `INTENT_TO_BLOCK` map is defined but not used (resolveBlock uses switch instead) — kept for documentation/future use
- Compare intent requires 2+ matched items from cache, otherwise falls through to next pattern
- Pre-existing TypeScript error in BusinessProfileTab.tsx unchanged

---

# Phase 4 — RAG Enhancement (Block-Aware Relay AI) — DONE

## Date: 2026-04-04

## Files Created
- `src/lib/relay/rag-context-builder.ts` — Builds minimal AI prompt from session data + block context
- `src/actions/relay-rag-actions.ts` — Server action calling Gemini with two paths (fast + document)

## Two Response Paths

### Fast Path: `generateRelayResponseAction`
- Used when: A block is displayed (browse, detail, compare, cart, etc.)
- Context: ~1500 tokens (brand + business context + block summary + history)
- Output: ~200 tokens (1-3 sentence commentary + follow-ups)
- Model: gemini-2.5-flash (configurable via RELAY_AI_MODEL env var)
- Target latency: 800-1200ms

### Document Path: `generateRelayResponseWithDocsAction`
- Used when: No block is shown (general/policy questions)
- Context: Customer message + conversation history + vault documents via file search
- Output: ~300 tokens (document-grounded answer + follow-ups)
- Falls back to fast path if no RAG store is available

## Context Budget Comparison
```
Existing Inbox RAG:                    Relay RAG (fast path):
  System prompt:    ~500 tokens          System prompt:    ~200 tokens
  Business persona: ~400 tokens          Brand summary:    ~50 tokens
  ALL module items: ~2000 tokens         Block summary:    ~50 tokens (what's SHOWN)
  History:          ~800 tokens          Business context: ~200 tokens (truncated)
  RAG docs:         ~1000 tokens          History:          ~300 tokens (last 6)
  Total:            ~4700 tokens          Total:            ~800 tokens
  Output:           ~500 tokens          Output:           ~200 tokens
  Latency:          2-3.5 seconds         Latency:          0.8-1.2 seconds
```

## Block-Aware Prompt Design
The AI receives a one-line summary of what the customer sees:
- "The customer sees 4 products: Block Print Kurta, Mirror Work Anarkali... (₹2,800 - ₹5,200)"
- "The customer sees the detail view of 'Block Print Kurta Set' at ₹2,800, rated 4.2/5"
- "The shopping cart shows 2 items totaling ₹7,000. Checkout button is visible."

## API Fixes Applied
- `tools` moved inside `config` (not top-level) per new `@google/genai` SDK pattern
- `contents` uses plain string (not `[{role, parts}]` object) per new SDK
- `systemInstruction` as string in `config` per codebase convention
- `response.text` as property access (not method call)
- `fileSearch` config uses `any` type matching `rag-query-engine.ts` pattern
- `responseMimeType: 'application/json'` for structured JSON output

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] Both files exist — PASSED
- [x] Context builder has no network imports — PASSED
- [x] Server action has 'use server' — PASSED
- [x] Imports from existing codebase resolve — PASSED

## Honesty Check
- Adapted Gemini API calls from spec to match codebase's new SDK patterns (tools inside config, string contents, property text access)
- `getCoreHubContextString` import resolves correctly from `./core-hub-actions`
- fileSearch tools API uses `any` cast for `fileSearchConfig` matching existing pattern in `rag-query-engine.ts`
- Business context truncated to 800 chars to keep total prompt under ~1500 tokens
- Pre-existing TypeScript error in BusinessProfileTab.tsx unchanged

---

# Phase 5 — Block Builder + Admin UI — DONE

## Date: 2026-04-04

## Files Created
- `src/actions/block-builder-actions.ts` — Server actions: list registry, block details, generate from prompt, export registry, derive schema
- `src/app/admin/relay/blocks/page.tsx` — Admin Block Library page (replaced old BlockGallery page, backup at page.tsx.bak)

## Server Action Inventory
| Action | Purpose |
|--------|---------|
| `getRegisteredBlocksAction(filters?)` | List all blocks from code registry with family/category filters |
| `getBlockDetailAction(blockId)` | Full definition + computed data contract for one block |
| `getBlockSampleDataAction(blockId)` | Sample data for block preview |
| `getDerivedSchemaAction(blockIds[])` | Compute merged module schema from selected blocks |
| `generateBlockFromPromptAction(prompt, vertical)` | AI generates React component + BlockDefinition from natural language |
| `exportBlockRegistryAction()` | Full registry export for debugging/analysis |

## Admin Page Features
- Block grid with family icon, color, label, description
- Filter by family (navigation, catalog, detail, compare, etc.)
- Text search across block labels, IDs, descriptions
- Expandable detail: categories, variants, required/optional fields, intent triggers
- Block Builder: enter prompt + select vertical -> AI generates .tsx code -> copy to clipboard
- Inline styles throughout (no Tailwind dependency)

## Block Builder Flow
1. Admin clicks "Generate Block" -> Selects vertical (ecommerce, hospitality, etc.)
2. Describes the block in natural language
3. Gemini generates full .tsx file with BlockDefinition export + default component
4. Admin reviews generated code in the UI, copies with one click
5. Admin creates file in src/lib/relay/blocks/ and registers in blocks/index.ts
6. Generated blocks are NOT auto-saved — human review required

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] Both files exist — PASSED
- [x] Server action has 'use server' — PASSED
- [x] Admin page has 'use client' — PASSED
- [x] Page imports server actions correctly — PASSED

## Honesty Check
- Old page.tsx backed up to page.tsx.bak before overwriting (was server component importing BlockGallery)
- BlockGallery.tsx still exists but is now unused (only imported by old page.tsx)
- Server action imports `registerAllBlocks` from blocks/index.ts which imports 'use client' components — works in Next.js (stores component references, doesn't render them)
- Registry initialization uses lazy `ensureRegistry()` pattern to avoid startup overhead
- Pre-existing TypeScript error in BusinessProfileTab.tsx unchanged

---

# Phase 6 — Module Derivation from Block Data Contracts — DONE

## Date: 2026-04-04

## Files Created
- `src/actions/module-derivation-actions.ts` — 5 server actions for deriving module schemas from block data contracts

## Files Modified
- (none)

## Server Action Inventory
| Action | Purpose |
|--------|---------|
| `deriveModuleSchemaAction(blockIds[])` | Merge data contracts from selected blocks → DerivedField[] with provenance |
| `deriveSchemaForVerticalAction(verticalId)` | Auto-select all blocks for a vertical (+ shared) → derive schema |
| `compareWithExistingModuleAction(moduleId, blockIds[])` | Diff: current module schema vs block-derived schema (added/removed/unchanged/modified) |
| `applyDerivedSchemaAction(moduleId, fields, options)` | Apply derived fields to existing module (add_only or full_replace, keep orphaned fields) |
| `getFieldProvenanceAction(blockIds[])` | Which blocks need which fields (for admin transparency) |

## Architecture: How Modules Are Now Derived

```
BEFORE (AI-driven, fragile):
  Admin creates module → AI guesses schema → AI generates block → hope they match

AFTER (block-driven, deterministic):
  Blocks define data contracts (Phase 1)
    ↓
  computeDataContract(blockIds) merges contracts
    ↓
  deriveModuleSchemaAction converts to ModuleFieldDefinitions
    ↓
  compareWithExistingModule shows diff
    ↓
  Admin reviews → applyDerivedSchema updates module
    ↓
  Partner fills module items → Session cache loads items → Blocks render items
```

## Key Design Decisions
- DerivedField type is self-contained — does NOT import from @/lib/modules/types to avoid coupling
- applyDerivedSchemaAction defaults to 'add_only' mode — never deletes fields without explicit opt-in
- Orphaned fields (in current module but not needed by blocks) are KEPT by default — admin decides
- Field type mapping: rating→number, images→tags, everything else maps 1:1
- Smart display defaults: SEARCHABLE_TYPES, LIST_TYPES, CARD_TYPES sets determine field visibility
- trackFieldProvenance helper reused across deriveModuleSchema and getFieldProvenance actions
- deriveSchemaForVerticalAction includes 'shared' family blocks alongside vertical-specific blocks
- Required fields sorted first, then optional — alphabetically within each group

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] File exists — PASSED
- [x] All 5 actions exported — PASSED
- [x] No modification to existing module files — PASSED
- [x] No circular imports — PASSED
- [x] Pre-existing TypeScript error in BusinessProfileTab.tsx unchanged

---

# Phase 7 — Flow Composer (Block-Aware Enhancement) — DONE

## Date: 2026-04-04

## Files Created
- `src/actions/flow-composer-actions.ts` — 8 server actions for block-aware flow composition

## Files Modified
- (none — existing flow-engine-actions.ts untouched)

## Server Action Inventory
| Action | Purpose |
|--------|---------|
| `getFlowBlockConfigAction(templateId)` | Read block enhancement fields from existing flow template |
| `saveFlowBlockConfigAction(templateId, config)` | Save homeScreen + stageBlocks + preloadBlocks + cacheStrategy |
| `updateHomeScreenAction(templateId, homeScreen)` | Update homescreen sections (validates block IDs against registry) |
| `updateStageBlocksAction(templateId, stageId, config)` | Set eligible blocks + intent mappings for a stage |
| `getAvailableBlocksForFlowAction(verticalId?)` | List all blocks available for a vertical (includes shared blocks) |
| `generateDefaultHomeScreenAction(verticalId)` | Auto-generate a default homescreen for e-commerce |
| `publishFlowAction(templateId)` | Collect all block IDs → derive module schema → set status active |
| `unpublishFlowAction(templateId)` | Set status back to draft |

## Enhancement Architecture
```
EXISTING (untouched):                     NEW (additive):
systemFlowTemplates                       systemFlowTemplates (same collection)
  ├── id, name, status                      ├── (all existing fields preserved)
  ├── stages[]                               ├── homeScreen: { layout, sections[] }
  ├── industryId, functionId                 ├── stageBlocks: [{ stageId, eligibleBlocks[], intentMappings[] }]
  ├── createdAt, updatedAt                   ├── preloadBlocks: string[]
  └── ...                                    ├── cacheStrategy: 'aggressive' | 'moderate' | 'none'
                                             ├── publishedAt
                                             ├── publishedBlockIds: string[]
                                             └── publishedFieldCount: number
```

## Key Design Decisions
- Additive only — new fields on existing Firestore docs, old templates without these fields work fine
- Block ID validation — updateHomeScreen and updateStageBlocks verify blocks exist in registry before saving
- Publish triggers derivation but does NOT auto-apply schema — admin reviews via Phase 6 compare/apply
- Existing flow-engine-actions.ts is NOT modified — flow composer is a parallel enhancement layer

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] File exists — PASSED
- [x] All 8 actions exported — PASSED
- [x] Existing flow-engine-actions not modified — PASSED
- [x] No circular imports — PASSED

---

# Phase 8 — Partner Layer (Block Overrides + Customization) — DONE

## Date: 2026-04-04

## Files Created
- `src/actions/relay-customization-actions.ts` — 9 server actions for partner block customization

## Files Modified
- (none — existing relay-partner-actions.ts and relay-storefront-actions.ts untouched)

## Server Action Inventory
| Action | Purpose |
|--------|---------|
| `getPartnerCustomizationAction(partnerId)` | Read block overrides + homescreen overrides |
| `savePartnerCustomizationAction(partnerId, config)` | Save full customization doc |
| `toggleBlockAction(partnerId, blockId, enabled)` | Enable/disable a specific block |
| `setBlockFieldPriorityAction(partnerId, blockId, fields)` | Reorder which fields display first |
| `setBlockLabelOverridesAction(partnerId, blockId, labels)` | Change CTA text, section titles |
| `updateHomeScreenOverridesAction(partnerId, overrides)` | Reorder/hide homescreen sections |
| `assignFlowToPartnerAction(partnerId, flowTemplateId)` | Link partner to a flow template |
| `applyPartnerPromptAction(partnerId, prompt)` | Natural language → structured block overrides via Gemini |
| `resetPartnerCustomizationAction(partnerId)` | Clear all customizations to defaults |

## Storage Location
`partners/{partnerId}/relayConfig/blockOverrides` — single Firestore doc containing blockOverrides map, homeScreenOverrides, flowTemplateId, updatedAt.

## Key Design Decisions
- Thin config layer — no component forking, blocks read overrides at render time
- Natural language customization via Gemini — interprets prompts into structured field_priority/label_override/toggle/config changes
- All block IDs validated against registry before saving
- `adminDb` null check at top of applyPartnerPromptAction (before AI call) to avoid wasted API calls
- Uses `{ merge: true }` on all writes — additive, never overwrites unrelated fields
- Reset action deletes the entire blockOverrides doc — clean slate

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] File exists — PASSED
- [x] All 9 actions exported — PASSED
- [x] Existing partner files not modified — PASSED

---

# Phase 9 — Widget Runtime — DONE

## Date: 2026-04-04

## Files Created
- `src/components/relay/RegistryBlockRenderer.tsx` — Registry lookup + render any block by ID
- `src/components/relay/HomeScreenRenderer.tsx` — Bento grid from preloaded blocks
- `src/components/relay/ChatInterface.tsx` — Conversation view with blocks + AI text + suggestion chips
- `src/components/relay/RelayWidget.tsx` — Top-level container: session init + tab switching

## Files Modified
- (none — existing RelayFullPage.tsx and blocks/BlockRenderer.tsx untouched)

## Runtime Pipeline
```
Page Load (partnername.pingbox.io):
  → RelayWidget mounts with partnerId
  → loadRelaySessionAction(partnerId)               [~500ms, 6 parallel Firestore queries]
  → buildRelaySession(data) + resolvePreloadData()   [<20ms, build cache + pre-resolve blocks]
  → Render HomeScreen with preloaded blocks           [instant]
  → Widget is interactive

User Types / Taps:
  → classifyIntent(message, cache)                   [<5ms, synchronous]
  → resolveBlock(intent, cache)                      [<20ms, synchronous]
  → RegistryBlockRenderer renders block immediately   [<50ms total]
  → IN PARALLEL: generateRelayResponseAction(...)    [~1000ms]
  → AI text merges into the assistant message
  → Follow-up chips appear below
```

## Component Architecture
```
RelayWidget (container)
  ├── Header (brand name + avatar + Browse/Chat tabs)
  ├── HomeScreenRenderer (browse-first view)
  │     └── RegistryBlockRenderer × N (one per preloaded block)
  └── ChatInterface (conversation view)
        ├── Message bubbles
        │     ├── Customer bubble (accent, right-aligned)
        │     └── Assistant bubble (left-aligned)
        │           ├── RegistryBlockRenderer (if block resolved)
        │           ├── AI text (if RAG responded)
        │           └── Suggestion chips (tappable)
        ├── Loading indicator
        └── Input bar (text field + send button)
```

## Key Adaptations from Spec
- Named `RegistryBlockRenderer` to avoid conflict with existing `blocks/BlockRenderer.tsx`
- Used `loadRelaySessionAction` (not `initRelaySessionAction`) — matched actual export
- `buildRelaySession()` returns `RelaySessionCache`, not `{ cache, preloadedBlocks }` — called `resolvePreloadData()` separately
- Built theme manually from `DEFAULT_THEME` + `brand.accentColor` — no `getTheme()` on cache
- `findLastIndex` works fine with `lib: ["esnext"]` in tsconfig
- Used `className="animate-spin"` on Loader2 (Tailwind utility available in existing codebase for lucide icons)

## Validation
- [x] `npx tsc --noEmit` — PASSED (only pre-existing error in BusinessProfileTab.tsx)
- [x] All 4 component files exist — PASSED
- [x] All components are 'use client' — PASSED
- [x] No direct Firestore imports in components — PASSED
- [x] Import chain connects all phases — PASSED

## Flow Builder — Prompt 1 (Types + Canvas)
- Date: 2026-04-06
- Files created:
  - `src/app/admin/relay/flows/flow-builder-types.ts` (86 lines)
  - `src/app/admin/relay/flows/FlowCanvas.tsx` (219 lines)
- Files modified: none
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Notes: none — all spec requirements met

## Flow Builder — Prompt 2 (StagePanel + FlowBuilder + page.tsx)
- Date: 2026-04-06
- Files created:
  - `src/app/admin/relay/flows/StagePanel.tsx` (~190 lines, 'use client')
  - `src/app/admin/relay/flows/FlowBuilder.tsx` (~217 lines, 'use client')
- Files modified:
  - `src/app/admin/relay/flows/page.tsx` — replaced 972-line 'use client' page with lean server component (34 lines)
- Key mapping: FlowStage(label/blockTypes) ↔ FlowBuilderStage(name/blockIds)
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Verification: no className usage, correct client/server directives, zero new type errors

## Flow Builder — Prompt 3 (Dashboard Integration + Validation)
- Date: 2026-04-06
- Files modified:
  - `src/app/admin/relay/page.tsx` — added getSystemFlowTemplatesFromDB call, passes initialFlowTemplate prop
  - `src/app/admin/relay/RelayDashboard.tsx` — STAGES/TRANSITIONS derived from Firestore prop with fallback to DEFAULT_STAGES/DEFAULT_TRANSITIONS, added flow builder link in flows tab
  - `src/actions/flow-engine-actions.ts` — added block registry validation to create/update template actions
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Notes: Field mapping label→name, blockTypes→blockIds handled in page.tsx server component; FLOW_STAGE_STYLES imported for stage colors; dynamic import of ALL_BLOCKS in validation to avoid client bundle in server actions

## Flow Builder — Prompt 4 (Registry Sync + Chat API Block Status)
- Date: 2026-04-06
- Files modified:
  - `src/actions/relay-admin-actions.ts` — seedDefaultBlocksAction now uses ALL_BLOCKS from preview registry via dynamic import instead of buildAllBlockConfigs(); skips existing blocks to preserve admin toggles; added syncRegistryToFirestoreAction that adds new blocks and marks removed as deprecated
  - `src/app/api/relay/chat/route.ts` — removed stale RELAY_BLOCK_SCHEMAS import and fallback; chat API already respected Firestore block status via getActiveBlocksForPartner() filter
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Notes: getActiveBlocksForPartner already filters status!=='active' (block-config-service.ts:115), so disabled blocks were already excluded from chat. The RELAY_BLOCK_SCHEMAS fallback was stale (~11 blocks vs 53+ in registry) and replaced with empty string

## Flow Builder — Prompt 5 (Flow Engine → Chat API Wiring)
- Date: 2026-04-06
- Path taken: A — flow engine was already fully wired in the chat route
- Files modified:
  - `src/app/api/relay/chat/route.ts` — confirmed fully wired: loads/creates flow state, calls detectIntent + runFlowEngine, injects contextForAI into Gemini prompt, persists updated state, returns flowMeta in response. No changes needed.
  - `src/actions/relay-partner-actions.ts` — added autoAssignFlowTemplateAction: auto-assigns a system flow template to a partner based on industry/function matching; does not overwrite existing flows
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Flow engine status: fully wired
- Notes: Chat route already had complete flow engine integration (state loading, intent detection, flow resolution with partner→system template fallback, engine execution, prompt injection, state persistence, flowMeta response). Only addition was the autoAssignFlowTemplateAction for automatic template matching by functionId/industryId.

## Modules — Prompt 6 (Auto-Derive + Export)
- Date: 2026-04-06
- Files modified:
  - `src/actions/modules-actions.ts` — exported getPartnerModuleByIdAction; added deriveModulesFromRegistryAction (scans ALL_BLOCKS for module bindings, creates missing system modules via createSystemModuleAction with proper ModuleFieldDefinition/SystemModuleSettings types); added exportModuleItemsAction (exports partner items to CSV with fixed + dynamic columns, proper CSV escaping)
  - `src/app/partner/(protected)/modules/[slug]/page.tsx` — added Export CSV button next to Import button with download handler
  - `src/components/admin/modules/ModulesList.tsx` — added "Derive from Blocks" button with toast feedback showing created/skipped/errors
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Module slugs found in registry: `moduleItems` (only slug used across all block verticals)
- Notes: All blocks use `module: 'moduleItems'` or `module: null`. Schema fields adapted to real ModuleFieldDefinition interface (isRequired/isSearchable/showInList/showInCard, not required/searchable/showInDetail). SystemModuleSettings uses DEFAULT_MODULE_SETTINGS spread. ModuleAgentConfig.inboxContext is string type. getPartnerModuleByIdAction was internal-only — now exported for use by exportModuleItemsAction.

## Partner Relay — Prompt 7 (New Block System Wiring)
- Date: 2026-04-06
- Files modified:
  - `src/app/api/relay/chat/route.ts` — added imports for RelaySessionCache, classifyIntent, resolveBlock; builds RelaySessionData from already-loaded partnerData + moduleConfigs (brand from businessPersona.identity, contact from identity, items from moduleConfigs flatMap); constructs RelaySessionCache, runs classifyIntent→resolveBlock pipeline after Gemini response; merges blockId/blockData/blockVariant into parsed response when confidence >= 0.6; entire block is try/catch so failures fall back silently to Gemini-only mode
  - `src/app/partner/(protected)/relay/page.tsx` — added RegistryBlockRenderer + BlockTheme imports; added relayThemeToBlockTheme() mapper (RelayTheme 29 fields → BlockTheme 18 fields, maps text→t1, bdrL→bdrM, hardcodes redBg/amber/amberBg); extended ChatMessage with blockId/blockData/blockVariant; updated sendChatMessage to capture new fields; three-tier rendering: RegistryBlockRenderer (new) → BlockRenderer (old fallback) → plain text; added blockId diagnostic badge
- tsc --noEmit: PASS (only pre-existing TS5101 baseUrl deprecation warning)
- Notes: RelaySessionCache constructed via `new RelaySessionCache(data)` (not static factory). blocks/blockOverrides set to empty arrays (not needed by intent engine or block resolver). Response includes BOTH old format (type/items) and new format (blockId/blockData) for backward compatibility with embeddable widget. Theme types are incompatible (RelayTheme vs BlockTheme) — solved with mapping function at call site, no modifications to RegistryBlockRenderer.
