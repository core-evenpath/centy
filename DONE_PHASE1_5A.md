# Phase 1.5A Complete: Partner-Level Block Configs — Data Layer

## Files Created

### `src/actions/relay-block-actions.ts` (NEW)

**Exported Interfaces:**
- `PartnerBlockConfig` — full partner block shape with all fields
- `PartnerBlockSummary` — aggregate stats (total, visible, hidden, categories)

**Exported Functions (8):**
1. `getPartnerBlockConfigsAction(partnerId)` — read partner blocks ordered by sortOrder
2. `syncBlocksFromTemplatesAction(partnerId)` — copy system templates to partner blocks for enabled modules
3. `updatePartnerBlockAction(partnerId, blockId, updates)` — update allowed fields only
4. `reorderPartnerBlocksAction(partnerId, orderedIds)` — batch set sortOrder = index
5. `togglePartnerBlockVisibilityAction(partnerId, blockId, isVisible)` — single field toggle
6. `resetPartnerBlockToTemplateAction(partnerId, blockId)` — reset to template preserving sort/visibility/custom
7. `removePartnerBlockAction(partnerId, blockId)` — delete partner block
8. `getPartnerBlockSummaryAction(partnerId)` — aggregate stats

## Files Modified

### `src/actions/relay-storefront-actions.ts`

**Changes:**
- Exported `MODULE_ICON_MAP` and `CATEGORY_MAP` (was `const`, now `export const`)
- `getRelayStorefrontDataAction` now reads partner blocks first (`partners/{id}/relayConfig/blocks` where `isVisible == true`, ordered by `sortOrder asc`), with fallback to global `relayBlockConfigs` if partner has no blocks

## Firestore Paths

| Path | Purpose |
|------|---------|
| `relayBlockConfigs/{blockId}` | System templates (unchanged) |
| `partners/{partnerId}/relayConfig/blocks/{blockId}` | Partner block instances (NEW) |
| `partners/{partnerId}/businessModules` | Partner's enabled modules (read-only) |

## Fallback Strategy

`getRelayStorefrontDataAction` checks for partner-level blocks first. If the partner has no blocks in `relayConfig/blocks`, it falls back to the original global `relayBlockConfigs` logic. This ensures backward compatibility for partners that haven't been synced yet.

## Partner Block ID Format

`pb_${template.moduleSlug || templateDocId}` — e.g., `pb_catalog`, `pb_module_rooms`
