import { NextRequest, NextResponse } from 'next/server';
import {
  addToCartAction,
  applyDiscountCodeAction,
  cancelSlotAction,
  clearCartAction,
  confirmBookingAction,
  getOrCreateRelaySessionAction,
  getRelaySessionAction,
  removeFromCartAction,
  reserveSlotAction,
  updateCartItemAction,
  updateRelaySessionAction,
} from '@/actions/relay-runtime';

// ── Relay block-action endpoint ─────────────────────────────────────────
//
// Receives button clicks from the embeddable widget (cross-origin) and
// routes them to the matching server action. Mutates the runtime session
// document under `relaySessions/{partnerId}_{conversationId}`. Independent
// of `/api/relay/chat` — that route owns the AI/turn loop and is left
// untouched.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface ActionBody {
  action?: string;
  conversationId?: string;
  partnerId?: string;
  payload?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders },
    );
  }

  const { action, conversationId, partnerId, payload = {} } = body;

  if (!action || !conversationId || !partnerId) {
    return NextResponse.json(
      { success: false, error: 'action, conversationId and partnerId are required' },
      { status: 400, headers: corsHeaders },
    );
  }

  try {
    const result = await dispatch(action, conversationId, partnerId, payload);
    return NextResponse.json(result, { headers: corsHeaders });
  } catch (e) {
    console.error('[relay/action] dispatch failed:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500, headers: corsHeaders },
    );
  }
}

async function dispatch(
  action: string,
  conversationId: string,
  partnerId: string,
  payload: Record<string, unknown>,
) {
  switch (action) {
    case 'get_session':
      return getOrCreateRelaySessionAction(conversationId, partnerId);

    case 'fetch_session':
      return getRelaySessionAction(conversationId, partnerId);

    case 'update_session':
      return updateRelaySessionAction(conversationId, partnerId, payload as never);

    // ── Cart ──
    case 'add_to_cart':
      return addToCartAction(conversationId, partnerId, payload as never);

    case 'update_cart':
      return updateCartItemAction(
        conversationId,
        partnerId,
        String(payload.itemId),
        Number(payload.quantity),
      );

    case 'remove_from_cart':
      return removeFromCartAction(conversationId, partnerId, String(payload.itemId));

    case 'clear_cart':
      return clearCartAction(conversationId, partnerId);

    case 'apply_discount':
      return applyDiscountCodeAction(conversationId, partnerId, String(payload.code ?? ''));

    // ── Booking ──
    case 'reserve_slot':
      return reserveSlotAction(conversationId, partnerId, payload as never);

    case 'cancel_slot':
      return cancelSlotAction(conversationId, partnerId, String(payload.slotId));

    case 'confirm_booking':
      return confirmBookingAction(conversationId, partnerId);

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}
