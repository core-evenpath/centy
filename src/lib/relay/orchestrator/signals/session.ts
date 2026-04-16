import 'server-only';

// ── Commerce session signal ───────────────────────────────────────────
//
// Loads the runtime cart / booking session + the most recent orders
// for this conversation. Downstream policy uses these to boost
// cart/checkout/tracker blocks when relevant.

import { loadSession } from '@/lib/relay/session-store';
import { getOrdersForConversationAction } from '@/actions/relay-orders';
import type { OrchestratorContext, SessionSignal } from '../types';

const RECENT_ORDERS_LIMIT = 3;

export async function loadSessionSignal(
  ctx: OrchestratorContext,
): Promise<SessionSignal> {
  let session: SessionSignal['session'] = null;
  try {
    session = await loadSession(ctx.partnerId, ctx.conversationId);
  } catch {
    /* non-fatal */
  }

  const cartItems = session?.cart?.items ?? [];
  const cartItemCount = cartItems.reduce(
    (n, i) => n + (typeof i.quantity === 'number' ? i.quantity : 1),
    0,
  );
  const cartTotal = session?.cart?.total ?? 0;

  const bookingSlots = session?.booking?.slots ?? [];
  const hasBookingHold = bookingSlots.some(
    (s) => s.status === 'tentative' || s.status === 'confirmed',
  );

  let recentOrders: SessionSignal['recentOrders'] = [];
  try {
    const res = await getOrdersForConversationAction(
      ctx.partnerId,
      ctx.conversationId,
      RECENT_ORDERS_LIMIT,
    );
    if (res.success && res.orders) recentOrders = res.orders;
  } catch {
    /* non-fatal */
  }

  return {
    session,
    cartItemCount,
    cartTotal,
    hasCart: cartItemCount > 0,
    hasBookingHold,
    recentOrders,
  };
}
