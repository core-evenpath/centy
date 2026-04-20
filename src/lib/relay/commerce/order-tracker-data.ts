import 'server-only';

// P2.M03: order_tracker block data loader.
//
// Reads the most-recent orders for a resolved contact and reshapes
// them into OrderTrackerPreviewData. Anon sessions (no contactId)
// get an empty orders array — the preview component falls back to
// its design sample without throwing.
//
// Kept separate from the pure buildBlockData dispatch so async
// Firestore reads don't leak into that path. The orchestrator calls
// this after buildBlockData and merges the result.

import { db } from '@/lib/firebase-admin';
import type { RelayOrder } from '../order-types';
import type { OrderTrackerPreviewData } from '@/app/admin/relay/blocks/previews/_preview-props';

/** Block ids that consume OrderTrackerPreviewData. */
export const ORDER_TRACKER_BLOCK_IDS: ReadonlySet<string> = new Set([
  'order_tracker',
  'ecom_order_tracker',
]);

const RECENT_LIMIT = 5;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function toShortId(orderId: string): string {
  // Show last 6 chars of the order id in #ORD-XXXXXX form. Keeps the
  // preview layout stable (existing MiniOrderTracker uses #ORD-847291).
  const tail = orderId.slice(-6).toUpperCase();
  return `#ORD-${tail}`;
}

function toItem(order: RelayOrder): NonNullable<OrderTrackerPreviewData['orders']>[number] {
  const itemCount = order.items.reduce((s, i) => s + (i.quantity ?? 0), 0);
  return {
    id: order.id,
    shortId: toShortId(order.id),
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] ?? order.status,
    total: order.total,
    currency: order.currency,
    itemCount,
    createdAt: order.createdAt,
    trackingUrl: order.tracking?.trackingUrl,
  };
}

/**
 * Load recent orders for the resolved contact. Anon sessions (no
 * contactId) receive `{ orders: [] }` — graceful degradation per
 * ADR-P4-01 §Anon handling (reads are not gated on identity, but
 * contact-scoped queries can't return anything without a contactId).
 *
 * Contact-scoped query: partnerId + contactId + orderBy createdAt desc
 * + limit 5. Requires a composite Firestore index; flagged in
 * runbook if the query warns.
 */
export async function loadOrderTrackerData(
  partnerId: string,
  contactId: string | null | undefined,
): Promise<OrderTrackerPreviewData> {
  if (!contactId) {
    return { orders: [] };
  }
  try {
    const snap = await db
      .collection('partners')
      .doc(partnerId)
      .collection('orders')
      .where('contactId', '==', contactId)
      .orderBy('createdAt', 'desc')
      .limit(RECENT_LIMIT)
      .get();
    const orders = snap.docs
      .map((d) => d.data() as RelayOrder)
      .map(toItem);
    return { orders };
  } catch (err) {
    console.error('[order-tracker] load failed', { partnerId, contactId, err });
    return { orders: [] };
  }
}
