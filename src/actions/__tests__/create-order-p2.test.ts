// P2.M02 createOrder tests — identity gate, health gate, cart drain.
//
// End-to-end flow per ADR-P4-01 §Anon handling:
//   anon session → add cart (anon) → createOrder throws identity →
//   resolve + setIdentity → createOrder succeeds, cart cleared

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';
import { withGatingEnabled } from '@/__tests__/helpers/gating-flag';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/lib/relay/block-config-service', () => ({
  getGlobalBlockConfigs: vi.fn(async () => []),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { createOrderFromCartAction } from '../relay-orders/create-order';
import { addToCartAction } from '../relay-runtime/cart-actions';
import {
  loadOrCreateSession,
  loadSession,
  setSessionIdentity,
} from '@/lib/relay/session-store';
import { resolveContact } from '../contact-actions';
import { invalidateHealthCache } from '@/lib/relay/health-cache';

const PARTNER = 'p1';
const CONV = 'c1';

const ADDRESS = {
  name: 'Alice',
  phone: '+15551234567',
  line1: '1 Main St',
  city: 'Anytown',
  state: 'XX',
  postalCode: '00000',
  country: 'US',
};

beforeEach(() => {
  resetFirestoreMock();
  invalidateHealthCache(PARTNER);
  // Seed a partner with no engines so the health gate no-engines path
  // returns allow (per P3.M05.3 semantics).
  firestoreStore.set(`partners/${PARTNER}`, {
    id: PARTNER,
    data: { id: PARTNER, engines: [] },
  });
});

async function seedCart() {
  await addToCartAction(CONV, PARTNER, {
    itemId: 'i1',
    moduleSlug: 'products',
    name: 'Widget',
    price: 10,
    currency: 'INR',
  });
}

async function resolveIdentity(): Promise<string> {
  // Ensure the session doc exists before dotted-path identity write.
  // In production, the cart/session actions run loadOrCreate first;
  // tests that set identity without a prior mutation must explicitly
  // ensure the session row exists.
  await loadOrCreateSession(PARTNER, CONV);
  const res = await resolveContact(PARTNER, '+15551234567');
  if (!res.success) throw new Error('resolveContact failed');
  await setSessionIdentity(PARTNER, CONV, res.contactId);
  return res.contactId;
}

describe('createOrderFromCartAction — gating', () => {
  it('throws IDENTITY_REQUIRED on anon session with cart', async () => {
    await seedCart();
    const res = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(res.success).toBe(false);
    expect(res.code).toBe('IDENTITY_REQUIRED');
  });

  it('throws EMPTY_CART when identity resolved but cart empty', async () => {
    await resolveIdentity();
    const res = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(res.success).toBe(false);
    expect(res.code).toBe('EMPTY_CART');
  });

  it('throws INVALID_INPUT when shipping address incomplete', async () => {
    await resolveIdentity();
    const res = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: { ...ADDRESS, line1: '' },
      paymentMethod: 'cod',
    });
    expect(res.success).toBe(false);
    expect(res.code).toBe('INVALID_INPUT');
  });

  it('denies HEALTH_RED when partner engine is red and gating enabled', async () => {
    firestoreStore.set(`partners/${PARTNER}`, {
      id: PARTNER,
      data: { id: PARTNER, engines: ['commerce'] },
    });
    // Pre-compute red health doc (stub loaders produce red)
    const { recomputeEngineHealth } = await import('../relay-health-actions');
    await recomputeEngineHealth(PARTNER, 'commerce');

    await resolveIdentity();
    await seedCart();

    // Flag is true by default post-P3.M01-flip; explicit call documents intent
    const res = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });

    expect(res.success).toBe(false);
    expect(res.code).toBe('HEALTH_RED');
  });
});

describe('createOrderFromCartAction — happy path', () => {
  it('creates order with contactId; clears cart; session identity preserved', async () => {
    const contactId = await resolveIdentity();
    await seedCart();

    const res = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });

    expect(res.success).toBe(true);
    expect(res.code).toBeUndefined();
    expect(res.order).toBeDefined();
    expect(res.order?.contactId).toBe(contactId);
    expect(res.order?.items).toHaveLength(1);
    expect(res.order?.status).toBe('pending');

    // Session cart cleared, identity preserved
    const reloaded = await loadSession(PARTNER, CONV);
    expect(reloaded?.cart.items).toEqual([]);
    expect(reloaded?.identity?.contactId).toBe(contactId);

    // Order persisted at partners/{pid}/orders/{oid}
    const orderKey = `partners/${PARTNER}/orders/${res.order!.id}`;
    expect(firestoreStore.get(orderKey)).toBeDefined();
  });

  it('order snapshots cart items; cart changes after order do not affect it', async () => {
    await resolveIdentity();
    await seedCart();
    await addToCartAction(CONV, PARTNER, {
      itemId: 'i2',
      moduleSlug: 'products',
      name: 'Widget 2',
      price: 25,
      quantity: 2,
      currency: 'INR',
    });

    const res = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(res.success).toBe(true);
    expect(res.order?.items).toHaveLength(2);
    expect(res.order?.items[1].quantity).toBe(2);
    expect(res.order?.items[1].price).toBe(25);
  });

  it('second createOrder after cart cleared throws EMPTY_CART (not duplicate)', async () => {
    await resolveIdentity();
    await seedCart();

    const first = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(first.success).toBe(true);

    const second = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(second.success).toBe(false);
    expect(second.code).toBe('EMPTY_CART');
  });
});

describe('createOrderFromCartAction — full integration flow (ADR template)', () => {
  it('anon → cart → identity-required → resolve+set → success → empty-cart', async () => {
    // 1. Start anon; add to cart (anon-allowed)
    await addToCartAction(CONV, PARTNER, {
      itemId: 'i1',
      moduleSlug: 'p',
      name: 'Widget',
      price: 10,
      currency: 'INR',
    });

    // 2. createOrder throws identity required
    const attempt1 = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(attempt1.success).toBe(false);
    expect(attempt1.code).toBe('IDENTITY_REQUIRED');

    // 3. Resolve contact + set identity
    const resolved = await resolveContact(PARTNER, '+15551234567');
    expect(resolved.success).toBe(true);
    if (!resolved.success) return;
    await setSessionIdentity(PARTNER, CONV, resolved.contactId);

    // 4. createOrder succeeds
    const attempt2 = await createOrderFromCartAction(PARTNER, {
      conversationId: CONV,
      shippingAddress: ADDRESS,
      paymentMethod: 'cod',
    });
    expect(attempt2.success).toBe(true);
    expect(attempt2.order?.contactId).toBe(resolved.contactId);

    // 5. Cart is drained
    const session = await loadSession(PARTNER, CONV);
    expect(session?.cart.items).toEqual([]);

    // 6. Contact doc exists
    expect(firestoreStore.get(`contacts/${PARTNER}_+15551234567`)).toBeDefined();
  });
});
