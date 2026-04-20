// P3.M01 pure booking-holds reducer.
//
// Mirrors the cart-reducer.ts shape from P2.M01. All state transitions
// (add / extend / release) expressed as pure functions over the holds
// array nested inside RelaySessionBooking. Server actions orchestrate
// Firestore I/O around these reducers; tests exercise the state
// machine without mocks.
//
// On-read + on-write hybrid expiry: every reducer op calls
// `pruneExpiredHolds` at entry, and `loadBookingConfirmationData` (M03,
// deferred) prunes on read. No background cron.
//
// Single-writer discipline: only booking actions write holds via
// `setSessionBooking`, which in turn writes the whole booking sub-
// object produced by these reducers.

import type {
  RelaySessionBooking,
  RelaySessionBookingHold,
} from '../session-types';
import { BOOKING_HOLD_TTL_MS, MAX_CONCURRENT_HOLDS } from './constants';

export class BookingHoldConflictError extends Error {
  readonly code = 'BOOKING_HOLD_CONFLICT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'BookingHoldConflictError';
  }
}

export class BookingHoldLimitError extends Error {
  readonly code = 'BOOKING_HOLD_LIMIT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'BookingHoldLimitError';
  }
}

export interface BookingHoldInput {
  holdId: string;
  resourceId: string;
  moduleItemId: string;
  startAt: string;
  endAt: string;
  metadata?: Record<string, unknown>;
}

function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

/**
 * Drop expired holds (`holdExpiresAt <= now`) from the array. Pure
 * function; used on every reducer entry AND on every data-loader read.
 */
export function pruneExpiredHolds(
  holds: readonly RelaySessionBookingHold[],
  now: Date = new Date(),
): RelaySessionBookingHold[] {
  const nowMs = now.getTime();
  return holds.filter((h) => Date.parse(h.holdExpiresAt) > nowMs);
}

function baseBooking(
  group: RelaySessionBooking | undefined | null,
): RelaySessionBooking {
  return group ?? { slots: [] };
}

/**
 * Add (or idempotently update) a hold. Throws on:
 *   - overlapping interval on the same resourceId (different holdId)
 *   - MAX_CONCURRENT_HOLDS exceeded (after sweep)
 *
 * Same-holdId calls refresh `holdExpiresAt` and `createdAt` in place
 * (idempotent). Sweep fires before conflict + limit checks so expired
 * holds don't block new ones.
 */
export function addBookingHold(
  group: RelaySessionBooking | undefined | null,
  input: BookingHoldInput,
  now: Date = new Date(),
): RelaySessionBooking {
  const base = baseBooking(group);
  const swept = pruneExpiredHolds(base.holds ?? [], now);

  // Idempotent on same holdId — will replace in place.
  const existingIdx = swept.findIndex((h) => h.holdId === input.holdId);

  // Conflict check: another hold on same resource with overlapping interval.
  const conflict = swept.find(
    (h) =>
      h.holdId !== input.holdId &&
      h.resourceId === input.resourceId &&
      intervalsOverlap(h.startAt, h.endAt, input.startAt, input.endAt),
  );
  if (conflict) {
    throw new BookingHoldConflictError(
      `Resource ${input.resourceId} already held (${conflict.holdId}) for overlapping interval.`,
    );
  }

  // Limit check: count distinct holds we'll have after the op.
  const finalCount = existingIdx >= 0 ? swept.length : swept.length + 1;
  if (finalCount > MAX_CONCURRENT_HOLDS) {
    throw new BookingHoldLimitError(
      `Session has ${swept.length} active holds (max ${MAX_CONCURRENT_HOLDS}).`,
    );
  }

  const fullHold: RelaySessionBookingHold = {
    holdId: input.holdId,
    resourceId: input.resourceId,
    moduleItemId: input.moduleItemId,
    startAt: input.startAt,
    endAt: input.endAt,
    metadata: input.metadata,
    createdAt: now.toISOString(),
    holdExpiresAt: new Date(now.getTime() + BOOKING_HOLD_TTL_MS).toISOString(),
  };

  const holds =
    existingIdx >= 0
      ? [
          ...swept.slice(0, existingIdx),
          fullHold,
          ...swept.slice(existingIdx + 1),
        ]
      : [...swept, fullHold];

  return { ...base, holds };
}

/**
 * Reset a hold's `holdExpiresAt` to now + TTL. No-op if the holdId
 * doesn't exist (silent per prompt); callers check post-state if
 * they need to distinguish.
 */
export function extendBookingHold(
  group: RelaySessionBooking | undefined | null,
  holdId: string,
  now: Date = new Date(),
): RelaySessionBooking {
  const base = baseBooking(group);
  const swept = pruneExpiredHolds(base.holds ?? [], now);
  const idx = swept.findIndex((h) => h.holdId === holdId);
  if (idx < 0) {
    return { ...base, holds: swept };
  }
  const refreshed: RelaySessionBookingHold = {
    ...swept[idx],
    holdExpiresAt: new Date(now.getTime() + BOOKING_HOLD_TTL_MS).toISOString(),
  };
  const holds = [
    ...swept.slice(0, idx),
    refreshed,
    ...swept.slice(idx + 1),
  ];
  return { ...base, holds };
}

/**
 * Remove a hold by id. Silent when absent. Sweep fires alongside so
 * the caller gets a clean slate.
 */
export function releaseBookingHold(
  group: RelaySessionBooking | undefined | null,
  holdId: string,
  now: Date = new Date(),
): RelaySessionBooking {
  const base = baseBooking(group);
  const swept = pruneExpiredHolds(base.holds ?? [], now);
  const holds = swept.filter((h) => h.holdId !== holdId);
  return { ...base, holds };
}
