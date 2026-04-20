'use server';

// ── Relay runtime cart actions ──────────────────────────────────────────
//
// Thin orchestration around the pure `cart-reducer`. Each action loads
// (or creates) the session, applies a reducer, writes via targeted
// `setSessionCart` setter, and returns the updated cart.
//
// Per ADR-P4-01 §Anon handling: cart mutations are anon-allowed. No
// `requireIdentityOrThrow`, no `evaluatePartnerSaveGate`. Identity gate
// fires at `createOrder` (P2.M02), not here.

import { loadOrCreateSession, setSessionCart } from '@/lib/relay/session-store';
import type {
  RelaySessionCart,
  RelaySessionItem,
} from '@/lib/relay/session-types';
import {
  reduceCartAdd,
  reduceCartApplyDiscount,
  reduceCartRemove,
  reduceCartUpdate,
  CartCurrencyMismatchError,
} from '@/lib/relay/commerce/cart-reducer';

export interface CartActionResult {
  success: boolean;
  cart?: RelaySessionCart;
  error?: string;
  code?: 'CART_CURRENCY_MISMATCH' | 'INTERNAL_ERROR';
}

export interface DiscountActionResult extends CartActionResult {
  valid?: boolean;
}

function toErr(e: unknown): { error: string; code?: CartActionResult['code'] } {
  if (e instanceof CartCurrencyMismatchError) {
    return { error: e.message, code: e.code };
  }
  return { error: e instanceof Error ? e.message : 'unknown' };
}

export async function addToCartAction(
  conversationId: string,
  partnerId: string,
  item: Omit<RelaySessionItem, 'addedAt' | 'quantity'> & { quantity?: number; currency?: string },
): Promise<CartActionResult> {
  try {
    if (!item?.itemId || !item?.name || typeof item.price !== 'number') {
      return { success: false, error: 'item.itemId, name and price are required' };
    }

    const session = await loadOrCreateSession(partnerId, conversationId);
    const cart = reduceCartAdd(session.cart, {
      itemId: item.itemId,
      moduleSlug: item.moduleSlug,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variant: item.variant,
      image: item.image,
      currency: item.currency,
    });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    console.error('[relay-cart] add failed:', e);
    return { success: false, ...toErr(e) };
  }
}

export async function updateCartItemAction(
  conversationId: string,
  partnerId: string,
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const cart = reduceCartUpdate(session.cart, { itemId, quantity });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    return { success: false, ...toErr(e) };
  }
}

export async function removeFromCartAction(
  conversationId: string,
  partnerId: string,
  itemId: string,
): Promise<CartActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const cart = reduceCartRemove(session.cart, { itemId });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    return { success: false, ...toErr(e) };
  }
}

export async function clearCartAction(
  conversationId: string,
  partnerId: string,
): Promise<CartActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    // Clearing is reduce-to-empty; preserve structure for field-path write.
    const cart = reduceCartRemove(
      { items: [], subtotal: 0, total: 0, currency: session.cart.currency },
      { itemId: '__noop__' },
    );
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    return { success: false, ...toErr(e) };
  }
}

// ── Discount codes ──────────────────────────────────────────────────────
//
// No partner-defined discount catalog yet — accept a small built-in set
// so the contract is exercisable end-to-end. Real codes will plug in via
// a partner subcollection later.

const BUILTIN_DISCOUNTS: Record<string, number> = {
  WELCOME10: 0.1,
  SAVE5: 5, // flat amount
};

export async function applyDiscountCodeAction(
  conversationId: string,
  partnerId: string,
  code: string,
): Promise<DiscountActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const upper = (code || '').trim().toUpperCase();
    const rule = BUILTIN_DISCOUNTS[upper];

    if (!rule) {
      return { success: true, valid: false, cart: session.cart };
    }

    const subtotal = session.cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmount = rule < 1 ? Math.round(subtotal * rule * 100) / 100 : rule;

    const cart = reduceCartApplyDiscount(session.cart, { code: upper, discountAmount });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, valid: true, cart: saved };
  } catch (e) {
    return { success: false, valid: false, ...toErr(e) };
  }
}
