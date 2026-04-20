'use server';

// ── Create order from cart ──────────────────────────────────────────────
//
// Reads the runtime session (from Phase 2), snapshots the cart into a
// new order document under `partners/{pid}/orders/{oid}`, then clears
// the cart on the session. All in-line so the caller gets back an
// atomic view of "order created + cart drained".

import { revalidatePath } from 'next/cache';
import {
  loadOrCreateSession,
  setSessionCart,
} from '@/lib/relay/session-store';
import {
  computeOrderPricing,
  generateOrderId,
} from '@/lib/relay/order-helpers';
import { partnerOrderRef } from '@/lib/relay/order-store';
import {
  emptyCart,
  recomputeCartTotals,
} from '@/lib/relay/session-types';
import type {
  CreateOrderInput,
  OrderItem,
  RelayOrder,
} from '@/lib/relay/order-types';
import {
  IdentityRequiredError,
  requireIdentityOrThrow,
} from '@/lib/relay/identity/commit-gate';
import { evaluatePartnerSaveGate } from '@/actions/relay-health-actions';

export interface CreateOrderResult {
  success: boolean;
  order?: RelayOrder;
  error?: string;
  code?:
    | 'IDENTITY_REQUIRED'
    | 'HEALTH_RED'
    | 'EMPTY_CART'
    | 'INVALID_INPUT'
    | 'INTERNAL_ERROR';
}

const DEFAULT_CURRENCY = 'INR';

function validateAddress(
  addr: CreateOrderInput['shippingAddress'] | undefined,
): string | null {
  if (!addr) return 'Shipping address is required';
  if (!addr.name?.trim()) return 'Shipping address is missing a name';
  if (!addr.phone?.trim()) return 'Shipping address is missing a phone';
  if (!addr.line1?.trim()) return 'Shipping address is missing line 1';
  if (!addr.city?.trim()) return 'Shipping address is missing a city';
  if (!addr.postalCode?.trim()) return 'Shipping address is missing a postal code';
  return null;
}

export async function createOrderFromCartAction(
  partnerId: string,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (!partnerId) {
    return { success: false, error: 'partnerId is required', code: 'INVALID_INPUT' };
  }
  if (!input?.conversationId) {
    return { success: false, error: 'conversationId is required', code: 'INVALID_INPUT' };
  }
  const addrErr = validateAddress(input.shippingAddress);
  if (addrErr) return { success: false, error: addrErr, code: 'INVALID_INPUT' };

  try {
    // Gate 1: Health. Red partner health → deny (fail-closed BEFORE
    // asking for customer PII). Per ADR §Anon handling + P3.M05.3.
    const healthGate = await evaluatePartnerSaveGate(partnerId);
    if (!healthGate.allow) {
      return {
        success: false,
        error: `Order creation blocked: engine "${healthGate.engine}" health is red. Fix outstanding issues via /admin/relay/health first.`,
        code: 'HEALTH_RED',
      };
    }

    const session = await loadOrCreateSession(partnerId, input.conversationId);

    // Gate 2: Identity. First production consumer of requireIdentityOrThrow
    // per ADR §Anon handling. Throws IdentityRequiredError if no
    // contactId on the session.
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

    // Gate 3: cart must be non-empty.
    if (!session.cart.items.length) {
      return { success: false, error: 'Cart is empty', code: 'EMPTY_CART' };
    }

    const items: OrderItem[] = session.cart.items.map((i) => ({
      itemId: i.itemId,
      moduleSlug: i.moduleSlug,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      variant: i.variant,
      image: i.image,
    }));

    const discountAmount = session.cart.discountAmount ?? 0;
    const pricing = computeOrderPricing(items, discountAmount);

    const now = new Date().toISOString();
    const orderId = generateOrderId();

    const order: RelayOrder = {
      id: orderId,
      partnerId,
      conversationId: input.conversationId,
      contactId,
      items,

      subtotal: pricing.subtotal,
      discountCode: session.cart.discountCode,
      discountAmount: pricing.discountAmount || undefined,
      shippingCost: pricing.shippingCost,
      tax: pricing.tax,
      total: pricing.total,
      currency: DEFAULT_CURRENCY,

      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress ?? input.shippingAddress,

      paymentMethod: input.paymentMethod,
      paymentStatus: 'pending',

      status: 'pending',
      timeline: [
        { status: 'pending', timestamp: now, note: 'Order placed' },
      ],

      createdAt: now,
      updatedAt: now,
      notes: input.notes,
    };

    await partnerOrderRef(partnerId, orderId).set(order);

    // Drain the cart in the session. Booking / customer state is left
    // untouched so the visitor can keep browsing with the same
    // conversationId.
    const clearedCart = recomputeCartTotals(emptyCart());
    await setSessionCart(partnerId, input.conversationId, clearedCart);

    // Write-through to the partner-facing order list. Non-fatal if it
    // throws — the order still exists in its canonical path.
    try {
      revalidatePath('/partner/orders');
    } catch {
      /* ignore — revalidation is best-effort */
    }

    return { success: true, order };
  } catch (e) {
    console.error('[relay-orders] create failed:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create order',
      code: 'INTERNAL_ERROR',
    };
  }
}
