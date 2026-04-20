// P4.M01 space reducer tests (pure — no Firestore).

import { describe, it, expect } from 'vitest';
import {
  addSpaceHold,
  extendSpaceHold,
  releaseSpaceHold,
  pruneExpiredSpaceHolds,
  SpaceHoldConflictError,
  SpaceHoldInvalidRangeError,
  SpaceHoldLimitError,
} from '../space-reducer';
import {
  SPACE_HOLD_TTL_MS,
  MAX_CONCURRENT_SPACE_HOLDS,
} from '../constants';
import type { RelaySessionSpaceHold } from '../../session-types';

const NOW = new Date('2026-04-20T12:00:00.000Z');
const LATER = new Date('2026-04-20T12:30:00.000Z'); // past 15min TTL

function makeInput(
  overrides: Partial<{
    holdId: string;
    resourceId: string;
    moduleItemId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    metadata: Record<string, unknown>;
  }> = {},
) {
  return {
    holdId: 'h1',
    resourceId: 'room_101',
    moduleItemId: 'mi_101',
    checkIn: '2026-05-01',
    checkOut: '2026-05-04',
    ...overrides,
  };
}

describe('addSpaceHold — happy', () => {
  it('adds to empty group with correct TTL', () => {
    const group = addSpaceHold(undefined, makeInput(), NOW);
    expect(group.holds).toHaveLength(1);
    const h = group.holds[0];
    expect(h.holdId).toBe('h1');
    expect(h.checkIn).toBe('2026-05-01');
    expect(h.checkOut).toBe('2026-05-04');
    expect(Date.parse(h.holdExpiresAt) - NOW.getTime()).toBe(SPACE_HOLD_TTL_MS);
  });

  it('idempotent on same holdId: refreshes TTL', () => {
    let group = addSpaceHold(undefined, makeInput(), NOW);
    const firstExpiry = group.holds[0].holdExpiresAt;

    const later = new Date(NOW.getTime() + 60_000);
    group = addSpaceHold(group, makeInput(), later);
    expect(group.holds).toHaveLength(1);
    expect(group.holds[0].holdExpiresAt).not.toBe(firstExpiry);
  });

  it('different holdId, non-overlapping dates: accepted', () => {
    let group = addSpaceHold(undefined, makeInput({ holdId: 'a' }), NOW);
    group = addSpaceHold(
      group,
      makeInput({
        holdId: 'b',
        checkIn: '2026-05-04',
        checkOut: '2026-05-07',
      }),
      NOW,
    );
    expect(group.holds).toHaveLength(2);
  });

  it('different resource, same dates: accepted', () => {
    let group = addSpaceHold(undefined, makeInput({ holdId: 'a' }), NOW);
    group = addSpaceHold(
      group,
      makeInput({ holdId: 'b', resourceId: 'room_102' }),
      NOW,
    );
    expect(group.holds).toHaveLength(2);
  });
});

describe('addSpaceHold — conflict + limit + validation', () => {
  it('same resource overlapping dates, different holdId: throws conflict', () => {
    let group = addSpaceHold(undefined, makeInput({ holdId: 'a' }), NOW);
    expect(() =>
      addSpaceHold(
        group,
        makeInput({
          holdId: 'b',
          checkIn: '2026-05-02',
          checkOut: '2026-05-05',
        }),
        NOW,
      ),
    ).toThrow(SpaceHoldConflictError);
  });

  it('adjacent ranges (checkOut == next checkIn) are NOT a conflict', () => {
    // Half-open semantics: room occupied [checkIn, checkOut) —
    // guest A checks out morning of 05-04; guest B checks in 05-04.
    let group = addSpaceHold(
      undefined,
      makeInput({ holdId: 'a', checkIn: '2026-05-01', checkOut: '2026-05-04' }),
      NOW,
    );
    group = addSpaceHold(
      group,
      makeInput({ holdId: 'b', checkIn: '2026-05-04', checkOut: '2026-05-07' }),
      NOW,
    );
    expect(group.holds).toHaveLength(2);
  });

  it('MAX_CONCURRENT_SPACE_HOLDS limit enforced', () => {
    let group = undefined as any;
    for (let i = 0; i < MAX_CONCURRENT_SPACE_HOLDS; i++) {
      group = addSpaceHold(
        group,
        makeInput({ holdId: `h${i}`, resourceId: `room_${i}` }),
        NOW,
      );
    }
    expect(() =>
      addSpaceHold(
        group,
        makeInput({ holdId: 'over', resourceId: 'room_extra' }),
        NOW,
      ),
    ).toThrow(SpaceHoldLimitError);
  });

  it('invalid date format throws SpaceHoldInvalidRangeError', () => {
    expect(() =>
      addSpaceHold(undefined, makeInput({ checkIn: '05/01/2026' }), NOW),
    ).toThrow(SpaceHoldInvalidRangeError);
  });

  it('checkIn >= checkOut throws SpaceHoldInvalidRangeError', () => {
    expect(() =>
      addSpaceHold(
        undefined,
        makeInput({ checkIn: '2026-05-04', checkOut: '2026-05-04' }),
        NOW,
      ),
    ).toThrow(SpaceHoldInvalidRangeError);
    expect(() =>
      addSpaceHold(
        undefined,
        makeInput({ checkIn: '2026-05-05', checkOut: '2026-05-04' }),
        NOW,
      ),
    ).toThrow(SpaceHoldInvalidRangeError);
  });

  it('expired holds pruned before conflict/limit checks', () => {
    const expired: RelaySessionSpaceHold = {
      holdId: 'exp',
      resourceId: 'room_101',
      moduleItemId: 'mi',
      checkIn: '2026-05-01',
      checkOut: '2026-05-04',
      createdAt: NOW.toISOString(),
      holdExpiresAt: NOW.toISOString(),
    };
    const group = { holds: [expired] };
    // LATER is past the TTL; conflict path would fire on exp, but it's swept
    const updated = addSpaceHold(group, makeInput({ holdId: 'fresh' }), LATER);
    expect(updated.holds).toHaveLength(1);
    expect(updated.holds[0].holdId).toBe('fresh');
  });
});

describe('extendSpaceHold', () => {
  it('refreshes holdExpiresAt', () => {
    let group = addSpaceHold(undefined, makeInput(), NOW);
    const first = group.holds[0].holdExpiresAt;
    const later = new Date(NOW.getTime() + 5 * 60_000);
    group = extendSpaceHold(group, 'h1', later);
    expect(group.holds[0].holdExpiresAt).toBe(
      new Date(later.getTime() + SPACE_HOLD_TTL_MS).toISOString(),
    );
    expect(group.holds[0].holdExpiresAt).not.toBe(first);
  });

  it('silent no-op on unknown holdId', () => {
    let group = addSpaceHold(undefined, makeInput({ holdId: 'real' }), NOW);
    group = extendSpaceHold(group, 'nope', NOW);
    expect(group.holds).toHaveLength(1);
    expect(group.holds[0].holdId).toBe('real');
  });
});

describe('releaseSpaceHold', () => {
  it('removes targeted hold, preserves siblings', () => {
    let group = addSpaceHold(undefined, makeInput({ holdId: 'a' }), NOW);
    group = addSpaceHold(
      group,
      makeInput({ holdId: 'b', resourceId: 'r2' }),
      NOW,
    );
    group = releaseSpaceHold(group, 'a', NOW);
    expect(group.holds).toHaveLength(1);
    expect(group.holds[0].holdId).toBe('b');
  });

  it('release last leaves holds: []', () => {
    let group = addSpaceHold(undefined, makeInput(), NOW);
    group = releaseSpaceHold(group, 'h1', NOW);
    expect(group.holds).toEqual([]);
  });
});

describe('pruneExpiredSpaceHolds', () => {
  it('drops expired, keeps fresh', () => {
    const expired: RelaySessionSpaceHold = {
      holdId: 'exp',
      resourceId: 'r',
      moduleItemId: 'm',
      checkIn: '2026-05-01',
      checkOut: '2026-05-02',
      createdAt: NOW.toISOString(),
      holdExpiresAt: NOW.toISOString(),
    };
    const fresh: RelaySessionSpaceHold = {
      ...expired,
      holdId: 'fresh',
      holdExpiresAt: new Date(LATER.getTime() + 60_000).toISOString(),
    };
    expect(pruneExpiredSpaceHolds([expired, fresh], LATER)).toEqual([fresh]);
  });
});
