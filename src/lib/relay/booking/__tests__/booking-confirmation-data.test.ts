// M03 follow-up: booking_confirmation data loader tests.
// Mirrors order-tracker-data.test.ts.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import {
  loadBookingConfirmationData,
  BOOKING_CONFIRMATION_BLOCK_IDS,
  type BookingConfirmationItem,
} from '../booking-confirmation-data';

const PARTNER = 'p1';
const PHONE = '+15551234567';
const OTHER = '+15559999999';

beforeEach(() => {
  resetFirestoreMock();
});

function seedBooking(
  partnerId: string,
  bookingId: string,
  overrides: Partial<BookingConfirmationItem>,
): void {
  const base: BookingConfirmationItem = {
    bookingId,
    partnerId,
    contactId: PHONE,
    conversationId: 'c',
    status: 'confirmed',
    createdAt: '2026-04-21T10:00:00.000Z',
    hold: { resourceId: 'room_101', startAt: '2026-05-01T10:00:00.000Z', endAt: '2026-05-01T11:00:00.000Z' },
  };
  const item: BookingConfirmationItem = { ...base, ...overrides };
  firestoreStore.set(`partners/${partnerId}/relayBookings/${bookingId}`, {
    id: bookingId,
    data: item as unknown as Record<string, unknown>,
  });
}

describe('loadBookingConfirmationData', () => {
  it('returns empty list on null contactId (anon)', async () => {
    const data = await loadBookingConfirmationData(PARTNER, null);
    expect(data.bookings).toEqual([]);
  });

  it('returns empty list on undefined contactId', async () => {
    const data = await loadBookingConfirmationData(PARTNER, undefined);
    expect(data.bookings).toEqual([]);
  });

  it('returns empty list when contact has no bookings', async () => {
    const data = await loadBookingConfirmationData(PARTNER, PHONE);
    expect(data.bookings).toEqual([]);
  });

  it('returns matching bookings with correct shape', async () => {
    seedBooking(PARTNER, 'bk_ABCDEF', {
      contactId: PHONE,
      status: 'confirmed',
      createdAt: '2026-04-21T10:00:00.000Z',
    });
    const data = await loadBookingConfirmationData(PARTNER, PHONE);
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].bookingId).toBe('bk_ABCDEF');
    expect(data.bookings[0].status).toBe('confirmed');
  });

  it('excludes bookings for other contacts', async () => {
    seedBooking(PARTNER, 'mine_1', { contactId: PHONE });
    seedBooking(PARTNER, 'theirs_1', { contactId: OTHER });
    seedBooking(PARTNER, 'mine_2', { contactId: PHONE });

    const data = await loadBookingConfirmationData(PARTNER, PHONE);
    expect(data.bookings).toHaveLength(2);
    expect(data.bookings.map((b) => b.bookingId).sort()).toEqual(['mine_1', 'mine_2']);
  });

  it('excludes bookings from other partners', async () => {
    seedBooking(PARTNER, 'mine_p1', { contactId: PHONE, partnerId: PARTNER });
    seedBooking('p2', 'mine_p2', { contactId: PHONE, partnerId: 'p2' });

    const data = await loadBookingConfirmationData(PARTNER, PHONE);
    expect(data.bookings).toHaveLength(1);
    expect(data.bookings[0].bookingId).toBe('mine_p1');
  });

  it('caps results at 5 most recent', async () => {
    for (let i = 0; i < 7; i++) {
      seedBooking(PARTNER, `bk_${i}`, {
        contactId: PHONE,
        createdAt: `2026-04-21T${String(10 + i).padStart(2, '0')}:00:00.000Z`,
      });
    }
    const data = await loadBookingConfirmationData(PARTNER, PHONE);
    expect(data.bookings).toHaveLength(5);
  });

  it('block-id whitelist contains booking_confirmation only', () => {
    expect(BOOKING_CONFIRMATION_BLOCK_IDS.has('booking_confirmation')).toBe(true);
    expect(BOOKING_CONFIRMATION_BLOCK_IDS.has('order_tracker')).toBe(false);
    expect(BOOKING_CONFIRMATION_BLOCK_IDS.has('space_confirmation')).toBe(false);
  });
});
