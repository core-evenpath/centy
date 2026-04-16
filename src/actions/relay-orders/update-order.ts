'use server';

// ── Partner-side order mutations ────────────────────────────────────────
//
// Status transitions and tracking info. Each mutation appends a
// timeline entry and updates the matching milestone timestamp
// (confirmedAt / shippedAt / deliveredAt) so the order history is
// self-describing.

import { revalidatePath } from 'next/cache';
import { loadOrder, partnerOrderRef } from '@/lib/relay/order-store';
import { getStatusLabel } from '@/lib/relay/order-helpers';
import type {
  OrderStatus,
  OrderTimeline,
  OrderTracking,
  RelayOrder,
} from '@/lib/relay/order-types';

export interface UpdateOrderResult {
  success: boolean;
  order?: RelayOrder;
  error?: string;
}

export interface SimpleResult {
  success: boolean;
  error?: string;
}

const MILESTONE_MAP: Partial<Record<OrderStatus, keyof RelayOrder>> = {
  confirmed: 'confirmedAt',
  shipped: 'shippedAt',
  delivered: 'deliveredAt',
};

export async function updateOrderStatusAction(
  partnerId: string,
  orderId: string,
  newStatus: OrderStatus,
  note?: string,
): Promise<UpdateOrderResult> {
  try {
    const order = await loadOrder(partnerId, orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const now = new Date().toISOString();
    const entry: OrderTimeline = {
      status: newStatus,
      timestamp: now,
      note: note || getStatusLabel(newStatus),
    };

    const updates: Partial<RelayOrder> & { [k: string]: unknown } = {
      status: newStatus,
      timeline: [...order.timeline, entry],
      updatedAt: now,
    };

    const milestone = MILESTONE_MAP[newStatus];
    if (milestone) updates[milestone as string] = now;

    await partnerOrderRef(partnerId, orderId).update(updates);

    try {
      revalidatePath('/partner/orders');
    } catch {
      /* best-effort */
    }

    return { success: true, order: { ...order, ...updates } as RelayOrder };
  } catch (e) {
    console.error('[relay-orders] updateStatus failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function addTrackingInfoAction(
  partnerId: string,
  orderId: string,
  tracking: OrderTracking & { carrier: string; trackingNumber: string },
): Promise<SimpleResult> {
  try {
    const order = await loadOrder(partnerId, orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const now = new Date().toISOString();
    const entry: OrderTimeline = {
      status: 'shipped',
      timestamp: now,
      note: `Shipped via ${tracking.carrier} (${tracking.trackingNumber})`,
    };

    await partnerOrderRef(partnerId, orderId).update({
      tracking,
      status: 'shipped',
      shippedAt: now,
      updatedAt: now,
      timeline: [...order.timeline, entry],
    });

    try {
      revalidatePath('/partner/orders');
    } catch {
      /* best-effort */
    }
    return { success: true };
  } catch (e) {
    console.error('[relay-orders] addTracking failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
