// P4.M01 pure space-holds reducer.
//
// Mirrors the booking-reducer.ts shape from P3.M01, with date-range
// semantics instead of slot-time-range. `checkIn` / `checkOut` are
// YYYY-MM-DD date strings; overlap detection uses date arithmetic
// without timezone tagging (spaces are a full-day resource lockout).
//
// On-read + on-write hybrid expiry: every reducer op calls
// `pruneExpiredSpaceHolds` at entry, and the M03 data loader (deferred)
// prunes on read. No background cron — same invariant as booking.
//
// Single-writer discipline: only space actions write holds via
// `setSessionSpace`; Firestore I/O happens in the action layer.

import type {
  RelaySessionSpace,
  RelaySessionSpaceHold,
} from '../session-types';
import {
  MAX_CONCURRENT_SPACE_HOLDS,
  SPACE_HOLD_TTL_MS,
} from './constants';

export class SpaceHoldConflictError extends Error {
  readonly code = 'SPACE_HOLD_CONFLICT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'SpaceHoldConflictError';
  }
}

export class SpaceHoldLimitError extends Error {
  readonly code = 'SPACE_HOLD_LIMIT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'SpaceHoldLimitError';
  }
}

export class SpaceHoldInvalidRangeError extends Error {
  readonly code = 'SPACE_HOLD_INVALID_RANGE' as const;
  constructor(message: string) {
    super(message);
    this.name = 'SpaceHoldInvalidRangeError';
  }
}

export interface SpaceHoldInput {
  holdId: string;
  resourceId: string;
  moduleItemId: string;
  checkIn: string;
  checkOut: string;
  guestCount?: number;
  metadata?: Record<string, unknown>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00.000Z`);
  return Number.isFinite(t);
}

/**
 * Date-range overlap using half-open intervals `[checkIn, checkOut)`.
 * A check-in on Tue and check-out on Wed occupies Tue night only; a
 * new hold checking in on Wed does NOT overlap.
 */
function rangesOverlap(
  aIn: string,
  aOut: string,
  bIn: string,
  bOut: string,
): boolean {
  return aIn < bOut && bIn < aOut;
}

/**
 * Drop expired holds. Same semantics as booking's `pruneExpiredHolds`.
 */
export function pruneExpiredSpaceHolds(
  holds: readonly RelaySessionSpaceHold[],
  now: Date = new Date(),
): RelaySessionSpaceHold[] {
  const nowMs = now.getTime();
  return holds.filter((h) => Date.parse(h.holdExpiresAt) > nowMs);
}

function base(group: RelaySessionSpace | undefined | null): RelaySessionSpace {
  return group ?? { holds: [] };
}

/**
 * Add (or idempotently update) a space hold. Throws on:
 *   - invalid date format (not YYYY-MM-DD) or checkIn >= checkOut
 *   - same-resource overlapping range with a different holdId
 *   - MAX_CONCURRENT_SPACE_HOLDS exceeded after sweep
 *
 * Same-holdId calls refresh `holdExpiresAt` and `createdAt` in place.
 */
export function addSpaceHold(
  group: RelaySessionSpace | undefined | null,
  input: SpaceHoldInput,
  now: Date = new Date(),
): RelaySessionSpace {
  if (!isValidDate(input.checkIn) || !isValidDate(input.checkOut)) {
    throw new SpaceHoldInvalidRangeError(
      `checkIn (${input.checkIn}) and checkOut (${input.checkOut}) must be YYYY-MM-DD.`,
    );
  }
  if (input.checkIn >= input.checkOut) {
    throw new SpaceHoldInvalidRangeError(
      `checkIn (${input.checkIn}) must precede checkOut (${input.checkOut}).`,
    );
  }

  const current = base(group);
  const swept = pruneExpiredSpaceHolds(current.holds, now);

  const existingIdx = swept.findIndex((h) => h.holdId === input.holdId);

  const conflict = swept.find(
    (h) =>
      h.holdId !== input.holdId &&
      h.resourceId === input.resourceId &&
      rangesOverlap(h.checkIn, h.checkOut, input.checkIn, input.checkOut),
  );
  if (conflict) {
    throw new SpaceHoldConflictError(
      `Resource ${input.resourceId} already held (${conflict.holdId}) for overlapping dates.`,
    );
  }

  const finalCount = existingIdx >= 0 ? swept.length : swept.length + 1;
  if (finalCount > MAX_CONCURRENT_SPACE_HOLDS) {
    throw new SpaceHoldLimitError(
      `Session has ${swept.length} active space holds (max ${MAX_CONCURRENT_SPACE_HOLDS}).`,
    );
  }

  const fullHold: RelaySessionSpaceHold = {
    holdId: input.holdId,
    resourceId: input.resourceId,
    moduleItemId: input.moduleItemId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guestCount: input.guestCount,
    metadata: input.metadata,
    createdAt: now.toISOString(),
    holdExpiresAt: new Date(now.getTime() + SPACE_HOLD_TTL_MS).toISOString(),
  };

  const holds =
    existingIdx >= 0
      ? [
          ...swept.slice(0, existingIdx),
          fullHold,
          ...swept.slice(existingIdx + 1),
        ]
      : [...swept, fullHold];

  return { holds };
}

/**
 * Reset hold's `holdExpiresAt`. Silent no-op when holdId absent.
 */
export function extendSpaceHold(
  group: RelaySessionSpace | undefined | null,
  holdId: string,
  now: Date = new Date(),
): RelaySessionSpace {
  const swept = pruneExpiredSpaceHolds(base(group).holds, now);
  const idx = swept.findIndex((h) => h.holdId === holdId);
  if (idx < 0) return { holds: swept };
  const refreshed: RelaySessionSpaceHold = {
    ...swept[idx],
    holdExpiresAt: new Date(now.getTime() + SPACE_HOLD_TTL_MS).toISOString(),
  };
  return {
    holds: [
      ...swept.slice(0, idx),
      refreshed,
      ...swept.slice(idx + 1),
    ],
  };
}

/**
 * Remove hold by id. Silent when absent; sweep fires alongside.
 */
export function releaseSpaceHold(
  group: RelaySessionSpace | undefined | null,
  holdId: string,
  now: Date = new Date(),
): RelaySessionSpace {
  const swept = pruneExpiredSpaceHolds(base(group).holds, now);
  return { holds: swept.filter((h) => h.holdId !== holdId) };
}
