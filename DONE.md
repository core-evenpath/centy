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
