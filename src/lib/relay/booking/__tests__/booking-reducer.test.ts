// P3.M01 booking reducer tests (pure — no Firestore).

import { describe, it, expect } from 'vitest';
import {
  addBookingHold,
  extendBookingHold,
  releaseBookingHold,
  pruneExpiredHolds,
  BookingHoldConflictError,
  BookingHoldLimitError,
} from '../booking-reducer';
import { BOOKING_HOLD_TTL_MS, MAX_CONCURRENT_HOLDS } from '../constants';
import type { RelaySessionBookingHold } from '../../session-types';

const NOW = new Date('2026-04-20T12:00:00.000Z');
const LATER = new Date('2026-04-20T12:30:00.000Z'); // 30min later, past 15min TTL

function makeInput(overrides: Partial<{
  holdId: string;
  resourceId: string;
  moduleItemId: string;
  startAt: string;
  endAt: string;
  metadata: Record<string, unknown>;
}> = {}) {
  return {
    holdId: 'h1',
    resourceId: 'room_101',
    moduleItemId: 'mi_101',
    startAt: '2026-04-21T10:00:00.000Z',
    endAt: '2026-04-21T11:00:00.000Z',
    ...overrides,
  };
}

describe('addBookingHold', () => {
  it('adds to an empty group; hold has correct TTL', () => {
    const group = addBookingHold(undefined, makeInput(), NOW);
    expect(group.holds).toHaveLength(1);
    const h = group.holds![0];
    expect(h.holdId).toBe('h1');
    expect(h.createdAt).toBe(NOW.toISOString());
    expect(Date.parse(h.holdExpiresAt) - NOW.getTime()).toBe(BOOKING_HOLD_TTL_MS);
  });

  it('preserves existing booking.slots when adding a hold', () => {
    const base = {
      slots: [
        {
          slotId: 's1',
          serviceId: 'svc',
          serviceName: 'Cut',
          date: '2026-04-21',
          time: '10:00',
          duration: 30,
          price: 50,
          status: 'tentative' as const,
          reservedAt: NOW.toISOString(),
        },
      ],
    };
    const group = addBookingHold(base, makeInput(), NOW);
    expect(group.slots).toHaveLength(1);
    expect(group.slots[0].slotId).toBe('s1');
    expect(group.holds).toHaveLength(1);
  });

  it('idempotent on same holdId: refreshes TTL, leaves count at 1', () => {
    let group = addBookingHold(undefined, makeInput(), NOW);
    const firstExpiry = group.holds![0].holdExpiresAt;

    const laterNow = new Date(NOW.getTime() + 60_000);
    group = addBookingHold(group, makeInput(), laterNow);
    expect(group.holds).toHaveLength(1);
    expect(group.holds![0].holdExpiresAt).not.toBe(firstExpiry);
  });

  it('different holdId same resource overlapping interval: throws conflict', () => {
    let group = addBookingHold(undefined, makeInput({ holdId: 'a' }), NOW);
    expect(() =>
      addBookingHold(
        group,
        makeInput({
          holdId: 'b',
          startAt: '2026-04-21T10:30:00.000Z',
          endAt: '2026-04-21T11:30:00.000Z',
        }),
        NOW,
      ),
    ).toThrow(BookingHoldConflictError);
  });

  it('different holdId same resource non-overlapping interval: accepted', () => {
    let group = addBookingHold(undefined, makeInput({ holdId: 'a' }), NOW);
    group = addBookingHold(
      group,
      makeInput({
        holdId: 'b',
        startAt: '2026-04-21T12:00:00.000Z',
        endAt: '2026-04-21T13:00:00.000Z',
      }),
      NOW,
    );
    expect(group.holds).toHaveLength(2);
  });

  it('different resource same interval: accepted', () => {
    let group = addBookingHold(undefined, makeInput({ holdId: 'a' }), NOW);
    group = addBookingHold(
      group,
      makeInput({ holdId: 'b', resourceId: 'room_102' }),
      NOW,
    );
    expect(group.holds).toHaveLength(2);
  });

  it('MAX_CONCURRENT_HOLDS limit: 6th hold throws BookingHoldLimitError', () => {
    let group = undefined as any;
    for (let i = 0; i < MAX_CONCURRENT_HOLDS; i++) {
      group = addBookingHold(
        group,
        makeInput({
          holdId: `h${i}`,
          resourceId: `room_${i}`,
        }),
        NOW,
      );
    }
    expect(() =>
      addBookingHold(
        group,
        makeInput({ holdId: 'over', resourceId: 'room_extra' }),
        NOW,
      ),
    ).toThrow(BookingHoldLimitError);
  });

  it('expired holds pruned before conflict/limit checks', () => {
    // Seed group directly with 2 expired + 0 fresh
    const expiredHold: RelaySessionBookingHold = {
      holdId: 'exp1',
      resourceId: 'room_101',
      moduleItemId: 'mi_1',
      startAt: '2026-04-21T10:00:00.000Z',
      endAt: '2026-04-21T11:00:00.000Z',
      createdAt: NOW.toISOString(),
      holdExpiresAt: NOW.toISOString(), // already expired at NOW
    };
    const group = { slots: [], holds: [expiredHold, { ...expiredHold, holdId: 'exp2' }] };

    const updated = addBookingHold(group, makeInput({ holdId: 'fresh' }), LATER);
    // Both expired pruned; fresh added — but fresh has same resourceId as exp1,
    // which was pruned, so no conflict.
    expect(updated.holds).toHaveLength(1);
    expect(updated.holds![0].holdId).toBe('fresh');
  });
});

describe('extendBookingHold', () => {
  it('resets holdExpiresAt to now + TTL', () => {
    let group = addBookingHold(undefined, makeInput(), NOW);
    const firstExpiry = group.holds![0].holdExpiresAt;

    const later = new Date(NOW.getTime() + 5 * 60_000);
    group = extendBookingHold(group, 'h1', later);
    expect(group.holds![0].holdExpiresAt).toBe(
      new Date(later.getTime() + BOOKING_HOLD_TTL_MS).toISOString(),
    );
    expect(group.holds![0].holdExpiresAt).not.toBe(firstExpiry);
  });

  it('silent no-op when holdId not found', () => {
    let group = addBookingHold(undefined, makeInput({ holdId: 'real' }), NOW);
    group = extendBookingHold(group, 'does-not-exist', NOW);
    expect(group.holds).toHaveLength(1);
    expect(group.holds![0].holdId).toBe('real');
  });

  it('prunes expired alongside extend', () => {
    const expired: RelaySessionBookingHold = {
      holdId: 'exp',
      resourceId: 'r',
      moduleItemId: 'm',
      startAt: 's',
      endAt: 'e',
      createdAt: NOW.toISOString(),
      holdExpiresAt: NOW.toISOString(),
    };
    const group = extendBookingHold({ slots: [], holds: [expired] }, 'exp', LATER);
    // Expired pruned; extend targeted a hold that no longer exists post-sweep
    expect(group.holds).toHaveLength(0);
  });
});

describe('releaseBookingHold', () => {
  it('removes targeted hold; others preserved', () => {
    let group = addBookingHold(undefined, makeInput({ holdId: 'a' }), NOW);
    group = addBookingHold(group, makeInput({ holdId: 'b', resourceId: 'r2' }), NOW);
    group = releaseBookingHold(group, 'a', NOW);
    expect(group.holds).toHaveLength(1);
    expect(group.holds![0].holdId).toBe('b');
  });

  it('silent no-op when holdId not found', () => {
    let group = addBookingHold(undefined, makeInput({ holdId: 'real' }), NOW);
    group = releaseBookingHold(group, 'does-not-exist', NOW);
    expect(group.holds).toHaveLength(1);
  });

  it('releasing last hold leaves holds: []', () => {
    let group = addBookingHold(undefined, makeInput(), NOW);
    group = releaseBookingHold(group, 'h1', NOW);
    expect(group.holds).toEqual([]);
  });
});

describe('pruneExpiredHolds', () => {
  it('drops expired, keeps fresh', () => {
    const expired: RelaySessionBookingHold = {
      holdId: 'exp', resourceId: 'r', moduleItemId: 'm',
      startAt: 's', endAt: 'e',
      createdAt: NOW.toISOString(),
      holdExpiresAt: NOW.toISOString(),
    };
    const fresh: RelaySessionBookingHold = {
      ...expired,
      holdId: 'fresh',
      holdExpiresAt: new Date(LATER.getTime() + 60_000).toISOString(),
    };
    const result = pruneExpiredHolds([expired, fresh], LATER);
    expect(result).toHaveLength(1);
    expect(result[0].holdId).toBe('fresh');
  });

  it('empty input returns empty', () => {
    expect(pruneExpiredHolds([], NOW)).toEqual([]);
  });
});
