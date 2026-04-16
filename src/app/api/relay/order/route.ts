import { NextRequest, NextResponse } from 'next/server';
import {
  createOrderFromCartAction,
  getOrdersForConversationAction,
  lookupOrderAction,
} from '@/actions/relay-orders';

// ── Widget-facing orders endpoint ───────────────────────────────────────
//
// POST: dispatches create / lookup / list. GET: convenience lookup by
// `?orderId=…` so the order-tracker block can fetch over a simple GET.
// CORS-open like the other widget endpoints — the body carries its own
// partnerId / conversationId for scoping.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface OrderPostBody {
  action?: 'create' | 'lookup' | 'list';
  partnerId?: string;
  conversationId?: string;
  orderId?: string;
  payload?: Record<string, unknown>;
}

function bad(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: corsHeaders },
  );
}

export async function POST(request: NextRequest) {
  let body: OrderPostBody;
  try {
    body = (await request.json()) as OrderPostBody;
  } catch {
    return bad('Invalid JSON body');
  }

  const { action, partnerId, conversationId, orderId, payload } = body;
  if (!action) return bad('action is required');

  try {
    switch (action) {
      case 'create': {
        if (!partnerId || !conversationId || !payload) {
          return bad('partnerId, conversationId and payload are required');
        }
        const result = await createOrderFromCartAction(partnerId, {
          conversationId,
          ...(payload as Omit<
            Parameters<typeof createOrderFromCartAction>[1],
            'conversationId'
          >),
        });
        return NextResponse.json(result, { headers: corsHeaders });
      }

      case 'lookup': {
        if (!orderId) return bad('orderId is required');
        const result = await lookupOrderAction(orderId);
        return NextResponse.json(result, { headers: corsHeaders });
      }

      case 'list': {
        if (!partnerId || !conversationId) {
          return bad('partnerId and conversationId are required');
        }
        const result = await getOrdersForConversationAction(
          partnerId,
          conversationId,
        );
        return NextResponse.json(result, { headers: corsHeaders });
      }

      default:
        return bad(`Unknown action: ${action}`);
    }
  } catch (e) {
    console.error('[relay/order] dispatch failed:', e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function GET(request: NextRequest) {
  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) return bad('orderId query param required');
  const result = await lookupOrderAction(orderId);
  return NextResponse.json(result, { headers: corsHeaders });
}
