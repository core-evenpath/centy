// P2.M03 order_tracker data loader tests.
//
// Covers:
// - Anon session (null contactId) → empty orders
// - Identity with 0 orders → empty orders
// - Identity with N orders → N orders, most recent first, capped at 5
// - Contact-scoped query: another contact's orders not returned
// - Cross-partner isolation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import { loadOrderTrackerData, ORDER_TRACKER_BLOCK_IDS } from '../order-tracker-data';
import type { RelayOrder } from '../../order-types';

const PARTNER = 'p1';
const PHONE = '+15551234567';
const OTHER = '+15559999999';

beforeEach(() => {
  resetFirestoreMock();
});

function seedOrder(partnerId: string, orderId: string, overrides: Partial<RelayOrder>): void {
  const base: RelayOrder = {
    id: orderId,
    partnerId,
    conversationId: 'c',
    contactId: PHONE,
    items: [
      { itemId: 'i1', moduleSlug: 'p', name: 'X', price: 10, quantity: 1 },
    ],
    subtotal: 10,
    shippingCost: 0,
    tax: 0,
    total: 10,
    currency: 'INR',
    shippingAddress: {
      name: 'Alice', phone: PHONE, line1: '1 Main', city: 'A', state: 'X', postalCode: '0', country: 'US',
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'pending',
    timeline: [],
    createdAt: '2026-04-20T12:00:00.000Z',
    updatedAt: '2026-04-20T12:00:00.000Z',
  };
  const order: RelayOrder = { ...base, ...overrides };
  firestoreStore.set(`partners/${partnerId}/orders/${orderId}`, {
    id: orderId,
    data: order as unknown as Record<string, unknown>,
  });
}

describe('loadOrderTrackerData', () => {
  it('returns empty orders on null contactId (anon session)', async () => {
    const data = await loadOrderTrackerData(PARTNER, null);
    expect(data.orders).toEqual([]);
  });

  it('returns empty orders on undefined contactId', async () => {
    const data = await loadOrderTrackerData(PARTNER, undefined);
    expect(data.orders).toEqual([]);
  });

  it('returns empty orders when contact has no orders', async () => {
    const data = await loadOrderTrackerData(PARTNER, PHONE);
    expect(data.orders).toEqual([]);
  });

  it('returns matching orders shaped for preview', async () => {
    seedOrder(PARTNER, 'ord_ABCDEF', {
      contactId: PHONE,
      status: 'shipped',
      total: 42,
      currency: 'INR',
      createdAt: '2026-04-20T10:00:00.000Z',
    });

    const data = await loadOrderTrackerData(PARTNER, PHONE);
    expect(data.orders).toHaveLength(1);
    const o = data.orders![0];
    expect(o.id).toBe('ord_ABCDEF');
    expect(o.shortId).toBe('#ORD-ABCDEF');
    expect(o.status).toBe('shipped');
    expect(o.statusLabel).toBe('Shipped');
    expect(o.total).toBe(42);
    expect(o.currency).toBe('INR');
  });

  it('excludes orders for other contacts (contact-scoped query)', async () => {
    seedOrder(PARTNER, 'mine_1', { contactId: PHONE });
    seedOrder(PARTNER, 'theirs_1', { contactId: OTHER });
    seedOrder(PARTNER, 'mine_2', { contactId: PHONE });

    const data = await loadOrderTrackerData(PARTNER, PHONE);
    expect(data.orders).toHaveLength(2);
    expect(data.orders!.map((o) => o.id).sort()).toEqual(['mine_1', 'mine_2']);
  });

  it('excludes orders from other partners', async () => {
    seedOrder(PARTNER, 'mine_p1', { contactId: PHONE, partnerId: PARTNER });
    seedOrder('p2', 'mine_p2', { contactId: PHONE, partnerId: 'p2' });

    const data = await loadOrderTrackerData(PARTNER, PHONE);
    expect(data.orders).toHaveLength(1);
    expect(data.orders![0].id).toBe('mine_p1');
  });

  it('caps results at 5 most recent', async () => {
    for (let i = 0; i < 7; i++) {
      seedOrder(PARTNER, `ord_${i}`, {
        contactId: PHONE,
        createdAt: `2026-04-20T${String(10 + i).padStart(2, '0')}:00:00.000Z`,
      });
    }
    const data = await loadOrderTrackerData(PARTNER, PHONE);
    expect(data.orders).toHaveLength(5);
  });

  it('block-ids whitelist contains both canonical and ecom prefix', () => {
    expect(ORDER_TRACKER_BLOCK_IDS.has('order_tracker')).toBe(true);
    expect(ORDER_TRACKER_BLOCK_IDS.has('ecom_order_tracker')).toBe(true);
    expect(ORDER_TRACKER_BLOCK_IDS.has('product_card')).toBe(false);
  });
});
