// P3.M02 confirmBookingAction tests — dual-path + three-gate.
//
// Covers both the new hold-flow (when holdId supplied) and the legacy
// slot-flow (when omitted). Both paths share the Health + Identity
// gates. Typed error codes surface via ConfirmBookingResult.code.

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
  confirmBookingAction,
  createBookingHoldAction,
  reserveSlotAction,
} from '../relay-runtime/booking-actions';
import {
  loadOrCreateSession,
  loadSession,
  setSessionIdentity,
} from '@/lib/relay/session-store';
import { resolveContact } from '../contact-actions';
import { invalidateHealthCache } from '@/lib/relay/health-cache';
import { BOOKING_HOLD_TTL_MS } from '@/lib/relay/booking/constants';
import type { RelaySessionBookingHold } from '@/lib/relay/session-types';

const PARTNER = 'p1';
const CONV = 'c1';
const PHONE = '+15551234567';

const BASE_HOLD = {
  holdId: 'h1',
  resourceId: 'room_101',
  moduleItemId: 'mi_101',
  startAt: '2026-04-21T10:00:00.000Z',
  endAt: '2026-04-21T11:00:00.000Z',
};

const BASE_SLOT = {
  slotId: 's1',
  serviceId: 'svc1',
  serviceName: 'Cut',
  date: '2026-04-21',
  time: '10:00',
  duration: 30,
  price: 50,
};

beforeEach(() => {
  resetFirestoreMock();
  invalidateHealthCache(PARTNER);
  // Empty engines → save gate allows with reason=no-engines
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

// ── Hold-flow ──────────────────────────────────────────────────────

describe('confirmBookingAction — hold-flow gates', () => {
  it('IDENTITY_REQUIRED on anon session with hold', async () => {
    await createBookingHoldAction(PARTNER, CONV, BASE_HOLD);
    const res = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(res.success).toBe(false);
    expect(res.code).toBe('IDENTITY_REQUIRED');
  });

  it('HOLD_MISSING_OR_EXPIRED when holdId unknown', async () => {
    await resolveIdentity();
    const res = await confirmBookingAction(CONV, PARTNER, 'does-not-exist');
    expect(res.success).toBe(false);
    expect(res.code).toBe('HOLD_MISSING_OR_EXPIRED');
  });

  it('HOLD_MISSING_OR_EXPIRED when hold already expired (on-read prune)', async () => {
    await resolveIdentity();
    // Seed an expired hold directly
    const expiredHold: RelaySessionBookingHold = {
      holdId: 'exp1',
      resourceId: 'r',
      moduleItemId: 'm',
      startAt: 's',
      endAt: 'e',
      createdAt: new Date().toISOString(),
      holdExpiresAt: new Date(Date.now() - 60_000).toISOString(),
    };
    const sessionPath = `relaySessions/${PARTNER}_${CONV}`;
    const existing = firestoreStore.get(sessionPath);
    firestoreStore.set(sessionPath, {
      id: existing!.id,
      data: {
        ...(existing!.data as Record<string, unknown>),
        booking: {
          slots: [],
          holds: [expiredHold],
        },
      },
    });

    const res = await confirmBookingAction(CONV, PARTNER, 'exp1');
    expect(res.success).toBe(false);
    expect(res.code).toBe('HOLD_MISSING_OR_EXPIRED');
  });

  it('HEALTH_RED when engine red (precedes PII ask)', async () => {
    firestoreStore.set(`partners/${PARTNER}`, {
      id: PARTNER,
      data: { id: PARTNER, engines: ['booking'] },
    });
    const { recomputeEngineHealth } = await import('../relay-health-actions');
    await recomputeEngineHealth(PARTNER, 'booking');

    await resolveIdentity();
    await createBookingHoldAction(PARTNER, CONV, BASE_HOLD);

    const res = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(res.success).toBe(false);
    expect(res.code).toBe('HEALTH_RED');
  });
});

describe('confirmBookingAction — hold-flow happy path', () => {
  it('confirms hold, writes booking doc with contactId, releases hold', async () => {
    const contactId = await resolveIdentity();
    await createBookingHoldAction(PARTNER, CONV, BASE_HOLD);

    const res = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(res.success).toBe(true);
    expect(res.bookingId).toMatch(/^bk_/);

    // Booking doc persisted with contactId + hold snapshot
    const bookingDoc = firestoreStore.get(
      `partners/${PARTNER}/relayBookings/${res.bookingId}`,
    );
    expect(bookingDoc).toBeDefined();
    const data = bookingDoc!.data as Record<string, unknown>;
    expect(data.contactId).toBe(contactId);
    expect(data.status).toBe('confirmed');
    expect((data.hold as typeof BASE_HOLD).resourceId).toBe('room_101');

    // Session hold released, identity preserved, other sub-objects intact
    const session = await loadSession(PARTNER, CONV);
    expect(session?.booking.holds).toEqual([]);
    expect(session?.identity?.contactId).toBe(contactId);
  });

  it('other holds preserved when confirming one', async () => {
    await resolveIdentity();
    await createBookingHoldAction(PARTNER, CONV, { ...BASE_HOLD, holdId: 'keep', resourceId: 'r2' });
    await createBookingHoldAction(PARTNER, CONV, { ...BASE_HOLD, holdId: 'commit' });

    const res = await confirmBookingAction(CONV, PARTNER, 'commit');
    expect(res.success).toBe(true);

    const session = await loadSession(PARTNER, CONV);
    expect(session?.booking.holds).toHaveLength(1);
    expect(session?.booking.holds![0].holdId).toBe('keep');
  });

  it('second confirm with same holdId: HOLD_MISSING (already released)', async () => {
    await resolveIdentity();
    await createBookingHoldAction(PARTNER, CONV, BASE_HOLD);

    const first = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(first.success).toBe(true);

    const second = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(second.success).toBe(false);
    expect(second.code).toBe('HOLD_MISSING_OR_EXPIRED');
  });
});

// ── Slot-flow (legacy path — gated but preserved) ─────────────────

describe('confirmBookingAction — slot-flow (legacy path)', () => {
  it('IDENTITY_REQUIRED on anon session with tentative slots', async () => {
    await reserveSlotAction(CONV, PARTNER, BASE_SLOT);
    const res = await confirmBookingAction(CONV, PARTNER);
    expect(res.success).toBe(false);
    expect(res.code).toBe('IDENTITY_REQUIRED');
  });

  it('NO_TENTATIVE_SLOTS when identity resolved but no slots', async () => {
    await resolveIdentity();
    const res = await confirmBookingAction(CONV, PARTNER);
    expect(res.success).toBe(false);
    expect(res.code).toBe('NO_TENTATIVE_SLOTS');
  });

  it('happy path: tentatives flipped to confirmed, booking doc written with contactId', async () => {
    const contactId = await resolveIdentity();
    await reserveSlotAction(CONV, PARTNER, BASE_SLOT);

    const res = await confirmBookingAction(CONV, PARTNER);
    expect(res.success).toBe(true);

    const bookingDoc = firestoreStore.get(
      `partners/${PARTNER}/relayBookings/${res.bookingId}`,
    );
    expect(bookingDoc).toBeDefined();
    const data = bookingDoc!.data as Record<string, unknown>;
    expect(data.contactId).toBe(contactId);

    const session = await loadSession(PARTNER, CONV);
    expect(session?.booking.slots[0].status).toBe('confirmed');
  });
});

// ── End-to-end integration (ADR template) ─────────────────────────

describe('confirmBookingAction — full integration flow', () => {
  it('anon → hold → identity-required → resolve+set → success → drained', async () => {
    // 1. Anon; create hold (anon-allowed)
    const createRes = await createBookingHoldAction(PARTNER, CONV, BASE_HOLD);
    expect(createRes.success).toBe(true);

    // 2. Confirm throws identity required
    const attempt1 = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(attempt1.success).toBe(false);
    expect(attempt1.code).toBe('IDENTITY_REQUIRED');

    // 3. Resolve contact + set identity
    const resolved = await resolveContact(PARTNER, PHONE);
    expect(resolved.success).toBe(true);
    if (!resolved.success) return;
    await setSessionIdentity(PARTNER, CONV, resolved.contactId);

    // 4. Confirm succeeds
    const attempt2 = await confirmBookingAction(CONV, PARTNER, 'h1');
    expect(attempt2.success).toBe(true);
    expect(attempt2.bookingId).toBeDefined();

    // 5. Hold released
    const session = await loadSession(PARTNER, CONV);
    expect(session?.booking.holds).toEqual([]);

    // 6. Contact doc exists
    expect(firestoreStore.get(`contacts/${PARTNER}_${PHONE}`)).toBeDefined();
  });
});
