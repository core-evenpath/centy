// M03 follow-up: space_confirmation data loader tests.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import {
  loadSpaceConfirmationData,
  SPACE_CONFIRMATION_BLOCK_IDS,
  type SpaceConfirmationItem,
} from '../space-confirmation-data';

const PARTNER = 'p1';
const PHONE = '+15551234567';
const OTHER = '+15559999999';

beforeEach(() => {
  resetFirestoreMock();
});

function seedReservation(
  partnerId: string,
  reservationId: string,
  overrides: Partial<SpaceConfirmationItem>,
): void {
  const base: SpaceConfirmationItem = {
    reservationId,
    partnerId,
    contactId: PHONE,
    conversationId: 'c',
    status: 'confirmed',
    createdAt: '2026-04-21T10:00:00.000Z',
    hold: {
      holdId: 'h',
      resourceId: 'room_101',
      moduleItemId: 'mi_101',
      checkIn: '2026-05-01',
      checkOut: '2026-05-04',
    },
  };
  const item: SpaceConfirmationItem = { ...base, ...overrides };
  firestoreStore.set(`partners/${partnerId}/relayReservations/${reservationId}`, {
    id: reservationId,
    data: item as unknown as Record<string, unknown>,
  });
}

describe('loadSpaceConfirmationData', () => {
  it('returns empty list on null contactId (anon)', async () => {
    const data = await loadSpaceConfirmationData(PARTNER, null);
    expect(data.reservations).toEqual([]);
  });

  it('returns empty list when contact has no reservations', async () => {
    const data = await loadSpaceConfirmationData(PARTNER, PHONE);
    expect(data.reservations).toEqual([]);
  });

  it('returns matching reservations with correct shape', async () => {
    seedReservation(PARTNER, 'rv_ABCDEF', {
      contactId: PHONE,
      hold: {
        holdId: 'h1',
        resourceId: 'room_201',
        moduleItemId: 'mi_201',
        checkIn: '2026-06-10',
        checkOut: '2026-06-15',
      },
    });
    const data = await loadSpaceConfirmationData(PARTNER, PHONE);
    expect(data.reservations).toHaveLength(1);
    expect(data.reservations[0].reservationId).toBe('rv_ABCDEF');
    expect(data.reservations[0].hold.checkIn).toBe('2026-06-10');
    expect(data.reservations[0].hold.checkOut).toBe('2026-06-15');
  });

  it('excludes reservations for other contacts', async () => {
    seedReservation(PARTNER, 'mine_1', { contactId: PHONE });
    seedReservation(PARTNER, 'theirs_1', { contactId: OTHER });
    const data = await loadSpaceConfirmationData(PARTNER, PHONE);
    expect(data.reservations).toHaveLength(1);
    expect(data.reservations[0].reservationId).toBe('mine_1');
  });

  it('excludes reservations from other partners', async () => {
    seedReservation(PARTNER, 'mine_p1', { contactId: PHONE, partnerId: PARTNER });
    seedReservation('p2', 'mine_p2', { contactId: PHONE, partnerId: 'p2' });
    const data = await loadSpaceConfirmationData(PARTNER, PHONE);
    expect(data.reservations).toHaveLength(1);
    expect(data.reservations[0].reservationId).toBe('mine_p1');
  });

  it('caps results at 5 most recent', async () => {
    for (let i = 0; i < 7; i++) {
      seedReservation(PARTNER, `rv_${i}`, {
        contactId: PHONE,
        createdAt: `2026-04-21T${String(10 + i).padStart(2, '0')}:00:00.000Z`,
      });
    }
    const data = await loadSpaceConfirmationData(PARTNER, PHONE);
    expect(data.reservations).toHaveLength(5);
  });

  it('block-id whitelist contains space_confirmation only', () => {
    expect(SPACE_CONFIRMATION_BLOCK_IDS.has('space_confirmation')).toBe(true);
    expect(SPACE_CONFIRMATION_BLOCK_IDS.has('booking_confirmation')).toBe(false);
    expect(SPACE_CONFIRMATION_BLOCK_IDS.has('order_tracker')).toBe(false);
  });
});
