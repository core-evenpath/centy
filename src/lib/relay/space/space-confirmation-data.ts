import 'server-only';

// P4.M03 (deferred → follow-up): space_confirmation block data loader.
//
// Mirror of loadOrderTrackerData and loadBookingConfirmationData.
// Reads recent confirmed reservations for a contact from
// partners/{pid}/relayReservations (the path confirmSpaceAction writes
// to per Phase 4 retro §collection).
//
// Anon sessions → empty list. Not health-gated.

import { db } from '@/lib/firebase-admin';

export const SPACE_CONFIRMATION_BLOCK_IDS: ReadonlySet<string> = new Set([
  'space_confirmation',
]);

const RECENT_LIMIT = 5;

export interface SpaceConfirmationItem {
  reservationId: string;
  partnerId: string;
  contactId: string;
  conversationId: string;
  status: string;
  createdAt: string;
  hold: {
    holdId: string;
    resourceId: string;
    moduleItemId: string;
    checkIn: string;
    checkOut: string;
  };
}

export interface SpaceConfirmationPreviewData {
  reservations: SpaceConfirmationItem[];
}

export async function loadSpaceConfirmationData(
  partnerId: string,
  contactId: string | null | undefined,
): Promise<SpaceConfirmationPreviewData> {
  if (!contactId) {
    return { reservations: [] };
  }
  try {
    const snap = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayReservations')
      .where('contactId', '==', contactId)
      .orderBy('createdAt', 'desc')
      .limit(RECENT_LIMIT)
      .get();
    const reservations = snap.docs.map(
      (d) => d.data() as SpaceConfirmationItem,
    );
    return { reservations };
  } catch (err) {
    console.error('[space-confirmation] load failed', { partnerId, contactId, err });
    return { reservations: [] };
  }
}
