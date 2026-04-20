// P1.M01 — session-store field-path write discipline tests.
//
// Verifies targeted setters update only their owned sub-object and
// leave sibling sub-objects untouched. Array-clobber regression test
// guards against a whole-doc merge being re-introduced.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import {
  getSessionIdentity,
  loadOrCreateSession,
  loadSession,
  setActiveEngine,
  setSessionBooking,
  setSessionCart,
  setSessionCustomer,
  setSessionIdentity,
  updateSession,
} from '../session-store';
import { recomputeCartTotals } from '../session-types';

beforeEach(() => {
  resetFirestoreMock();
});

const PARTNER = 'p1';
const CONV = 'c1';

async function seedSession() {
  return loadOrCreateSession(PARTNER, CONV);
}

describe('session-store — targeted setters (P1.M01)', () => {
  it('setSessionCart writes cart, leaves booking/customer/activeEngine untouched', async () => {
    await seedSession();

    // Seed booking slots + a customer + activeEngine via other setters
    await setSessionBooking(PARTNER, CONV, {
      slots: [
        {
          slotId: 's1',
          serviceId: 'svc1',
          serviceName: 'Cut',
          date: '2026-04-20',
          time: '10:00',
          duration: 30,
          price: 50,
          status: 'tentative',
          reservedAt: new Date().toISOString(),
        },
      ],
    });
    await setSessionCustomer(PARTNER, CONV, { name: 'Alice' });
    await setActiveEngine(PARTNER, CONV, 'commerce');

    const newCart = recomputeCartTotals({
      items: [
        {
          itemId: 'i1',
          moduleSlug: 'products',
          name: 'Widget',
          price: 10,
          quantity: 2,
          addedAt: new Date().toISOString(),
        },
      ],
      subtotal: 0,
      total: 0,
    });
    await setSessionCart(PARTNER, CONV, newCart);

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.cart.items).toHaveLength(1);
    expect(reloaded?.cart.items[0].itemId).toBe('i1');
    // Sibling sub-objects untouched
    expect(reloaded?.booking.slots).toHaveLength(1);
    expect(reloaded?.booking.slots[0].slotId).toBe('s1');
    expect(reloaded?.customer?.name).toBe('Alice');
    expect(reloaded?.activeEngine).toBe('commerce');
  });

  it('setSessionBooking writes booking, leaves cart/customer untouched', async () => {
    await seedSession();
    await setSessionCart(PARTNER, CONV, recomputeCartTotals({
      items: [{ itemId: 'i1', moduleSlug: 'p', name: 'X', price: 1, quantity: 1, addedAt: 't' }],
      subtotal: 0,
      total: 0,
    }));
    await setSessionCustomer(PARTNER, CONV, { name: 'Bob' });

    await setSessionBooking(PARTNER, CONV, {
      slots: [
        {
          slotId: 's2',
          serviceId: 'svc',
          serviceName: 'X',
          date: '2026-04-21',
          time: '11:00',
          duration: 60,
          price: 100,
          status: 'tentative',
          reservedAt: 't',
        },
      ],
      guestCount: 2,
    });

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.booking.slots[0].slotId).toBe('s2');
    expect(reloaded?.booking.guestCount).toBe(2);
    expect(reloaded?.cart.items[0].itemId).toBe('i1');
    expect(reloaded?.customer?.name).toBe('Bob');
  });

  it('setSessionCustomer writes customer, leaves cart/booking untouched', async () => {
    await seedSession();
    await setSessionCart(PARTNER, CONV, recomputeCartTotals({
      items: [{ itemId: 'i1', moduleSlug: 'p', name: 'X', price: 1, quantity: 1, addedAt: 't' }],
      subtotal: 0,
      total: 0,
    }));

    await setSessionCustomer(PARTNER, CONV, {
      name: 'Carol',
      email: 'c@x.com',
      phone: '+15550001111',
    });

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.customer?.name).toBe('Carol');
    expect(reloaded?.customer?.email).toBe('c@x.com');
    expect(reloaded?.cart.items).toHaveLength(1);
  });

  it('setActiveEngine writes engine, leaves cart/booking untouched', async () => {
    await seedSession();
    await setSessionBooking(PARTNER, CONV, {
      slots: [
        {
          slotId: 's3',
          serviceId: 'svc',
          serviceName: 'X',
          date: '2026-04-22',
          time: '12:00',
          duration: 30,
          price: 50,
          status: 'tentative',
          reservedAt: 't',
        },
      ],
    });

    await setActiveEngine(PARTNER, CONV, 'booking');

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.activeEngine).toBe('booking');
    expect(reloaded?.booking.slots).toHaveLength(1);
  });

  it('updateSession writes multiple sub-objects atomically', async () => {
    await seedSession();

    await updateSession(PARTNER, CONV, {
      cart: recomputeCartTotals({
        items: [{ itemId: 'i1', moduleSlug: 'p', name: 'X', price: 1, quantity: 1, addedAt: 't' }],
        subtotal: 0,
        total: 0,
      }),
      customer: { phone: '+15550009999' },
    });

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.cart.items).toHaveLength(1);
    expect(reloaded?.customer?.phone).toBe('+15550009999');
    // Untouched
    expect(reloaded?.booking.slots).toEqual([]);
  });

  it('updateSession ignores undefined keys (partial payload)', async () => {
    await seedSession();
    await setSessionCart(PARTNER, CONV, recomputeCartTotals({
      items: [{ itemId: 'pre', moduleSlug: 'p', name: 'Pre', price: 1, quantity: 1, addedAt: 't' }],
      subtotal: 0,
      total: 0,
    }));

    // No payload keys: only updatedAt should bump; cart unchanged.
    await updateSession(PARTNER, CONV, {});

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.cart.items[0].itemId).toBe('pre');
  });
});

describe('session-store — array-clobber regression (P1.M01)', () => {
  it('dotted field-path update does not wipe sibling nested fields under the same parent', async () => {
    await seedSession();
    // Seed booking.slots (current shape)
    await setSessionBooking(PARTNER, CONV, {
      slots: [
        { slotId: 'A', serviceId: 'svc', serviceName: 'A', date: 'd', time: 't', duration: 30, price: 1, status: 'tentative', reservedAt: 't' },
        { slotId: 'B', serviceId: 'svc', serviceName: 'B', date: 'd', time: 't', duration: 30, price: 1, status: 'tentative', reservedAt: 't' },
      ],
      guestCount: 4,
    });

    // Simulate the Phase-3-shaped future write that would've clobbered
    // slots under whole-doc merge. Use the DocRef directly with a dotted
    // path to assert array-preservation semantics.
    const { db } = await import('@/lib/firebase-admin');
    const ref = (db.collection as any)('relaySessions').doc(`${PARTNER}_${CONV}`);
    await ref.update({
      'booking.futureNestedField': 'holds_placeholder',
    });

    const reloaded = await loadSession(PARTNER, CONV);
    // Array intact — not clobbered
    expect(reloaded?.booking.slots).toHaveLength(2);
    expect(reloaded?.booking.slots[0].slotId).toBe('A');
    expect(reloaded?.booking.slots[1].slotId).toBe('B');
    // New field added
    expect((reloaded?.booking as unknown as { futureNestedField?: string })
      .futureNestedField).toBe('holds_placeholder');
    // Sibling in same nested parent preserved
    expect(reloaded?.booking.guestCount).toBe(4);
  });
});

describe('session-store — identity group (P1.M03)', () => {
  it('getSessionIdentity on null session returns null/false', () => {
    const r = getSessionIdentity(null);
    expect(r.contactId).toBeNull();
    expect(r.resolved).toBe(false);
  });

  it('getSessionIdentity on session without identity returns null/false', async () => {
    const session = await seedSession();
    const r = getSessionIdentity(session);
    expect(r.contactId).toBeNull();
    expect(r.resolved).toBe(false);
  });

  it('setSessionIdentity writes identity.contactId + resolvedAt via field path', async () => {
    await seedSession();
    await setSessionIdentity(PARTNER, CONV, '+15551234567');

    const reloaded = await loadSession(PARTNER, CONV);
    const r = getSessionIdentity(reloaded);
    expect(r.contactId).toBe('+15551234567');
    expect(r.resolved).toBe(true);
    expect(reloaded?.identity?.resolvedAt).toBeDefined();
  });

  it('setSessionIdentity does not touch cart/booking sub-objects', async () => {
    await seedSession();
    await setSessionCart(PARTNER, CONV, recomputeCartTotals({
      items: [{ itemId: 'x', moduleSlug: 'p', name: 'X', price: 10, quantity: 1, addedAt: 't' }],
      subtotal: 0,
      total: 0,
    }));
    await setSessionBooking(PARTNER, CONV, {
      slots: [
        { slotId: 'S', serviceId: 'svc', serviceName: 'X', date: 'd', time: 't', duration: 30, price: 1, status: 'tentative', reservedAt: 't' },
      ],
    });

    await setSessionIdentity(PARTNER, CONV, '+15551234567');

    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.identity?.contactId).toBe('+15551234567');
    expect(reloaded?.cart.items).toHaveLength(1);
    expect(reloaded?.booking.slots).toHaveLength(1);
  });

  it('setSessionIdentity is idempotent; re-setting same contactId updates resolvedAt', async () => {
    await seedSession();
    await setSessionIdentity(PARTNER, CONV, '+15551234567');
    const first = await loadSession(PARTNER, CONV);
    const firstResolvedAt = first?.identity?.resolvedAt;

    await new Promise((r) => setTimeout(r, 5));

    await setSessionIdentity(PARTNER, CONV, '+15551234567');
    const second = await loadSession(PARTNER, CONV);

    expect(second?.identity?.contactId).toBe('+15551234567');
    expect(second?.identity?.resolvedAt).not.toBe(firstResolvedAt);
  });
});

describe('session-store — loadOrCreate invariant (P1.M01)', () => {
  it('loadOrCreateSession creates on first touch; subsequent sets use .update()', async () => {
    const first = await loadOrCreateSession(PARTNER, CONV);
    expect(first.cart.items).toEqual([]);

    // Second call returns existing, does not overwrite
    await setSessionCart(PARTNER, CONV, recomputeCartTotals({
      items: [{ itemId: 'x', moduleSlug: 'p', name: 'X', price: 1, quantity: 1, addedAt: 't' }],
      subtotal: 0,
      total: 0,
    }));
    const second = await loadOrCreateSession(PARTNER, CONV);
    expect(second.cart.items).toHaveLength(1);
    expect(second.createdAt).toBe(first.createdAt);
  });
});
