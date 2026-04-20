// P2.M01 cart reducer tests (pure — no Firestore).
//
// Covers:
// - Add to empty cart
// - Add existing line merges qty
// - Add with distinct variant creates new line
// - Update qty to 0 removes line
// - Remove by id
// - Currency mismatch rejected
// - expiresAt bumped on every mutation

import { describe, it, expect } from 'vitest';
import {
  reduceCartAdd,
  reduceCartApplyDiscount,
  reduceCartRemove,
  reduceCartUpdate,
  CartCurrencyMismatchError,
  computeCartExpiresAt,
  CART_TTL_MS,
} from '../cart-reducer';
import type { RelaySessionCart } from '@/lib/relay/session-types';

const NOW = new Date('2026-04-20T12:00:00.000Z');

function emptyCart(): RelaySessionCart {
  return { items: [], subtotal: 0, total: 0 };
}

describe('reduceCartAdd', () => {
  it('adds to an empty cart; single line; totals correct', () => {
    const cart = reduceCartAdd(undefined, {
      itemId: 'i1',
      moduleSlug: 'products',
      name: 'Widget',
      price: 10,
      quantity: 2,
      currency: 'INR',
    }, NOW);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.subtotal).toBe(20);
    expect(cart.total).toBe(20);
    expect(cart.currency).toBe('INR');
    expect(cart.expiresAt).toBe(computeCartExpiresAt(NOW));
  });

  it('merges qty when same itemId is added again', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, quantity: 1, currency: 'INR',
    }, NOW);
    cart = reduceCartAdd(cart, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, quantity: 3, currency: 'INR',
    }, NOW);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(4);
    expect(cart.subtotal).toBe(40);
  });

  it('creates a new line when variant differs from existing', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, quantity: 1, variant: 'S', currency: 'INR',
    }, NOW);
    cart = reduceCartAdd(cart, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, quantity: 1, variant: 'M', currency: 'INR',
    }, NOW);
    expect(cart.items).toHaveLength(2);
    expect(cart.items.map((l) => l.variant)).toEqual(['S', 'M']);
  });

  it('defaults quantity to 1 when omitted', () => {
    const cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10,
    }, NOW);
    expect(cart.items[0].quantity).toBe(1);
  });

  it('rejects currency mismatch with CartCurrencyMismatchError', () => {
    const cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, currency: 'INR',
    }, NOW);
    expect(() =>
      reduceCartAdd(cart, {
        itemId: 'i2', moduleSlug: 'p', name: 'Y', price: 5, currency: 'USD',
      }, NOW),
    ).toThrow(CartCurrencyMismatchError);
  });

  it('ignores currency argument when cart has none yet', () => {
    const cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10,
    }, NOW);
    expect(cart.currency).toBeUndefined();
  });
});

describe('reduceCartUpdate', () => {
  it('updates qty in place', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, quantity: 1, currency: 'INR',
    }, NOW);
    cart = reduceCartUpdate(cart, { itemId: 'i1', quantity: 5 }, NOW);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.subtotal).toBe(50);
  });

  it('removes line when qty set to 0', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, currency: 'INR',
    }, NOW);
    cart = reduceCartUpdate(cart, { itemId: 'i1', quantity: 0 }, NOW);
    expect(cart.items).toHaveLength(0);
  });

  it('preserves currency across updates', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, currency: 'INR',
    }, NOW);
    cart = reduceCartUpdate(cart, { itemId: 'i1', quantity: 3 }, NOW);
    expect(cart.currency).toBe('INR');
  });

  it('bumps expiresAt', () => {
    const cart = emptyCart();
    const updated = reduceCartUpdate(cart, { itemId: 'i1', quantity: 1 }, NOW);
    expect(updated.expiresAt).toBe(computeCartExpiresAt(NOW));
  });
});

describe('reduceCartRemove', () => {
  it('removes matching line, keeps others', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'a', moduleSlug: 'p', name: 'A', price: 10, currency: 'INR',
    }, NOW);
    cart = reduceCartAdd(cart, {
      itemId: 'b', moduleSlug: 'p', name: 'B', price: 20, currency: 'INR',
    }, NOW);
    cart = reduceCartRemove(cart, { itemId: 'a' }, NOW);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].itemId).toBe('b');
  });

  it('removing last item leaves empty items array (not null)', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'a', moduleSlug: 'p', name: 'A', price: 10, currency: 'INR',
    }, NOW);
    cart = reduceCartRemove(cart, { itemId: 'a' }, NOW);
    expect(cart.items).toEqual([]);
    expect(cart.subtotal).toBe(0);
  });
});

describe('reduceCartApplyDiscount', () => {
  it('applies flat discount; total updated', () => {
    let cart = reduceCartAdd(undefined, {
      itemId: 'a', moduleSlug: 'p', name: 'A', price: 100, currency: 'INR',
    }, NOW);
    cart = reduceCartApplyDiscount(cart, { code: 'SAVE5', discountAmount: 5 }, NOW);
    expect(cart.discountCode).toBe('SAVE5');
    expect(cart.discountAmount).toBe(5);
    expect(cart.total).toBe(95);
  });
});

describe('expiresAt semantics', () => {
  it('computeCartExpiresAt adds CART_TTL_MS to now', () => {
    const future = computeCartExpiresAt(NOW);
    const diff = Date.parse(future) - NOW.getTime();
    expect(diff).toBe(CART_TTL_MS);
  });

  it('every mutation stamps a fresh expiresAt', () => {
    const now1 = new Date('2026-04-20T12:00:00.000Z');
    const now2 = new Date('2026-04-20T13:00:00.000Z');

    let cart = reduceCartAdd(undefined, {
      itemId: 'a', moduleSlug: 'p', name: 'A', price: 10,
    }, now1);
    const stamp1 = cart.expiresAt;

    cart = reduceCartAdd(cart, {
      itemId: 'b', moduleSlug: 'p', name: 'B', price: 5,
    }, now2);

    expect(stamp1).toBe(computeCartExpiresAt(now1));
    expect(cart.expiresAt).toBe(computeCartExpiresAt(now2));
    expect(cart.expiresAt).not.toBe(stamp1);
  });
});
