// PR fix-15 regression test: every block envelope from buildBlockData
// inherits the partner's businessPersona.identity.currency, so the
// downstream block renderers (cart, product-card, rag-context-builder)
// read the configured currency through formatMoney.
//
// Without this thread, the renderers fall back to the literal 'INR'
// default — a USD partner's test-chat would render ₹ regardless of
// what they set in BusinessIdentityCard.

import { describe, it, expect } from 'vitest';
import { buildBlockData } from '../admin-block-data';

const PARTNER_USD = {
  businessPersona: {
    identity: {
      name: 'Acme Goods',
      currency: 'USD',
    },
  },
};

const PARTNER_INR = {
  businessPersona: {
    identity: {
      name: 'Acme Goods',
      currency: 'INR',
    },
  },
};

const PARTNER_NO_CURRENCY = {
  businessPersona: {
    identity: { name: 'Acme Goods' },
  },
};

const PARTNER_LOWERCASE = {
  businessPersona: {
    identity: { name: 'Acme Goods', currency: 'usd' },
  },
};

const PRODUCTS_MODULE = [
  {
    slug: 'products',
    name: 'Products',
    items: [
      { name: 'Hoodie', price: 79.99 },
      { name: 'Cap', price: 24.99 },
    ],
  },
];

describe('buildBlockData / partner currency thread (PR fix-15)', () => {
  it('product_card envelope carries partner currency from identity', () => {
    const data = buildBlockData({
      blockId: 'product_card',
      partnerData: PARTNER_USD,
      modules: PRODUCTS_MODULE,
    });
    expect(data?.currency).toBe('USD');
  });

  it('greeting envelope inherits partner currency too', () => {
    const data = buildBlockData({
      blockId: 'greeting',
      partnerData: PARTNER_INR,
      modules: [],
    });
    expect(data?.currency).toBe('INR');
  });

  it('falls back gracefully when no currency on persona', () => {
    const data = buildBlockData({
      blockId: 'product_card',
      partnerData: PARTNER_NO_CURRENCY,
      modules: PRODUCTS_MODULE,
    });
    // No currency set → field is omitted; renderers fall back to their
    // own default (currently 'INR' for backwards compat).
    expect(data?.currency).toBeUndefined();
  });

  it('normalizes lowercase currency codes to uppercase', () => {
    const data = buildBlockData({
      blockId: 'product_card',
      partnerData: PARTNER_LOWERCASE,
      modules: PRODUCTS_MODULE,
    });
    expect(data?.currency).toBe('USD');
  });

  it('does not overwrite an existing envelope-level currency', () => {
    // Per-item currency (e.g. catalog with mixed-currency items) is
    // preserved on the item; the envelope-level field still gets the
    // partner currency for the renderer's default code path.
    const moduleWithCurrencyOnItems = [
      {
        slug: 'products',
        name: 'Products',
        items: [
          { name: 'European Item', price: 39.99, currency: 'EUR' },
        ],
      },
    ];
    const data = buildBlockData({
      blockId: 'product_card',
      partnerData: PARTNER_USD,
      modules: moduleWithCurrencyOnItems,
    });
    expect(data?.currency).toBe('USD');
    const items = data?.items as Array<Record<string, unknown>>;
    expect(items[0].currency).toBe('EUR');
  });

  it('returns undefined for blocks not in the dispatch table', () => {
    const data = buildBlockData({
      blockId: 'something_unmapped',
      partnerData: PARTNER_USD,
      modules: PRODUCTS_MODULE,
    });
    expect(data).toBeUndefined();
  });
});
