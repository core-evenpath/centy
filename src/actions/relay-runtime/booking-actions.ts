'use server';

// ── Relay runtime booking actions ───────────────────────────────────────
//
// Mutates the `booking.slots` field on the session document. Reservation
// is "tentative" by default. `confirmBookingAction` flips all tentative
// slots to confirmed and returns a generated booking id — wiring to a
// real booking engine is out of scope for this layer.

import { db } from '@/lib/firebase-admin';
import { loadOrCreateSession, setSessionBooking } from '@/lib/relay/session-store';
import type {
  RelayBookingSlot,
  RelaySessionBooking,
  RelaySessionBookingHold,
} from '@/lib/relay/session-types';
import {
  addBookingHold,
  extendBookingHold,
  pruneExpiredHolds,
  releaseBookingHold,
  BookingHoldConflictError,
  BookingHoldLimitError,
  type BookingHoldInput,
} from '@/lib/relay/booking/booking-reducer';
import {
  IdentityRequiredError,
  requireIdentityOrThrow,
} from '@/lib/relay/identity/commit-gate';
import { evaluatePartnerSaveGate } from '@/actions/relay-health-actions';

export interface BookingActionResult {
  success: boolean;
  booking?: RelaySessionBooking;
  error?: string;
}

export interface ConfirmBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
  /**
   * P3.M02: typed code set when a gate denies the confirm. Legacy
   * slot-flow callers that don't distinguish can continue reading
   * `success` and `error`.
   */
  code?:
    | 'HEALTH_RED'
    | 'IDENTITY_REQUIRED'
    | 'HOLD_MISSING_OR_EXPIRED'
    | 'NO_TENTATIVE_SLOTS'
    | 'INTERNAL_ERROR';
}

export async function reserveSlotAction(
  conversationId: string,
  partnerId: string,
  slot: Omit<RelayBookingSlot, 'reservedAt' | 'status'>,
): Promise<BookingActionResult> {
  try {
    if (!slot?.slotId || !slot?.serviceId) {
      return { success: false, error: 'slotId and serviceId are required' };
    }
    const session = await loadOrCreateSession(partnerId, conversationId);
    const exists = session.booking.slots.some((s) => s.slotId === slot.slotId);
    const next: RelayBookingSlot = {
      ...slot,
      status: 'tentative',
      reservedAt: new Date().toISOString(),
    };
    const slots = exists
      ? session.booking.slots.map((s) => (s.slotId === slot.slotId ? next : s))
      : [...session.booking.slots, next];
    const booking: RelaySessionBooking = { ...session.booking, slots };
    const saved = await setSessionBooking(partnerId, conversationId, booking);
    return { success: true, booking: saved };
  } catch (e) {
    console.error('[relay-booking] reserve failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function cancelSlotAction(
  conversationId: string,
  partnerId: string,
  slotId: string,
): Promise<BookingActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const slots = session.booking.slots.filter((s) => s.slotId !== slotId);
    const booking: RelaySessionBooking = { ...session.booking, slots };
    const saved = await setSessionBooking(partnerId, conversationId, booking);
    return { success: true, booking: saved };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

// ── P3.M01 hold actions (anon-allowed) ──────────────────────────────
//
// Holds live alongside the existing slot-flow. They share the
// `booking` session sub-object (nested `holds` array). Anon-allowed
// per ADR-P4-01 §Anon handling; identity resolved at commit
// (`confirmBookingHoldAction` in M02) — not here.

export interface HoldActionResult {
  success: boolean;
  hold?: RelaySessionBookingHold;
  booking?: RelaySessionBooking;
  error?: string;
  code?: 'BOOKING_HOLD_CONFLICT' | 'BOOKING_HOLD_LIMIT' | 'INTERNAL_ERROR';
}

function toHoldErr(e: unknown): { error: string; code: NonNullable<HoldActionResult['code']> } {
  if (e instanceof BookingHoldConflictError) {
    return { error: e.message, code: e.code };
  }
  if (e instanceof BookingHoldLimitError) {
    return { error: e.message, code: e.code };
  }
  return {
    error: e instanceof Error ? e.message : 'unknown',
    code: 'INTERNAL_ERROR',
  };
}

export async function createBookingHoldAction(
  partnerId: string,
  conversationId: string,
  input: BookingHoldInput,
): Promise<HoldActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const booking = addBookingHold(session.booking, input);
    const saved = await setSessionBooking(partnerId, conversationId, booking);
    const hold = saved.holds?.find((h) => h.holdId === input.holdId);
    return { success: true, hold, booking: saved };
  } catch (e) {
    return { success: false, ...toHoldErr(e) };
  }
}

export async function extendBookingHoldAction(
  partnerId: string,
  conversationId: string,
  holdId: string,
): Promise<HoldActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const booking = extendBookingHold(session.booking, holdId);
    const saved = await setSessionBooking(partnerId, conversationId, booking);
    const hold = saved.holds?.find((h) => h.holdId === holdId);
    return { success: true, hold, booking: saved };
  } catch (e) {
    return { success: false, ...toHoldErr(e) };
  }
}

export async function releaseBookingHoldAction(
  partnerId: string,
  conversationId: string,
  holdId: string,
): Promise<HoldActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const booking = releaseBookingHold(session.booking, holdId);
    const saved = await setSessionBooking(partnerId, conversationId, booking);
    return { success: true, booking: saved };
  } catch (e) {
    return { success: false, ...toHoldErr(e) };
  }
}

// ── confirmBookingAction — P3.M02 dual-path confirm ────────────────
//
// Phase 3 M02 adds two pieces without breaking the existing slot-flow
// callers:
//
// 1. Three-gate sequence (Health → Identity → cart/hold/slot) applied
//    to BOTH paths, matching Phase 2's createOrderFromCartAction.
//    Adds typed `code` to ConfirmBookingResult; existing callers that
//    read only `success`/`error` continue to work.
//
// 2. Optional `holdId` parameter — when provided, confirm from the
//    `booking.holds[]` group (P3.M01 shape): atomic write of a new
//    booking doc + release of the hold. When absent, falls back to
//    the legacy slot-flow (flip tentative → confirmed; write snapshot).
//
// Both paths persist under partners/{pid}/relayBookings/{bookingId}
// — B2 decision from Phase 3 kickoff: reuse existing local convention
// rather than diverge. Rename to `bookings/` is a future cleanup ADR.
//
// Second production consumer of requireIdentityOrThrow — first was
// createOrderFromCartAction (Phase 2). The helper now has two real
// callers as Phase 1 retro predicted.

export async function confirmBookingAction(
  conversationId: string,
  partnerId: string,
  holdId?: string,
): Promise<ConfirmBookingResult> {
  try {
    // Gate 1: Health — deny on red engine before asking for PII.
    const healthGate = await evaluatePartnerSaveGate(partnerId);
    if (!healthGate.allow) {
      return {
        success: false,
        error: `Booking blocked: engine "${healthGate.engine}" health is red. Fix outstanding issues via /admin/relay/health first.`,
        code: 'HEALTH_RED',
      };
    }

    const session = await loadOrCreateSession(partnerId, conversationId);

    // Gate 2: Identity — second production consumer of
    // requireIdentityOrThrow. Shared across slot-flow and hold-flow;
    // commit boundary is commit boundary regardless of input model.
    let contactId: string;
    try {
      contactId = requireIdentityOrThrow(session);
    } catch (err) {
      if (err instanceof IdentityRequiredError) {
        return {
          success: false,
          error: err.message,
          code: 'IDENTITY_REQUIRED',
        };
      }
      throw err;
    }

    const now = new Date();

    // ── Hold-flow (P3.M02) ──────────────────────────────────────
    if (holdId !== undefined) {
      const liveHolds = pruneExpiredHolds(session.booking.holds ?? [], now);
      const hold = liveHolds.find((h) => h.holdId === holdId);
      if (!hold) {
        return {
          success: false,
          error: `Hold ${holdId} not found or expired. Re-select the slot.`,
          code: 'HOLD_MISSING_OR_EXPIRED',
        };
      }

      const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db
        .collection('partners').doc(partnerId)
        .collection('relayBookings').doc(bookingId)
        .set({
          bookingId,
          partnerId,
          contactId,
          conversationId,
          hold,
          customer: session.customer ?? null,
          createdAt: now.toISOString(),
          status: 'confirmed',
        });

      // Release the hold via the reducer (preserves single-writer
      // discipline — hold mutations still flow through the reducer).
      const nextBooking = releaseBookingHold(session.booking, holdId, now);
      await setSessionBooking(partnerId, conversationId, nextBooking);

      return { success: true, bookingId };
    }

    // ── Legacy slot-flow (pre-M01 behavior, preserved) ──────────
    const tentative = session.booking.slots.filter((s) => s.status === 'tentative');
    if (tentative.length === 0) {
      return {
        success: false,
        error: 'No tentative slots to confirm',
        code: 'NO_TENTATIVE_SLOTS',
      };
    }
    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const slots = session.booking.slots.map((s) =>
      s.status === 'tentative' ? { ...s, status: 'confirmed' as const } : s,
    );
    await setSessionBooking(partnerId, conversationId, { ...session.booking, slots });

    await db
      .collection('partners').doc(partnerId)
      .collection('relayBookings').doc(bookingId)
      .set({
        bookingId,
        partnerId,
        contactId,
        conversationId,
        slots: tentative,
        customer: session.customer ?? null,
        createdAt: now.toISOString(),
        status: 'pending',
      });

    return { success: true, bookingId };
  } catch (e) {
    console.error('[relay-booking] confirm failed:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'unknown',
      code: 'INTERNAL_ERROR',
    };
  }
}
