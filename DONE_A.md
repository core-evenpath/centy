# Prompt A: Partner Block Server Actions — Exports

## File: `src/actions/relay-block-actions.ts`

### Interface
- `PartnerBlockConfig`

### Functions
1. `getPartnerBlockConfigsAction(partnerId: string)` — Read partner blocks ordered by sortOrder
2. `syncBlocksFromTemplatesAction(partnerId: string)` — Sync system templates into partner block collection
3. `togglePartnerBlockVisibilityAction(partnerId: string, blockId: string, isVisible: boolean)` — Toggle block visibility
4. `reorderPartnerBlocksAction(partnerId: string, orderedIds: string[])` — Reorder blocks by setting sortOrder = index
5. `updatePartnerBlockAction(partnerId: string, blockId: string, updates: Partial<PartnerBlockConfig>)` — Update allowed fields on a block
6. `removePartnerBlockAction(partnerId: string, blockId: string)` — Delete a partner block
