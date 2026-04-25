// Regression tests for buildBlockData — PR fix-26 generic dispatch.
//
// Pre-fix-26: a per-blockId switch with a hand-coded
// PRODUCT_BLOCK_PREFERRED_SLUGS mapping handled ~10 specific block
// IDs and returned undefined for everything else. With the new
// vertical-prefixed slugs (food_beverage_menu, ecommerce_catalog,
// etc.) the legacy mapping was stale and ~90% of blocks rendered
// against their internal sampleData regardless of partner data.
//
// Post-fix-26: any block whose registry definition has `block.module`
// set pulls items from the partner's businessModule with that slug.
// Greeting + contact remain specialized (different shape).

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

describe('buildBlockData — generic dispatch (PR fix-26)', () => {
  it('product_card pulls from `ecommerce_catalog` (block.module slug)', () => {
    const modules: FakeModule[] = [
      mod('food_beverage_menu', [{ name: 'Wrong: Pizza', price: 12 }]),
      mod('ecommerce_catalog', [
        { name: 'Right: Hoodie', price: 79 },
        { name: 'Right: Cap', price: 24 },
      ]),
    ];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    expect(result).toBeDefined();
    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Right: Hoodie', 'Right: Cap']);
  });

  it('menu_item pulls from `food_beverage_menu` (block.module slug)', () => {
    const modules: FakeModule[] = [
      mod('ecommerce_catalog', [{ name: 'Wrong: Hoodie', price: 79 }]),
      mod('food_beverage_menu', [
        { name: 'Right: Croissant', price: 3 },
        { name: 'Right: Espresso', price: 4 },
      ]),
    ];
    const result = buildBlockData({ blockId: 'menu_item', partnerData: null, modules });
    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Right: Croissant', 'Right: Espresso']);
  });

  it('drink_menu pulls from `food_beverage_beverage` (block.module slug)', () => {
    const modules: FakeModule[] = [
      mod('food_beverage_menu', [{ name: 'Wrong: Croissant', price: 3 }]),
      mod('food_beverage_beverage', [
        { name: 'Right: Espresso', price: 4 },
        { name: 'Right: Matcha Latte', price: 6 },
      ]),
    ];
    const result = buildBlockData({ blockId: 'drink_menu', partnerData: null, modules });
    const items = (result as { items: Array<{ name: string }> }).items;
    expect(items.map((i) => i.name)).toEqual(['Right: Espresso', 'Right: Matcha Latte']);
  });

  it('returns undefined when no matching partnerModule exists for the block.module slug', () => {
    const modules: FakeModule[] = [
      mod('completely_unrelated_slug', [{ name: 'Foo' }]),
    ];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    expect(result).toBeUndefined();
  });

  it('returns undefined when matching module exists but has zero items', () => {
    const modules: FakeModule[] = [mod('ecommerce_catalog', [])];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    expect(result).toBeUndefined();
  });

  it('returns undefined for unknown blockIds (not in registry)', () => {
    const modules: FakeModule[] = [mod('anything', [{ name: 'X' }])];
    const result = buildBlockData({
      blockId: 'totally_made_up_block_id',
      partnerData: null,
      modules,
    });
    expect(result).toBeUndefined();
  });
});

// ── Item normalization ─────────────────────────────────────────────

describe('buildBlockData — item normalization', () => {
  it('hoists custom-field bag (`fields.{x}`) to top level', () => {
    const modules: FakeModule[] = [
      mod('ecommerce_catalog', [
        {
          name: 'Hoodie',
          price: 79,
          fields: {
            badges: ['Popular'],
            rating: 4.7,
            review_count: 128,
            sku: 'HOOD-001',
          },
        },
      ]),
    ];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    const item = (result as { items: Array<Record<string, unknown>> }).items[0];
    expect(item.badges).toEqual(['Popular']);
    expect(item.rating).toBe(4.7);
    expect(item.review_count).toBe(128);
    expect(item.sku).toBe('HOOD-001');
  });

  it('normalizes images[] → imageUrl + thumbnail + image_url', () => {
    const modules: FakeModule[] = [
      mod('ecommerce_catalog', [
        {
          name: 'Hoodie',
          price: 79,
          images: ['https://cdn.example.com/hoodie.jpg', 'https://cdn.example.com/hoodie-2.jpg'],
        },
      ]),
    ];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    const item = (result as { items: Array<Record<string, unknown>> }).items[0];
    expect(item.imageUrl).toBe('https://cdn.example.com/hoodie.jpg');
    expect(item.thumbnail).toBe('https://cdn.example.com/hoodie.jpg');
    expect(item.image_url).toBe('https://cdn.example.com/hoodie.jpg');
  });

  it('aliases description → subtitle and name → title for renderers that read them', () => {
    const modules: FakeModule[] = [
      mod('ecommerce_catalog', [
        { name: 'Hoodie', description: 'Cozy fleece', price: 79 },
      ]),
    ];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    const item = (result as { items: Array<Record<string, unknown>> }).items[0];
    expect(item.subtitle).toBe('Cozy fleece');
    expect(item.title).toBe('Hoodie');
  });

  it('first item is spread at top level so single-record renderers find their fields', () => {
    // For blocks like nudge / promo that read `data.headline`, the
    // generic dispatch spreads firstItem at envelope level.
    const modules: FakeModule[] = [
      mod('shared_marketing', [
        { name: 'Promo', fields: { title: 'Summer Sale', cta_label: 'Shop now' } },
      ]),
    ];
    const result = buildBlockData({ blockId: 'promo', partnerData: null, modules });
    expect(result).toBeDefined();
    expect((result as Record<string, unknown>).title).toBe('Summer Sale');
    expect((result as Record<string, unknown>).cta_label).toBe('Shop now');
    // items[] is also present for any list renderer that wants it.
    expect(Array.isArray((result as { items?: unknown[] }).items)).toBe(true);
  });

  it('moduleSlug is attached so downstream callbacks can resolve the partnerModule', () => {
    const modules: FakeModule[] = [
      mod('ecommerce_catalog', [{ id: 'sku_1', name: 'Hoodie', price: 79 }]),
    ];
    const result = buildBlockData({ blockId: 'product_card', partnerData: null, modules });
    expect((result as { moduleSlug: string }).moduleSlug).toBe('ecommerce_catalog');
  });
});

// ── Currency thread (PR fix-15 — still works post fix-26) ──────────

describe('buildBlockData — partner currency thread', () => {
  it('product_card envelope inherits identity.currency', () => {
    const modules: FakeModule[] = [
      mod('ecommerce_catalog', [{ name: 'Hoodie', price: 79 }]),
    ];
    const result = buildBlockData({
      blockId: 'product_card',
      partnerData: { businessPersona: { identity: { currency: 'USD' } } },
      modules,
    });
    expect((result as { currency: string }).currency).toBe('USD');
  });

  it('greeting envelope inherits identity.currency too', () => {
    const result = buildBlockData({
      blockId: 'greeting',
      partnerData: {
        businessPersona: { identity: { name: 'Acme', currency: 'INR' } },
      },
      modules: [],
    });
    expect((result as { currency: string }).currency).toBe('INR');
  });
});

// ── Specialized builders unchanged ─────────────────────────────────

describe('buildBlockData — greeting/contact specialized builders', () => {
  it('greeting reads brandName + tagline from persona', () => {
    const result = buildBlockData({
      blockId: 'greeting',
      partnerData: {
        businessPersona: {
          identity: { name: 'Acme Goods' },
          personality: { tagline: 'We make things' },
        },
      },
      modules: [],
    });
    expect((result as { brandName: string }).brandName).toBe('Acme Goods');
    expect((result as { tagline: string }).tagline).toBe('We make things');
    expect((result as { initial: string }).initial).toBe('A');
  });

  it('contact reads phone/email/website from persona identity', () => {
    const result = buildBlockData({
      blockId: 'contact',
      partnerData: {
        businessPersona: {
          identity: {
            phone: '+1 555 0100',
            email: 'hello@acme.test',
            website: 'acme.test',
          },
        },
      },
      modules: [],
    });
    const items = (result as { items: Array<{ label: string; value: string }> }).items;
    expect(items.find((i) => i.label === 'Phone')?.value).toBe('+1 555 0100');
    expect(items.find((i) => i.label === 'Email')?.value).toBe('hello@acme.test');
    expect(items.find((i) => i.label === 'Website')?.value).toBe('acme.test');
  });
});
