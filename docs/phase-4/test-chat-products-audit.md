# Test Chat Products — Layer-by-Layer Audit

Session: partner-relay follow-up, Part 2.
Branch: `claude/partner-relay-followup`.
Baseline: tsc 276, tests 707/707 (post-Part-1 M03-Registry).

Operator-reported symptom: when the user asks about products in
`/partner/relay` Test Chat, the rendered list does not match the
configured product items at `/partner/relay/modules`.

Audit is code-level (no live browser available this session). Per
the prompt's audit-before-fix discipline, findings + predicted root
cause land here as evidence before any fix code.

---

## TL;DR

**Root cause: Layer C (buildBlockData) — module selection by first-with-items, not by purpose.**

`src/lib/relay/admin-block-data.ts:88-93` — `buildProductCard` does:

```ts
const mod = modules.find((m) => Array.isArray(m.items) && m.items.length > 0);
```

`partner.modules` arrives ordered by `createdAt desc` (Layer B —
`getPartnerModulesAction` line 6). The first module with any items
wins — regardless of whether it's a product catalog, a service
catalog, an article list, or any other module type that happens to
have items.

**Failure mode:** Partner has a "services" module created Tuesday
(items: 5) and a "products" module created Monday (items: 3). Order
returned: `[services, products]`. `buildProductCard` returns the
SERVICE list when the user asked for products. The symptom matches
the operator report.

**Fix shape (Layer C):** filter modules by purpose (block id →
preferred slugs) before picking. Fall back to first-with-items if no
preferred slug matches (preserves current behavior for partners with
only one module).

Scope: bounded, ~30 LOC + tests. No cascade across layers.

---

## 1. Layer A — Module configuration storage

**Finding: NO mismatch.**

- `/partner/relay/modules` UI writes via `createModuleItemAction`,
  `updateModuleItemAction`, etc. in `src/actions/modules-actions.ts`.
- All writes go to `partners/{partnerId}/businessModules/{moduleId}/items`.
- The orchestrator's partner signal reads from the same path via
  `getModuleItemsAction(partnerId, moduleId, ...)` — identical
  collection.
- No legacy `relayModules` / parallel collection exists.

Evidence:
```
modules-actions.ts:854 .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
modules-actions.ts:911 .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
loadPartnerSignal partner.ts:44 calls getModuleItemsAction(...)
```

Layer A is clean.

## 2. Layer B — Partner signal loading

**Finding: limit + order surface a corollary issue but not the root cause.**

`src/lib/relay/orchestrator/signals/partner.ts:17-49`:
- `MAX_MODULES = 10` cap on returned modules
- Modules ordered `createdAt desc` (per `getPartnerModulesAction`
  modules-actions.ts:560)
- Per-module item paging: `pageSize: 20`, `isActive: true`, sorted
  `sortOrder asc`

**If the partner has >10 modules and the products module is older
than the 10 newest:** products module never reaches `partner.modules`
→ `buildProductCard` returns nothing useful or picks the wrong one.

This is a **secondary failure surface**, not the primary symptom.
Even partners with ≤10 modules hit Layer C's primary bug.

Carry-forward note for `PHASE_4_BACKLOG.md`: prioritize active
commerce modules in the slice. Out of scope for this fix.

## 3. Layer C — `buildBlockData` / `buildProductCard` (root cause)

**Finding: MODULE SELECTION HEURISTIC IS WRONG.**

`src/lib/relay/admin-block-data.ts:42-47, 88-93`:

```ts
case 'product_card':
case 'ecom_product_card':
case 'menu':
case 'fb_menu':
case 'services':
  return buildProductCard(modules) as Record<string, unknown> | undefined;

function buildProductCard(modules: ModuleLike[]): ProductCardPreviewData | undefined {
  const mod = modules.find((m) => Array.isArray(m.items) && m.items.length > 0);
  if (!mod) return undefined;
  // ... renders mod.items
}
```

Five distinct block ids all dispatch to a builder that picks the
**first non-empty module regardless of purpose**:

| Block id | Intended purpose | What `buildProductCard` does |
|---|---|---|
| `product_card` | Commerce products | First non-empty module |
| `ecom_product_card` | Ecommerce products | First non-empty module |
| `menu` | Restaurant menu | First non-empty module |
| `fb_menu` | F&B menu | First non-empty module |
| `services` | Service catalog | First non-empty module |

When a partner has multiple module types with items, all five blocks
render the same module — whichever has the most recent `createdAt`.
This is the operator-reported symptom.

**Why it works for some partners:** single-module partners or
partners whose newest module happens to be the product catalog never
hit the bug.

## 4. Layer D — Flow / catalog filtering

**Finding: NOT the root cause. Probably renders the right block id.**

The operator reports a wrong product LIST, not a wrong block. If
flow/catalog were the bug, the symptom would be "no product block
renders at all" or "wrong block type renders." The reported symptom
("wrong list") implies `product_card` IS the selected block — and
`buildProductCard` produces the wrong items.

Layer D is clean for this symptom. Distinct from a hypothetical
"product block missing from catalog" bug, which would be a different
report.

## 5. Layer E — Test Chat render path

**Finding: render path correctly forwards `blockData`.**

`src/components/partner/relay/test-chat/TestChatBlockPreview.tsx:25-43`:
- `product_card` is in `INTERACTIVE_BLOCKS`
- `RENDERER_TYPE_MAP.product_card === 'products'` (admin block id →
  BlockRenderer type)
- When `theme + callbacks` provided, routes through
  production `BlockRenderer` with `{type: 'products', ...blockData}`

Whatever `blockData` contains is what `BlockRenderer` renders.
Layer E does not transform or filter; bug lives upstream.

## 6. Layer F — Seed vs turn divergence

**Finding: NO divergence.**

Both paths use `buildBlockData()`:
- `src/app/api/relay/chat/seed/route.ts:122` — seed path
- `src/lib/relay/orchestrator/index.ts:298` — chat-turn path

Same function; same Layer C bug fires on both. The bug is consistent
across entry points.

---

## Fix shape (recommended, Layer C)

Pass the `blockId` into `buildProductCard` and prefer modules whose
slug matches the block's intended purpose. Fall back to
first-with-items only when no preferred match exists.

### Mapping

```ts
const PRODUCT_BLOCK_PREFERRED_SLUGS: Record<string, string[]> = {
  product_card: ['products', 'catalog', 'inventory'],
  ecom_product_card: ['products', 'catalog', 'inventory'],
  menu: ['menu_items', 'menu', 'dishes'],
  fb_menu: ['menu_items', 'menu', 'dishes'],
  services: ['services', 'treatments', 'offerings'],
};

function buildProductCard(
  modules: ModuleLike[],
  blockId: string,
): ProductCardPreviewData | undefined {
  const preferred = PRODUCT_BLOCK_PREFERRED_SLUGS[blockId] ?? [];
  // Prefer a module whose slug matches the block's purpose AND has items.
  const byPurpose = preferred
    .map((slug) => modules.find((m) => m.slug === slug && (m.items?.length ?? 0) > 0))
    .find((m) => m !== undefined);
  // Fall back to first-with-items (preserves current behavior for
  // single-module partners, and for partners whose product catalog
  // uses an unconventional slug).
  const mod = byPurpose ?? modules.find((m) => Array.isArray(m.items) && m.items.length > 0);
  if (!mod) return undefined;
  // ... existing render logic ...
}
```

### Scope assessment

- **Bounded.** Single function signature change + small mapping
  table. Caller in `buildBlockData` switch passes `blockId` it
  already has.
- **No cascade.** Layer A/B/D/E/F unchanged.
- **Backward compatible.** Single-module partners + partners using
  unconventional slugs hit the fallback path (current behavior).
- **Test surface.** Add a regression test seeding `[services-with-items, products-with-items]` and asserting `buildProductCard(modules, 'product_card')` returns the products module.

### What this fix does NOT address

- Layer B's MAX_MODULES=10 cap — partners with 11+ modules where
  products is module #11 still miss. Backlog item.
- Slug variance — partners using bespoke slugs (e.g. `inventory_v2`,
  `goods`) still hit fallback. Could expand the mapping table over
  time as patterns surface.
- The `menu`/`services` block ambiguity — could be desired in some
  food-and-services hybrid partners. Worth retro discussion if
  reports surface.

---

## Verification protocol (operator-side)

To confirm this audit's root-cause claim before the fix lands:

1. Open the affected partner's Firestore record.
2. Check `partners/{pid}/businessModules` — list the modules and
   their `createdAt` timestamps + item counts.
3. Predict which module Layer C's current heuristic picks (newest
   non-empty).
4. Compare to what's rendering in Test Chat.
5. If they match → this audit is correct.
6. If they don't match → halt; the symptom has a different cause
   and needs further investigation.

If the operator's reproduction differs (e.g. the right module is
picked but its items are wrong, or the right items appear but the
order is off) — surface so we can re-scope the fix.

---

## Halt assessment

**Not halted.**
- ✅ Root cause is mechanical (single-function logic), not architectural
- ✅ Fix is layer-local — no cascade across layers
- ✅ Reproduction is code-traceable from the Layer C heuristic; no
     partner-data quirk required
- ✅ No instinct to refactor the broader buildBlockData architecture

Proceeding with the fix in the next commit.
