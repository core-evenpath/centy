import 'server-only';

// P3.M03 (deferred → follow-up): booking_confirmation block data loader.
//
// Mirror of P2.M03's loadOrderTrackerData. Reads recent confirmed
// bookings for a resolved contact from partners/{pid}/relayBookings
// (the path confirmBookingAction writes to per Phase 3 retro §B2).
//
// Anon sessions get an empty list — graceful degradation per
// ADR-P4-01 §Anon handling. Reads are NOT health-gated.

import { db } from '@/lib/firebase-admin';

/** Block ids that consume BookingConfirmationPreviewData. */
export const BOOKING_CONFIRMATION_BLOCK_IDS: ReadonlySet<string> = new Set([
  'booking_confirmation',
]);

const RECENT_LIMIT = 5;

/**
 * Wide shape — confirmBookingAction writes both hold-flow and
 * slot-flow shapes to the same collection (P3.M02 dual-path). The
 * preview component reads `bookingId`, `status`, `createdAt`, and
 * either `hold` or `slots[0]` for the detail line.
 */
export interface BookingConfirmationItem {
  bookingId: string;
  partnerId: string;
  contactId: string;
  conversationId: string;
  status: string;
  createdAt: string;
  hold?: {
    holdId?: string;
    resourceId?: string;
    moduleItemId?: string;
    startAt?: string;
    endAt?: string;
  };
  slots?: Array<{
    slotId?: string;
    serviceId?: string;
    serviceName?: string;
    date?: string;
    time?: string;
  }>;
}

export interface BookingConfirmationPreviewData {
  bookings: BookingConfirmationItem[];
}

export async function loadBookingConfirmationData(
  partnerId: string,
  contactId: string | null | undefined,
): Promise<BookingConfirmationPreviewData> {
  if (!contactId) {
    return { bookings: [] };
  }
  try {
    const snap = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayBookings')
      .where('contactId', '==', contactId)
      .orderBy('createdAt', 'desc')
      .limit(RECENT_LIMIT)
      .get();
    const bookings = snap.docs.map(
      (d) => d.data() as BookingConfirmationItem,
    );
    return { bookings };
  } catch (err) {
    console.error('[booking-confirmation] load failed', { partnerId, contactId, err });
    return { bookings: [] };
  }
}
