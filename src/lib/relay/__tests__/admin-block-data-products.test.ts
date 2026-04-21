// Regression test for the TestChatProducts root cause.
// See docs/phase-4/test-chat-products-audit.md.
//
// Pre-fix: buildProductCard picked the first non-empty module,
// regardless of purpose. Partners with multiple module types saw
// the wrong list rendered for product_card / menu / services.
//
// Post-fix: per-block preferred-slug mapping picks the
// purpose-appropriate module; falls back to first-with-items only
// when no preferred slug matches.

import { describe, it, expect } from 'vitest';
import { buildBlockData } from '../admin-block-data';

interface FakeModule {
  slug: string;
  name: string;
  items: Array<Record<string, unknown>>;
}

function mod(slug: string, items: Array<Record<string, unknown>>): FakeModule {
  return { slug, name: slug, items };
}

describe('buildBlockData / buildProductCard — purpose-aware module selection', () => {
  it('product_card prefers `products` over `services` when both have items', () => {
    // Layout the operator-reported scenario: services module has items
    // AND happens to come first (newer createdAt). Pre-fix, services
    // would have been rendered for product_card.
    const modules: FakeModule[] = [
      mod('services', [
        { name: 'Haircut', price: 50 },
        { name: 'Massage', price: 80 },
      ]),
      mod('products', [
        { name: 'Shampoo', price: 12 },
        { name: 'Conditioner', price: 14 },
      ]),
    ];

    const result = buildBlockData({
      blockId: 'product_card',
      partnerData: null,
      modules,
    });

    expect(result).toBeDefined();
    const items = (result as { items: Array<{ name: string; price?: number }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Shampoo', 'Conditioner']);
  });

  it('services block prefers `services` over `products`', () => {
    const modules: FakeModule[] = [
      mod('products', [{ name: 'Shampoo', price: 12 }]),
      mod('services', [{ name: 'Haircut', price: 50 }]),
    ];

    const result = buildBlockData({
      blockId: 'services',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Haircut']);
  });

  it('menu block prefers `menu_items` over generic catalog', () => {
    const modules: FakeModule[] = [
      mod('products', [{ name: 'Branded Mug', price: 8 }]),
      mod('menu_items', [
        { name: 'Margherita Pizza', price: 14 },
        { name: 'Carbonara', price: 16 },
      ]),
    ];

    const result = buildBlockData({
      blockId: 'menu',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Margherita Pizza', 'Carbonara']);
  });

  it('falls back to first-with-items when no preferred slug matches', () => {
    // Partner using bespoke slug (`inventory_v2`) — preferred-slug
    // map doesn't include it; fallback path returns the only
    // non-empty module.
    const modules: FakeModule[] = [
      mod('inventory_v2', [{ name: 'Bespoke Item', price: 99 }]),
    ];

    const result = buildBlockData({
      blockId: 'product_card',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Bespoke Item']);
  });

  it('returns undefined when no modules have items', () => {
    const modules: FakeModule[] = [
      mod('products', []),
      mod('services', []),
    ];

    const result = buildBlockData({
      blockId: 'product_card',
      partnerData: null,
      modules,
    });

    expect(result).toBeUndefined();
  });

  it('preferred-slug match wins even when module ordering would pick another', () => {
    // products module is LAST in array; preferred-slug match still wins.
    const modules: FakeModule[] = [
      mod('articles', [{ name: 'Blog Post 1' }, { name: 'Blog Post 2' }]),
      mod('faqs', [{ name: 'FAQ Q1' }]),
      mod('products', [{ name: 'Real Product', price: 25 }]),
    ];

    const result = buildBlockData({
      blockId: 'product_card',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Real Product']);
  });

  it('ecom_product_card uses same preferred slugs as product_card', () => {
    const modules: FakeModule[] = [
      mod('services', [{ name: 'Service' }]),
      mod('products', [{ name: 'Product' }]),
    ];

    const result = buildBlockData({
      blockId: 'ecom_product_card',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items[0].name).toBe('Product');
  });

  it('preferred-slug match requires non-empty items (skips empty matched module)', () => {
    // Partner has a `products` module but it's empty; should fall
    // through to the next preferred slug or fallback.
    const modules: FakeModule[] = [
      mod('products', []),
      mod('catalog', [{ name: 'Catalog Item' }]),
    ];

    const result = buildBlockData({
      blockId: 'product_card',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items[0].name).toBe('Catalog Item');
  });
});

// ── Cafe discovery blocks (test-chat-emission follow-up) ─────────
//
// Brew & BonBon Cafe symptom: cafe flow template offers menu_item /
// drink_menu / category_browser / dietary_filter; buildBlockData
// previously handled NONE of them. Ship menu_item + drink_menu (both
// item-shape); defer category_browser + dietary_filter (schema-
// divergent, see retro).

describe('buildBlockData — menu_item (cafe discovery)', () => {
  it('menu_item prefers `menu_items` over `drinks`', () => {
    const modules: FakeModule[] = [
      mod('drinks', [{ name: 'Coffee', price: 4 }]),
      mod('menu_items', [
        { name: 'Artisanal Bonbon', price: 5 },
        { name: 'Croissant', price: 3 },
      ]),
    ];

    const result = buildBlockData({
      blockId: 'menu_item',
      partnerData: null,
      modules,
    });

    expect(result).toBeDefined();
    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Artisanal Bonbon', 'Croissant']);
  });

  it('menu_item falls back to first-with-items when no preferred slug matches', () => {
    const modules: FakeModule[] = [
      mod('cafe_catalog_v2', [{ name: 'Bespoke Item', price: 9 }]),
    ];
    const result = buildBlockData({
      blockId: 'menu_item',
      partnerData: null,
      modules,
    });
    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items[0].name).toBe('Bespoke Item');
  });
});

describe('buildBlockData — drink_menu (cafe discovery)', () => {
  it('drink_menu prefers `drinks` over `menu_items`', () => {
    const modules: FakeModule[] = [
      mod('menu_items', [{ name: 'Croissant', price: 3 }]),
      mod('drinks', [
        { name: 'Espresso', price: 4 },
        { name: 'Matcha Latte', price: 6 },
      ]),
    ];

    const result = buildBlockData({
      blockId: 'drink_menu',
      partnerData: null,
      modules,
    });

    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Espresso', 'Matcha Latte']);
  });

  it('drink_menu falls back to menu_items when no drinks module exists', () => {
    // ordering inside PRODUCT_BLOCK_PREFERRED_SLUGS.drink_menu is
    // ['drinks', 'beverages', 'drink_menu', 'menu_items'] — menu_items
    // is the last preferred entry before fallback.
    const modules: FakeModule[] = [
      mod('menu_items', [{ name: 'Menu Coffee', price: 4 }]),
    ];
    const result = buildBlockData({
      blockId: 'drink_menu',
      partnerData: null,
      modules,
    });
    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items[0].name).toBe('Menu Coffee');
  });
});

describe('buildBlockData — cafe blocks deferred (halt condition)', () => {
  it('category_browser returns undefined (deferred — schema divergent)', () => {
    const modules: FakeModule[] = [
      mod('menu_items', [{ name: 'Item', price: 5 }]),
    ];
    const result = buildBlockData({
      blockId: 'category_browser',
      partnerData: null,
      modules,
    });
    // Explicit undefined — the preview component falls back to its
    // design sample. Categories/counts require aggregation that isn't
    // in today's businessModules schema.
    expect(result).toBeUndefined();
  });

  it('dietary_filter returns undefined (deferred — schema divergent)', () => {
    const modules: FakeModule[] = [
      mod('menu_items', [{ name: 'Item', price: 5 }]),
    ];
    const result = buildBlockData({
      blockId: 'dietary_filter',
      partnerData: null,
      modules,
    });
    expect(result).toBeUndefined();
  });
});
