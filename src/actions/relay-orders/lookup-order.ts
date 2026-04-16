'use server';

// ── Cross-partner order lookup for the widget ───────────────────────────
//
// The widget knows a customer's order id but not which partner owns it
// (the partner resolves from the widget config, but the lookup is still
// convenient via a collectionGroup query). Returns a public-safe
// projection — only summary + timeline, no addresses / payment IDs.

import { db } from '@/lib/firebase-admin';
import { getStatusLabel } from '@/lib/relay/order-helpers';
import type {
  OrderLookupResult,
  RelayOrder,
} from '@/lib/relay/order-types';

export interface LookupOrderResult {
  success: boolean;
  order?: OrderLookupResult;
  error?: string;
}

export async function lookupOrderAction(
  orderId: string,
): Promise<LookupOrderResult> {
  if (!orderId) return { success: false, error: 'orderId is required' };

  try {
    const snap = await db
      .collectionGroup('orders')
      .where('id', '==', orderId)
      .limit(1)
      .get();

    if (snap.empty) return { success: false, error: 'Order not found' };

    const data = snap.docs[0].data() as RelayOrder;
    return {
      success: true,
      order: {
        orderId: data.id,
        status: data.status,
        statusLabel: getStatusLabel(data.status),
        itemCount: data.items.reduce((s, i) => s + i.quantity, 0),
        total: data.total,
        currency: data.currency,
        createdAt: data.createdAt,
        estimatedDelivery: data.tracking?.estimatedDelivery,
        trackingUrl: data.tracking?.trackingUrl,
        carrier: data.tracking?.carrier,
        timeline: data.timeline,
      },
    };
  } catch (e) {
    console.error('[relay-orders] lookup failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
