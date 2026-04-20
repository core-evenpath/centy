'use server';

// ── Relay runtime space actions (P4) ────────────────────────────────────
//
// Mirrors the booking hold pattern (P3) with date-range semantics.
// Holds on `session.space.holds[]`; confirmation writes to
// `partners/{pid}/relayReservations/{id}` (same local convention as
// P3's `relayBookings`).
//
// Hold mutations are anon-allowed per ADR-P4-01 §Anon handling.
// confirmSpaceAction is the third production consumer of
// requireIdentityOrThrow — after Phase 4 retro's abstraction check,
// a shared commit-gate helper may be extracted.

import { db } from '@/lib/firebase-admin';
import { loadOrCreateSession, loadSession, setSessionSpace } from '@/lib/relay/session-store';
import type {
  RelaySessionSpace,
  RelaySessionSpaceHold,
} from '@/lib/relay/session-types';
import {
  addSpaceHold,
  extendSpaceHold,
  pruneExpiredSpaceHolds,
  releaseSpaceHold,
  SpaceHoldConflictError,
  SpaceHoldInvalidRangeError,
  SpaceHoldLimitError,
  type SpaceHoldInput,
} from '@/lib/relay/space/space-reducer';
import {
  IdentityRequiredError,
  requireIdentityOrThrow,
} from '@/lib/relay/identity/commit-gate';
import { evaluatePartnerSaveGate } from '@/actions/relay-health-actions';

// ── Hold action result ─────────────────────────────────────────────

export interface SpaceHoldActionResult {
  success: boolean;
  hold?: RelaySessionSpaceHold;
  space?: RelaySessionSpace;
  error?: string;
  code?:
    | 'SPACE_HOLD_CONFLICT'
    | 'SPACE_HOLD_LIMIT'
    | 'SPACE_HOLD_INVALID_RANGE'
    | 'INTERNAL_ERROR';
}

function toHoldErr(e: unknown): {
  error: string;
  code: NonNullable<SpaceHoldActionResult['code']>;
} {
  if (e instanceof SpaceHoldConflictError) return { error: e.message, code: e.code };
  if (e instanceof SpaceHoldLimitError) return { error: e.message, code: e.code };
  if (e instanceof SpaceHoldInvalidRangeError) return { error: e.message, code: e.code };
  return {
    error: e instanceof Error ? e.message : 'unknown',
    code: 'INTERNAL_ERROR',
  };
}

export async function createSpaceHoldAction(
  partnerId: string,
  conversationId: string,
  input: SpaceHoldInput,
): Promise<SpaceHoldActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const space = addSpaceHold(session.space, input);
    const saved = await setSessionSpace(partnerId, conversationId, space);
    const hold = saved.holds.find((h) => h.holdId === input.holdId);
    return { success: true, hold, space: saved };
  } catch (e) {
    return { success: false, ...toHoldErr(e) };
  }
}

export async function extendSpaceHoldAction(
  partnerId: string,
  conversationId: string,
  holdId: string,
): Promise<SpaceHoldActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const space = extendSpaceHold(session.space, holdId);
    const saved = await setSessionSpace(partnerId, conversationId, space);
    const hold = saved.holds.find((h) => h.holdId === holdId);
    return { success: true, hold, space: saved };
  } catch (e) {
    return { success: false, ...toHoldErr(e) };
  }
}

export async function releaseSpaceHoldAction(
  partnerId: string,
  conversationId: string,
  holdId: string,
): Promise<SpaceHoldActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const space = releaseSpaceHold(session.space, holdId);
    const saved = await setSessionSpace(partnerId, conversationId, space);
    return { success: true, space: saved };
  } catch (e) {
    return { success: false, ...toHoldErr(e) };
  }
}

// ── confirmSpaceAction — third requireIdentityOrThrow consumer ─────
//
// Three-gate sequence matches Phase 2 createOrder and Phase 3
// confirmBooking exactly:
//   1. Health — evaluatePartnerSaveGate
//   2. Identity — requireIdentityOrThrow (third consumer)
//   3. Hold — pruneExpiredSpaceHolds + lookup; HOLD_MISSING_OR_EXPIRED
//      on miss
//
// After Phase 4 retro the three action bodies have enough signal for
// the DRY-vs-parallel decision on a shared commit-gate helper.

export interface ConfirmSpaceResult {
  success: boolean;
  reservationId?: string;
  error?: string;
  code?:
    | 'HEALTH_RED'
    | 'IDENTITY_REQUIRED'
    | 'HOLD_MISSING_OR_EXPIRED'
    | 'INTERNAL_ERROR';
}

export async function confirmSpaceAction(
  partnerId: string,
  conversationId: string,
  holdId: string,
): Promise<ConfirmSpaceResult> {
  try {
    // Gate 1: Health
    const healthGate = await evaluatePartnerSaveGate(partnerId);
    if (!healthGate.allow) {
      return {
        success: false,
        error: `Reservation blocked: engine "${healthGate.engine}" health is red. Fix outstanding issues via /admin/relay/health first.`,
        code: 'HEALTH_RED',
      };
    }

    const session = await loadSession(partnerId, conversationId);

    // Gate 2: Identity
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

    // Gate 3: Hold exists + non-expired (on-read prune)
    const now = new Date();
    const liveHolds = pruneExpiredSpaceHolds(session?.space?.holds ?? [], now);
    const hold = liveHolds.find((h) => h.holdId === holdId);
    if (!hold) {
      return {
        success: false,
        error: `Space hold ${holdId} not found or expired. Re-select dates.`,
        code: 'HOLD_MISSING_OR_EXPIRED',
      };
    }

    const reservationId = `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db
      .collection('partners').doc(partnerId)
      .collection('relayReservations').doc(reservationId)
      .set({
        reservationId,
        partnerId,
        contactId,
        conversationId,
        hold,
        customer: session?.customer ?? null,
        createdAt: now.toISOString(),
        status: 'confirmed',
      });

    // Release the hold via the reducer (single-writer discipline).
    const nextSpace = releaseSpaceHold(session?.space, holdId, now);
    await setSessionSpace(partnerId, conversationId, nextSpace);

    return { success: true, reservationId };
  } catch (e) {
    console.error('[relay-space] confirm failed:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'unknown',
      code: 'INTERNAL_ERROR',
    };
  }
}
