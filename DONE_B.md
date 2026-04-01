# Prompt B: Partner Storefront Manager Component

## File: `src/components/partner/relay/RelayStorefrontManager.tsx`

### Component
- `RelayStorefrontManager` (default export) — Partner-facing block management UI

### Props
- `partnerId: string`
- `accentColor: string`

### Features
1. **Block list** — Scrollable list of partner blocks with blockType badge, category label, reorder buttons, and visibility toggle
2. **Sync** — Syncs system templates into partner blocks via `syncBlocksFromTemplatesAction`
3. **Reorder** — Move blocks up/down with optimistic UI update and batch reorder
4. **Toggle visibility** — Switch component with optimistic toggle and rollback on error
5. **Preview** — Right panel renders selected block via `BlockRenderer` with sample data in a phone-like frame
6. **Edit label** — Input to set a custom label, saved via `updatePartnerBlockAction`
7. **Delete** — Remove block with confirmation dialog
8. **Empty state** — Centered prompt with sync button when no blocks exist

### State Management
- `blocks: PartnerBlockConfig[]` — Full block list from server
- `loading: boolean` — Initial load state
- `syncing: boolean` — Sync operation in progress
- `selectedId: string | null` — Currently selected block for preview/edit
- `editLabel: string` — Custom label input value
- Derived: `visibleCount`, `hiddenCount`, `selectedBlock`, `mockBlock`, `theme`

### Patterns
- `'use client'` directive
- shadcn/ui components (Card, Button, Input, Badge, Switch)
- lucide-react icons
- `toast` from sonner for all user feedback
- Inline `buildTheme` helper (same pattern as RelayFullPage.tsx)
- Optimistic UI updates with rollback on error
- Try/catch on all server action calls
