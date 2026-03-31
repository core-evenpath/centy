# Phase 1: Relay Storefront Data Layer — Complete

## File Created
- `src/actions/relay-storefront-actions.ts`

## Exported Types
- `RelayStorefrontData` — full storefront data shape (brand, modules, contact, hours, usp, flow, rag, industry/function)
- `RelayModuleEntry` — individual module entry (id, slug, name, description, iconName, blockType, itemCount, category)

## Exported Functions
- `getRelayStorefrontDataAction(partnerId: string)` — single server action that fetches all data in one Promise.all

## Assumptions
- Used `enabled` field (matching PartnerModule type) instead of `isEnabled` for the businessModules query
- Default accent color fallback: `#6366f1` (indigo) when relay config has none
- Address formatted as `city, state` from BusinessAddress
- `itemCount` sourced directly from the partner module document field
- Block config lookup: first by `moduleSlug` field match, then by doc ID `module_${slug}`
