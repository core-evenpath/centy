'use client';

// ── useRelaySession ────────────────────────────────────────────────────
//
// Client-side hook around `/api/relay/action`. Loads the session once on
// mount and exposes thin wrappers around each action that update local
// state from the server response. Designed to be passed straight into
// `BlockRenderer` callbacks.

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RelayBookingSlot,
  RelaySession,
  RelaySessionBooking,
  RelaySessionCart,
  RelaySessionItem,
} from '@/lib/relay/session-types';
import { emptyBooking, emptyCart } from '@/lib/relay/session-types';

interface UseRelaySessionOptions {
  conversationId: string;
  partnerId: string;
  onCartUpdate?: (cart: RelaySessionCart) => void;
  onBookingUpdate?: (booking: RelaySessionBooking) => void;
}

interface ActionResponse {
  success: boolean;
  session?: RelaySession;
  cart?: RelaySessionCart;
  booking?: RelaySessionBooking;
  bookingId?: string;
  valid?: boolean;
  error?: string;
}

const ACTION_ENDPOINT = '/api/relay/action';

async function postAction(
  action: string,
  conversationId: string,
  partnerId: string,
  payload: Record<string, unknown> = {},
): Promise<ActionResponse> {
  const res = await fetch(ACTION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, conversationId, partnerId, payload }),
  });
  return (await res.json()) as ActionResponse;
}

export function useRelaySession({
  conversationId,
  partnerId,
  onCartUpdate,
  onBookingUpdate,
}: UseRelaySessionOptions) {
  const [session, setSession] = useState<RelaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stash callbacks in a ref so the action wrappers don't need to be
  // re-created when consumers pass a fresh closure each render.
  const cbRef = useRef({ onCartUpdate, onBookingUpdate });
  cbRef.current = { onCartUpdate, onBookingUpdate };

  // Initial fetch / lazy create.
  useEffect(() => {
    if (!conversationId || !partnerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    postAction('get_session', conversationId, partnerId)
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.session) setSession(data.session);
        else if (data.error) setError(data.error);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'unknown'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [conversationId, partnerId]);

  const applyResponse = useCallback((data: ActionResponse) => {
    if (!data.success) return;
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (data.cart) next.cart = data.cart;
      if (data.booking) next.booking = data.booking;
      if (data.session) return data.session;
      return next;
    });
    if (data.cart) cbRef.current.onCartUpdate?.(data.cart);
    if (data.booking) cbRef.current.onBookingUpdate?.(data.booking);
  }, []);

  const exec = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      const data = await postAction(action, conversationId, partnerId, payload);
      applyResponse(data);
      return data;
    },
    [conversationId, partnerId, applyResponse],
  );

  // ── Cart ──
  const addToCart = useCallback(
    (item: Omit<RelaySessionItem, 'addedAt' | 'quantity'> & { quantity?: number }) =>
      exec('add_to_cart', item as never),
    [exec],
  );
  const updateCartItem = useCallback(
    (itemId: string, quantity: number) => exec('update_cart', { itemId, quantity }),
    [exec],
  );
  const removeFromCart = useCallback(
    (itemId: string) => exec('remove_from_cart', { itemId }),
    [exec],
  );
  const clearCart = useCallback(() => exec('clear_cart'), [exec]);
  const applyDiscount = useCallback((code: string) => exec('apply_discount', { code }), [exec]);

  // ── Booking ──
  const reserveSlot = useCallback(
    (slot: Omit<RelayBookingSlot, 'reservedAt' | 'status'>) =>
      exec('reserve_slot', slot as never),
    [exec],
  );
  const cancelSlot = useCallback(
    (slotId: string) => exec('cancel_slot', { slotId }),
    [exec],
  );
  const confirmBooking = useCallback(() => exec('confirm_booking'), [exec]);

  return {
    session,
    loading,
    error,
    cart: session?.cart ?? emptyCart(),
    booking: session?.booking ?? emptyBooking(),
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyDiscount,
    reserveSlot,
    cancelSlot,
    confirmBooking,
  };
}

export type UseRelaySessionReturn = ReturnType<typeof useRelaySession>;
