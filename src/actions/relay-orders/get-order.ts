'use server';

// ── Read-side order actions ─────────────────────────────────────────────
//
// Scoped reads: one order, a conversation's orders, or a partner's
// order list. Lookup across all partners (for the widget tracker) lives
// in `./lookup-order.ts`.

import { loadOrder, partnerOrdersCol } from '@/lib/relay/order-store';
import { orderToSummary } from '@/lib/relay/order-helpers';
import type {
  OrderStatus,
  OrderSummary,
  RelayOrder,
} from '@/lib/relay/order-types';

export interface GetOrderResult {
  success: boolean;
  order?: RelayOrder;
  error?: string;
}

export interface OrderListResult<T> {
  success: boolean;
  orders?: T[];
  error?: string;
}

export async function getOrderAction(
  partnerId: string,
  orderId: string,
): Promise<GetOrderResult> {
  try {
    const order = await loadOrder(partnerId, orderId);
    if (!order) return { success: false, error: 'Order not found' };
    return { success: true, order };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function getOrdersForConversationAction(
  partnerId: string,
  conversationId: string,
  limit = 5,
): Promise<OrderListResult<OrderSummary>> {
  try {
    const snap = await partnerOrdersCol(partnerId)
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const orders = snap.docs.map((d) => orderToSummary(d.data() as RelayOrder));
    return { success: true, orders };
  } catch (e) {
    console.error('[relay-orders] getForConversation failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export interface PartnerOrdersOptions {
  status?: OrderStatus;
  limit?: number;
}

export async function getPartnerOrdersAction(
  partnerId: string,
  options: PartnerOrdersOptions = {},
): Promise<OrderListResult<RelayOrder>> {
  try {
    let query = partnerOrdersCol(partnerId)
      .orderBy('createdAt', 'desc')
      .limit(options.limit ?? 20);
    if (options.status) query = query.where('status', '==', options.status);

    const snap = await query.get();
    const orders = snap.docs.map((d) => d.data() as RelayOrder);
    return { success: true, orders };
  } catch (e) {
    console.error('[relay-orders] getPartnerOrders failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
