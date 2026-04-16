'use client';

// ── useRelayCheckout ────────────────────────────────────────────────────
//
// Thin client hook around `/api/relay/order`. Exposes `checkout` (create
// order from cart), `lookupOrder` (public tracker lookup), and
// `listOrders` (orders for the current conversation). State is local —
// callers fold the returned `RelayOrder` into their own UI.

import { useCallback, useState } from 'react';
import type {
  OrderAddress,
  OrderLookupResult,
  OrderSummary,
  PaymentMethod,
  RelayOrder,
} from '@/lib/relay/order-types';

interface UseRelayCheckoutOptions {
  partnerId: string;
  conversationId: string;
  onOrderCreated?: (order: RelayOrder) => void;
}

const ORDER_ENDPOINT = '/api/relay/order';

async function postOrder<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(ORDER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

export function useRelayCheckout({
  partnerId,
  conversationId,
  onOrderCreated,
}: UseRelayCheckoutOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<RelayOrder | null>(null);

  const checkout = useCallback(
    async (
      shippingAddress: OrderAddress,
      paymentMethod: PaymentMethod,
      billingAddress?: OrderAddress,
    ): Promise<RelayOrder | null> => {
      setLoading(true);
      setError(null);
      try {
        const data = await postOrder<{
          success: boolean;
          order?: RelayOrder;
          error?: string;
        }>({
          action: 'create',
          partnerId,
          conversationId,
          payload: { shippingAddress, billingAddress, paymentMethod },
        });
        if (data.success && data.order) {
          setOrder(data.order);
          onOrderCreated?.(data.order);
          return data.order;
        }
        setError(data.error || 'Checkout failed');
        return null;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [partnerId, conversationId, onOrderCreated],
  );

  const lookupOrder = useCallback(
    async (orderId: string): Promise<OrderLookupResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${ORDER_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`,
        );
        const data = (await res.json()) as {
          success: boolean;
          order?: OrderLookupResult;
          error?: string;
        };
        if (data.success && data.order) return data.order;
        setError(data.error || 'Order not found');
        return null;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Lookup failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listOrders = useCallback(async (): Promise<OrderSummary[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await postOrder<{
        success: boolean;
        orders?: OrderSummary[];
        error?: string;
      }>({ action: 'list', partnerId, conversationId });
      if (data.success && data.orders) return data.orders;
      setError(data.error || 'Failed to load orders');
      return [];
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, [partnerId, conversationId]);

  return { checkout, lookupOrder, listOrders, loading, error, order };
}

export type UseRelayCheckoutReturn = ReturnType<typeof useRelayCheckout>;
