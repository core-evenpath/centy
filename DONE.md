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
