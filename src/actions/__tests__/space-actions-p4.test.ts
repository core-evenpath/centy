// P4 space action tests — holds (anon) + confirmSpace (third consumer
// of requireIdentityOrThrow).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/lib/relay/block-config-service', () => ({
  getGlobalBlockConfigs: vi.fn(async () => []),
}));

import {
  createSpaceHoldAction,
  extendSpaceHoldAction,
  releaseSpaceHoldAction,
  confirmSpaceAction,
} from '../relay-runtime/space-actions';
import { addToCartAction } from '../relay-runtime/cart-actions';
import { createBookingHoldAction } from '../relay-runtime/booking-actions';
import {
  loadOrCreateSession,
  loadSession,
  setSessionIdentity,
} from '@/lib/relay/session-store';
import { resolveContact } from '../contact-actions';
import { invalidateHealthCache } from '@/lib/relay/health-cache';
import type { RelaySessionSpaceHold } from '@/lib/relay/session-types';

const PARTNER = 'p1';
const CONV = 'c1';
const PHONE = '+15551234567';

const BASE = {
  holdId: 'h1',
  resourceId: 'room_101',
  moduleItemId: 'mi_101',
  checkIn: '2026-05-01',
  checkOut: '2026-05-04',
};

beforeEach(() => {
  resetFirestoreMock();
  invalidateHealthCache(PARTNER);
  firestoreStore.set(`partners/${PARTNER}`, {
    id: PARTNER,
    data: { id: PARTNER, engines: [] },
  });
});

async function resolveIdentity(): Promise<string> {
  await loadOrCreateSession(PARTNER, CONV);
  const res = await resolveContact(PARTNER, PHONE);
  if (!res.success) throw new Error('resolveContact failed');
  await setSessionIdentity(PARTNER, CONV, res.contactId);
  return res.contactId;
}

// ── Hold mutations (anon-allowed) ──────────────────────────────────

describe('createSpaceHoldAction — anon + sibling preservation', () => {
  it('creates hold on anon session; identity untouched', async () => {
    const res = await createSpaceHoldAction(PARTNER, CONV, BASE);
    expect(res.success).toBe(true);
    expect(res.hold?.holdId).toBe('h1');

    const session = await loadSession(PARTNER, CONV);
    expect(session?.identity).toBeUndefined();
    expect(session?.space?.holds).toHaveLength(1);
  });

  it('space coexists with cart + booking holds (three ephemeral groups)', async () => {
    await addToCartAction(CONV, PARTNER, {
      itemId: 'i1',
      moduleSlug: 'products',
      name: 'Widget',
      price: 10,
      currency: 'INR',
    });
    await createBookingHoldAction(PARTNER, CONV, {
      holdId: 'bh1',
      resourceId: 'slot_1',
      moduleItemId: 'mi_slot',
      startAt: '2026-05-01T10:00:00.000Z',
      endAt: '2026-05-01T11:00:00.000Z',
    });
    await createSpaceHoldAction(PARTNER, CONV, BASE);

    const session = await loadSession(PARTNER, CONV);
    expect(session?.cart.items).toHaveLength(1);
    expect(session?.booking.holds).toHaveLength(1);
    expect(session?.space?.holds).toHaveLength(1);
  });

  it('surfaces SPACE_HOLD_CONFLICT from the action layer', async () => {
    await createSpaceHoldAction(PARTNER, CONV, { ...BASE, holdId: 'a' });
    const res = await createSpaceHoldAction(PARTNER, CONV, {
      ...BASE,
      holdId: 'b',
      checkIn: '2026-05-02',
      checkOut: '2026-05-05',
    });
    expect(res.success).toBe(false);
    expect(res.code).toBe('SPACE_HOLD_CONFLICT');
  });

  it('surfaces SPACE_HOLD_INVALID_RANGE from the action layer', async () => {
    const res = await createSpaceHoldAction(PARTNER, CONV, {
      ...BASE,
      checkIn: '2026-05-05',
      checkOut: '2026-05-04',
    });
    expect(res.success).toBe(false);
    expect(res.code).toBe('SPACE_HOLD_INVALID_RANGE');
  });
});

describe('extendSpaceHoldAction + releaseSpaceHoldAction', () => {
  it('extend refreshes holdExpiresAt', async () => {
    const first = await createSpaceHoldAction(PARTNER, CONV, BASE);
    const firstExpiry = first.hold!.holdExpiresAt;
    await new Promise((r) => setTimeout(r, 5));
    const second = await extendSpaceHoldAction(PARTNER, CONV, 'h1');
    expect(second.success).toBe(true);
    expect(Date.parse(second.hold!.holdExpiresAt)).toBeGreaterThan(
      Date.parse(firstExpiry),
    );
  });

  it('release drops the hold; siblings preserved', async () => {
    await createSpaceHoldAction(PARTNER, CONV, { ...BASE, holdId: 'a' });
    await createSpaceHoldAction(PARTNER, CONV, {
      ...BASE,
      holdId: 'b',
      resourceId: 'room_102',
    });
    const res = await releaseSpaceHoldAction(PARTNER, CONV, 'a');
    expect(res.space?.holds).toHaveLength(1);
    expect(res.space?.holds[0].holdId).toBe('b');
  });
});

// ── confirmSpaceAction — third requireIdentityOrThrow consumer ─────

describe('confirmSpaceAction — gates', () => {
  it('IDENTITY_REQUIRED on anon session with hold', async () => {
    await createSpaceHoldAction(PARTNER, CONV, BASE);
    const res = await confirmSpaceAction(PARTNER, CONV, 'h1');
    expect(res.success).toBe(false);
    expect(res.code).toBe('IDENTITY_REQUIRED');
  });

  it('HOLD_MISSING_OR_EXPIRED on unknown holdId', async () => {
    await resolveIdentity();
    const res = await confirmSpaceAction(PARTNER, CONV, 'missing');
    expect(res.success).toBe(false);
    expect(res.code).toBe('HOLD_MISSING_OR_EXPIRED');
  });

  it('HOLD_MISSING_OR_EXPIRED on expired hold (on-read prune)', async () => {
    await resolveIdentity();
    const expired: RelaySessionSpaceHold = {
      holdId: 'exp1',
      resourceId: 'r',
      moduleItemId: 'm',
      checkIn: '2026-05-01',
      checkOut: '2026-05-02',
      createdAt: new Date().toISOString(),
      holdExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    };
    const sessionPath = `relaySessions/${PARTNER}_${CONV}`;
    const existing = firestoreStore.get(sessionPath);
    firestoreStore.set(sessionPath, {
      id: existing!.id,
      data: {
        ...(existing!.data as Record<string, unknown>),
        space: { holds: [expired] },
      },
    });
    const res = await confirmSpaceAction(PARTNER, CONV, 'exp1');
    expect(res.success).toBe(false);
    expect(res.code).toBe('HOLD_MISSING_OR_EXPIRED');
  });

  it('HEALTH_RED on red engine', async () => {
    firestoreStore.set(`partners/${PARTNER}`, {
      id: PARTNER,
      data: { id: PARTNER, engines: ['booking'] },
    });
    const { recomputeEngineHealth } = await import('../relay-health-actions');
    await recomputeEngineHealth(PARTNER, 'booking');

    await resolveIdentity();
    await createSpaceHoldAction(PARTNER, CONV, BASE);

    const res = await confirmSpaceAction(PARTNER, CONV, 'h1');
    expect(res.success).toBe(false);
    expect(res.code).toBe('HEALTH_RED');
  });
});

describe('confirmSpaceAction — happy path', () => {
  it('writes reservation with contactId; releases hold; siblings preserved', async () => {
    const contactId = await resolveIdentity();
    await createSpaceHoldAction(PARTNER, CONV, BASE);

    const res = await confirmSpaceAction(PARTNER, CONV, 'h1');
    expect(res.success).toBe(true);
    expect(res.reservationId).toMatch(/^rv_/);

    const doc = firestoreStore.get(
      `partners/${PARTNER}/relayReservations/${res.reservationId}`,
    );
    expect(doc).toBeDefined();
    const data = doc!.data as Record<string, unknown>;
    expect(data.contactId).toBe(contactId);
    expect(data.status).toBe('confirmed');
    expect((data.hold as typeof BASE).resourceId).toBe('room_101');

    const session = await loadSession(PARTNER, CONV);
    expect(session?.space?.holds).toEqual([]);
    expect(session?.identity?.contactId).toBe(contactId);
  });

  it('other holds preserved when confirming one', async () => {
    await resolveIdentity();
    await createSpaceHoldAction(PARTNER, CONV, { ...BASE, holdId: 'keep', resourceId: 'r2' });
    await createSpaceHoldAction(PARTNER, CONV, { ...BASE, holdId: 'commit' });

    const res = await confirmSpaceAction(PARTNER, CONV, 'commit');
    expect(res.success).toBe(true);

    const session = await loadSession(PARTNER, CONV);
    expect(session?.space?.holds).toHaveLength(1);
    expect(session?.space?.holds[0].holdId).toBe('keep');
  });
});

// ── End-to-end integration (third instance of the ADR template) ───

describe('confirmSpaceAction — full integration flow', () => {
  it('anon → space hold → identity-required → resolve+set → success → drained', async () => {
    // 1. Anon; create space hold (anon-allowed)
    const hold = await createSpaceHoldAction(PARTNER, CONV, BASE);
    expect(hold.success).toBe(true);

    // 2. Confirm throws identity required
    const a1 = await confirmSpaceAction(PARTNER, CONV, 'h1');
    expect(a1.code).toBe('IDENTITY_REQUIRED');

    // 3. Resolve + set
    const r = await resolveContact(PARTNER, PHONE);
    expect(r.success).toBe(true);
    if (!r.success) return;
    await setSessionIdentity(PARTNER, CONV, r.contactId);

    // 4. Confirm succeeds
    const a2 = await confirmSpaceAction(PARTNER, CONV, 'h1');
    expect(a2.success).toBe(true);

    // 5. Hold released
    const session = await loadSession(PARTNER, CONV);
    expect(session?.space?.holds).toEqual([]);

    // 6. Contact doc exists
    expect(firestoreStore.get(`contacts/${PARTNER}_${PHONE}`)).toBeDefined();
  });
});
