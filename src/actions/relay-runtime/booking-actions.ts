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
  releaseBookingHold,
  BookingHoldConflictError,
  BookingHoldLimitError,
  type BookingHoldInput,
} from '@/lib/relay/booking/booking-reducer';

export interface BookingActionResult {
  success: boolean;
  booking?: RelaySessionBooking;
  error?: string;
}

export interface ConfirmBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
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

export async function confirmBookingAction(
  conversationId: string,
  partnerId: string,
): Promise<ConfirmBookingResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const tentative = session.booking.slots.filter((s) => s.status === 'tentative');
    if (tentative.length === 0) {
      return { success: false, error: 'No tentative slots to confirm' };
    }
    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const slots = session.booking.slots.map((s) =>
      s.status === 'tentative' ? { ...s, status: 'confirmed' as const } : s,
    );
    await setSessionBooking(partnerId, conversationId, { ...session.booking, slots });

    // Persist a lightweight pending-booking record so partner-side jobs
    // can pick it up. Stored under partner subtree so existing rules /
    // queries scope it correctly.
    await db
      .collection('partners').doc(partnerId)
      .collection('relayBookings').doc(bookingId)
      .set({
        bookingId,
        partnerId,
        conversationId,
        slots: tentative,
        customer: session.customer ?? null,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });

    return { success: true, bookingId };
  } catch (e) {
    console.error('[relay-booking] confirm failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
