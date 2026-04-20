// P2.M01 cart-action integration tests.
//
// Focus: Firestore integration around the pure reducer. The reducer's
// pure logic is covered in cart-reducer.test.ts; this file verifies:
// - Actions persist cart via setSessionCart (field-path write)
// - anon `identity` group is not touched by cart mutations
// - expiresAt is bumped on every mutation
// - currency is preserved across mutations

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import {
  addToCartAction,
  removeFromCartAction,
  updateCartItemAction,
} from '../relay-runtime/cart-actions';
import { loadSession, setSessionIdentity } from '@/lib/relay/session-store';
import type { RelaySession } from '@/lib/relay/session-types';

const PARTNER = 'p1';
const CONV = 'c1';

beforeEach(() => {
  resetFirestoreMock();
});

describe('cart actions — anon invariant (ADR-P4-01 §Anon handling)', () => {
  it('add on anon session does not create or require identity', async () => {
    const res = await addToCartAction(CONV, PARTNER, {
      itemId: 'i1',
      moduleSlug: 'products',
      name: 'Widget',
      price: 10,
      currency: 'INR',
    });
    expect(res.success).toBe(true);
    expect(res.cart?.items).toHaveLength(1);

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.identity).toBeUndefined();
  });

  it('cart mutations preserve identity when present', async () => {
    // Seed identity
    await addToCartAction(CONV, PARTNER, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, currency: 'INR',
    });
    await setSessionIdentity(PARTNER, CONV, '+15551234567');

    // Mutate again
    await addToCartAction(CONV, PARTNER, {
      itemId: 'i2', moduleSlug: 'p', name: 'Y', price: 5, currency: 'INR',
    });

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.identity?.contactId).toBe('+15551234567');
    expect(reloaded?.cart.items).toHaveLength(2);
  });
});

describe('cart actions — TTL semantics', () => {
  it('add stamps expiresAt', async () => {
    const res = await addToCartAction(CONV, PARTNER, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, currency: 'INR',
    });
    expect(res.cart?.expiresAt).toBeDefined();
    expect(new Date(res.cart!.expiresAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it('update bumps expiresAt forward vs add', async () => {
    await addToCartAction(CONV, PARTNER, {
      itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, currency: 'INR',
    });
    const first = (await loadSession(PARTNER, CONV))?.cart.expiresAt!;

    await new Promise((r) => setTimeout(r, 5));

    await updateCartItemAction(CONV, PARTNER, 'i1', 3);
    const second = (await loadSession(PARTNER, CONV))?.cart.expiresAt!;
    expect(Date.parse(second)).toBeGreaterThan(Date.parse(first));
  });
});

describe('cart actions — currency preservation', () => {
  it('cart.currency survives updates and removes', async () => {
    await addToCartAction(CONV, PARTNER, {
      itemId: 'a', moduleSlug: 'p', name: 'A', price: 10, currency: 'INR',
    });
    await addToCartAction(CONV, PARTNER, {
      itemId: 'b', moduleSlug: 'p', name: 'B', price: 5, currency: 'INR',
    });
    await updateCartItemAction(CONV, PARTNER, 'a', 2);
    await removeFromCartAction(CONV, PARTNER, 'b');

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.cart.currency).toBe('INR');
    expect(reloaded?.cart.items).toHaveLength(1);
    expect(reloaded?.cart.items[0].itemId).toBe('a');
  });

  it('currency mismatch is surfaced to caller with code', async () => {
    await addToCartAction(CONV, PARTNER, {
      itemId: 'a', moduleSlug: 'p', name: 'A', price: 10, currency: 'INR',
    });
    const res = await addToCartAction(CONV, PARTNER, {
      itemId: 'b', moduleSlug: 'p', name: 'B', price: 5, currency: 'USD',
    });
    expect(res.success).toBe(false);
    expect(res.code).toBe('CART_CURRENCY_MISMATCH');
  });
});
