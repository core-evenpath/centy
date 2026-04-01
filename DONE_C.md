# Prompt C: Wire Storefront Tab + Partner Block Reads

## File 1: `src/app/partner/(protected)/relay/page.tsx`

### Lines changed
- **Line 14**: Added `import RelayStorefrontManager from '@/components/partner/relay/RelayStorefrontManager';`
- **Line 363**: Added `<TabsTrigger value="storefront">Storefront</TabsTrigger>` inside TabsList
- **After line 761**: Added `<TabsContent value="storefront">` with `<RelayStorefrontManager>` component

## File 2: `src/actions/relay-storefront-actions.ts`

### Lines changed
- **Promise.all block (lines 112-131)**: Added `globalBlocksSnap` fetch (`adminDb.collection('relayBlockConfigs').get()`), removed `where('isVisible', '==', true)` from `partnerBlocksSnap` query
- **Module building (lines 139-186)**: Added `hasPartnerBlocks` variable, added `.filter(doc => doc.data().isVisible !== false)` for JS-side visibility filtering, changed fallback label from `''` to `doc.id`, replaced lazy `blockConfigsSnap` fetch with pre-fetched `globalBlocksSnap`

### Maps
- `MODULE_ICON_MAP` and `CATEGORY_MAP` were already exported — no change needed
